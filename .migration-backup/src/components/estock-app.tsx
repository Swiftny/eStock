"use client";

import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { HistoryMovement as Movement } from "@/lib/estock-history";
import { ClearRecordsControl } from "./clear-records-control";
import { ManagerHistory } from "./manager-history";
import styles from "./estock-app.module.css";
import { Notifications, ReceivingWorkspace } from "./receiving-workspace";
import { ReceiptImagePicker } from "./receipt-image-picker";
import { Icon, Wordmark } from "./ui";

type Role = "manager" | "staff";
type Page = "inventory" | "products" | "scan" | "drafts" | "history" | "receiving";
type MovementType = "TAKE" | "RETURN";

type Product = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  lowStock: boolean;
  version: number;
};

type Candidate = { id: string; name: string; unit: string };
type DraftLine = {
  id: string;
  rawName: string;
  rawQuantity: number | null;
  rawUnit: string | null;
  quantityText: string | null;
  reviewedName?: string | null;
  needsReview: boolean;
  reviewReason: string | null;
  productId: string | null;
  suggestedProductId?: string | null;
  approvedQuantity: number | null;
  excluded: boolean;
  exclusionReason?: string | null;
  confirmAlias?: boolean;
  candidates: Candidate[];
};
type Draft = {
  id: string;
  status: "DRAFT" | "AWAITING_STAFF" | "RECEIVED" | "APPROVED" | "DISCARDED";
  revision: number;
  documentDate: string | null;
  extractedDocumentDate: string | null;
  documentType: string;
  imageStatus: "clear" | "partial" | "unreadable" | "unknown";
  dateNeedsReview: boolean;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
  similarDocumentWarning?: string | null;
  lines: DraftLine[];
};
type DraftEdit = {
  id: string;
  reviewedName: string;
  productId: string;
  approvedQuantity: string;
  excluded: boolean;
  exclusionReason: string;
  confirmAlias: boolean;
};

class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { cache: "no-store", credentials: "same-origin", ...init });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  } & T;
  if (!response.ok) {
    throw new ApiError(
      body.error || "The request could not be completed. Try again.",
      response.status,
      body.code,
    );
  }
  return body;
}

function json(method: "POST" | "PATCH" | "DELETE", value: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) };
}

function message(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (cause.status === 409) return `${cause.message} Refresh the record before trying again.`;
    if (cause.status === 503) return `${cause.message} Your stock has not changed.`;
    return cause.message;
  }
  return cause instanceof Error ? cause.message : "Something went wrong. Try again.";
}

function requestId() {
  return crypto.randomUUID();
}

function retryKey(ref: { current: { signature: string; key: string } | null }, payload: unknown) {
  const signature = JSON.stringify(payload);
  if (ref.current?.signature !== signature) ref.current = { signature, key: requestId() };
  return ref.current.key;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date needed";
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00+08:00`)
    : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Time unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

function ErrorNotice({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className={styles.errorNotice} role="alert">
      <p>{text}</p>
      {onRetry && (
        <button className={styles.textButton} type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.emptyState}>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function EStockApp() {
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [page, setPage] = useState<Page>("inventory");
  const [products, setProducts] = useState<Product[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [history, setHistory] = useState<Movement[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPending, setScanPending] = useState(false);
  const [scanSlow, setScanSlow] = useState(false);
  const [scanError, setScanError] = useState("");
  const [authRole, setAuthRole] = useState<Role>("manager");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [movementTarget, setMovementTarget] = useState<{
    product: Product;
    type: MovementType;
  } | null>(null);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [productDialog, setProductDialog] = useState(false);
  const [query, setQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<Product[] | null>(null);
  const [searchPending, setSearchPending] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchRevision, setSearchRevision] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const activeSearchRevision = useRef(0);
  const scanPendingRef = useRef(false);
  const scanAutoOpenRef = useRef(false);
  const sessionRole = useRef<Role | null>(null);
  const sessionRevision = useRef(0);
  const signingInRef = useRef(false);

  useEffect(() => {
    if (!scanPending) return;
    const timer = window.setTimeout(() => setScanSlow(true), 10_000);
    return () => window.clearTimeout(timer);
  }, [scanPending]);

  const loadProducts = useCallback(async () => {
    const result = await api<{ products: Product[] }>("/api/estock/products");
    setProducts(result.products);
    return result.products;
  }, []);
  const loadDrafts = useCallback(async () => {
    const result = await api<{ drafts: Draft[] }>("/api/estock/drafts");
    setDrafts(result.drafts);
  }, []);
  const loadHistory = useCallback(async () => {
    const result = await api<{ movements: Movement[] }>("/api/estock/history");
    setHistory(result.movements);
  }, []);
  const loadData = useCallback(async (currentRole: Role) => {
    setLoadingData(true);
    setDataReady(false);
    setError("");
    try {
      const productsResult = await api<{ products: Product[] }>("/api/estock/products");
      setProducts(productsResult.products);
      if (currentRole === "manager") {
        const [draftsResult, historyResult] = await Promise.all([
          api<{ drafts: Draft[] }>("/api/estock/drafts"),
          api<{ movements: Movement[] }>("/api/estock/history"),
        ]);
        setDrafts(draftsResult.drafts);
        setHistory(historyResult.movements);
      } else {
        setDrafts([]);
        setHistory([]);
      }
      setDataReady(true);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) setRole(null);
      setError(message(cause));
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    activeSearchRevision.current = searchRevision;
    if (!role || !query.trim()) {
      setSearchMatches(null);
      setSearchPending(false);
      setSearchError("");
      return;
    }
    const controller = new AbortController();
    setSearchPending(true);
    setSearchMatches(null);
    setSearchError("");
    const timer = window.setTimeout(() => {
      void api<{ products: Product[] }>(
        `/api/estock/products?q=${encodeURIComponent(query.trim())}`,
        { signal: controller.signal },
      )
        .then((result) => {
          if (!controller.signal.aborted && activeSearchRevision.current === searchRevision)
            setSearchMatches(result.products);
        })
        .catch((cause) => {
          if (!controller.signal.aborted) setSearchError(message(cause));
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchPending(false);
        });
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, role, searchRevision]);

  useEffect(() => {
    let live = true;
    let busy = false;
    const refreshSession = async () => {
      if (busy || signingInRef.current) return;
      busy = true;
      const revision = sessionRevision.current;
      try {
        const session = await api<{ authenticated: boolean; role?: Role }>("/api/estock/session");
        if (!live || revision !== sessionRevision.current) return;
        const next = session.authenticated && session.role ? session.role : null;
        if (next !== sessionRole.current) {
          sessionRole.current = next;
          setRole(next);
          setPage("inventory");
          setQuery("");
          setNotice("");
          setPassword("");
          setShowPassword(false);
          setMovementTarget(null);
          setEditTarget(null);
          setDeleteTarget(null);
          setProductDialog(false);
          setSelectedDraftId(null);
          setSelectedReceiptId(null);
          if (next) await loadData(next);
          else {
            setProducts([]);
            setDrafts([]);
            setHistory([]);
            setDataReady(false);
          }
        }
      } catch (cause) {
        if (live && revision === sessionRevision.current) setError(message(cause));
      } finally {
        busy = false;
        if (live && revision === sessionRevision.current) setInitializing(false);
      }
    };
    const restoreSession = (event: PageTransitionEvent) => {
      if (event.persisted) setInitializing(true);
      void refreshSession();
    };
    const visible = () => {
      if (document.visibilityState === "visible") void refreshSession();
    };
    void refreshSession();
    window.addEventListener("pageshow", restoreSession);
    window.addEventListener("focus", refreshSession);
    document.addEventListener("visibilitychange", visible);
    return () => {
      live = false;
      window.removeEventListener("pageshow", restoreSession);
      window.removeEventListener("focus", refreshSession);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [loadData]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (signingInRef.current) return;
    signingInRef.current = true;
    sessionRevision.current += 1;
    setSigningIn(true);
    setError("");
    try {
      const result = await api<{ role: Role }>(
        "/api/estock/session",
        json("POST", { role: authRole, password }),
      );
      sessionRole.current = result.role;
      setRole(result.role);
      setPage("inventory");
      window.history.replaceState(window.history.state, "", "#inventory");
      setPassword("");
      setShowPassword(false);
      await loadData(result.role);
    } catch (cause) {
      setError(message(cause));
    } finally {
      signingInRef.current = false;
      setSigningIn(false);
    }
  }

  async function submitScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scanFile || scanPendingRef.current) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(scanFile.type)) {
      setScanError("Choose a JPEG, PNG or WebP image.");
      return;
    }
    if (scanFile.size > 6 * 1024 * 1024) {
      setScanError("Choose an image smaller than 6 MB.");
      return;
    }

    scanPendingRef.current = true;
    scanAutoOpenRef.current = true;
    setScanPending(true);
    setScanSlow(false);
    setScanError("");
    setNotice("");
    try {
      const form = new FormData();
      form.append("image", scanFile);
      const result = await api<{ draft: Draft }>("/api/estock/drafts", {
        method: "POST",
        body: form,
      });
      setScanFile(null);
      setDrafts((current) => [
        result.draft,
        ...current.filter((item) => item.id !== result.draft.id),
      ]);
      setSelectedDraftId(result.draft.id);
      if (scanAutoOpenRef.current) {
        go("drafts");
      } else {
        setNotice("Draft created. Open Drafts to review it.");
      }
      void loadDrafts().catch((cause) =>
        setError(`Draft created, but the list could not refresh: ${message(cause)}`),
      );
    } catch (cause) {
      const detail = message(cause);
      setScanError(
        cause instanceof ApiError
          ? detail
          : `${detail} Check Drafts before retrying; the server may have saved a draft even if the response was lost.`,
      );
      if (!scanAutoOpenRef.current) {
        setNotice(
          "Scan needs attention. Check Drafts, then return to Scan receipt to retry with the selected photo.",
        );
      }
    } finally {
      scanPendingRef.current = false;
      scanAutoOpenRef.current = false;
      setScanPending(false);
      setScanSlow(false);
    }
  }

  function go(next: Page) {
    if (role === "staff" && !["inventory", "receiving"].includes(next)) return;
    if (scanPendingRef.current && next !== "scan") scanAutoOpenRef.current = false;
    window.history.pushState(window.history.state, "", `#${next}`);
    setPage(next);
    setError("");
    setNotice("");
    if (["inventory", "products"].includes(next) && role) void loadData(role);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
      mainRef.current?.focus({ preventScroll: true });
    });
  }

  useEffect(() => {
    if (!role) return;
    const restore = () => {
      const [destination, record] = window.location.hash.slice(1).split("/");
      if (scanPendingRef.current && destination !== "scan") scanAutoOpenRef.current = false;
      const allowed =
        role === "manager"
          ? ["inventory", "products", "scan", "drafts", "history", "receiving"]
          : ["inventory", "receiving"];
      setPage(allowed.includes(destination) ? (destination as Page) : "inventory");
      setSelectedReceiptId(destination === "receiving" && record ? record : null);
      if (destination === "drafts" && record) setSelectedDraftId(record);
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        mainRef.current?.focus({ preventScroll: true });
      });
    };
    restore();
    window.addEventListener("popstate", restore);
    window.addEventListener("hashchange", restore);
    return () => {
      window.removeEventListener("popstate", restore);
      window.removeEventListener("hashchange", restore);
    };
  }, [role]);
  function openReceipt(id: string | null) {
    go("receiving");
    setSelectedReceiptId(id);
    window.history.replaceState(window.history.state, "", `#receiving${id ? `/${id}` : ""}`);
  }

  const visibleProducts = useMemo(
    () => (query.trim() ? searchMatches || [] : products),
    [products, query, searchMatches],
  );
  const sections: { page: Page; label: string }[] = [
    { page: "inventory", label: "Inventory" },
    ...(role === "manager"
      ? ([
          { page: "scan", label: "Scan receipt" },
          { page: "drafts", label: "Drafts" },
          { page: "history", label: "History" },
        ] as const)
      : ([{ page: "receiving", label: "Pending checks" }] as const)),
  ];

  if (initializing) {
    return (
      <main className={styles.boot} role="status" aria-busy="true">
        <Wordmark />
        <p>Opening inventory…</p>
      </main>
    );
  }

  if (!role) {
    return (
      <div className={styles.app} lang="en-MY">
        <a className={styles.skip} href="#estock-main">
          Skip to sign in
        </a>
        <header className={styles.header}>
          <div className="site-header-frame">
            <a href="/" className={styles.homeLink} aria-label="eStock home">
              <Wordmark />
            </a>
            <span className={styles.headerHint}>Warehouse inventory</span>
          </div>
        </header>
        <main id="estock-main" className={styles.signIn}>
          <div className={styles.signInIntro}>
            <p className={styles.kicker}>Your workspace</p>
            <h1>Sign in to eStock</h1>
            <p>
              Manager prepares receipts. Shared Staff checks deliveries and records stock taken or
              returned.
            </p>
          </div>
          <form className={styles.signInForm} onSubmit={signIn} aria-busy={signingIn}>
            <fieldset disabled={signingIn}>
              <legend>Account</legend>
              <div className={styles.roleChoices}>
                <label
                  className={authRole === "manager" ? styles.roleChoiceActive : styles.roleChoice}
                >
                  <input
                    type="radio"
                    name="role"
                    value="manager"
                    checked={authRole === "manager"}
                    onChange={() => setAuthRole("manager")}
                  />
                  <span>
                    <strong>Manager</strong>
                    <small>Inventory and receipt preparation</small>
                  </span>
                </label>
                <label
                  className={authRole === "staff" ? styles.roleChoiceActive : styles.roleChoice}
                >
                  <input
                    type="radio"
                    name="role"
                    value="staff"
                    checked={authRole === "staff"}
                    onChange={() => setAuthRole("staff")}
                  />
                  <span>
                    <strong>Staff</strong>
                    <small>Check deliveries, Take and Return</small>
                  </span>
                </label>
              </div>
            </fieldset>
            <div className={styles.field}>
              <label htmlFor="access-code">Access code</label>
              <div className={styles.secretInput}>
                <input
                  id="access-code"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={signingIn}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide access code" : "Show access code"}
                  aria-pressed={showPassword}
                  disabled={signingIn}
                  onClick={() => setShowPassword((shown) => !shown)}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} />
                </button>
              </div>
            </div>
            {error && <ErrorNotice text={error} />}
            <button className={styles.primaryButton} type="submit" disabled={signingIn}>
              {signingIn ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.app} lang="en-MY">
      <a className={styles.skip} href="#estock-main">
        Skip to inventory workspace
      </a>
      <header className={`${styles.header} ${styles.workspaceHeader}`}>
        <div className="site-header-frame">
          <a href="/" className={styles.homeLink} aria-label="eStock home">
            <Wordmark />
          </a>
          <nav className={styles.navigation} aria-label="Workspace sections">
            {sections.map((section) => (
              <button
                key={section.page}
                type="button"
                className={
                  page === section.page || (page === "products" && section.page === "inventory")
                    ? styles.navActive
                    : styles.navItem
                }
                aria-current={
                  page === section.page || (page === "products" && section.page === "inventory")
                    ? "page"
                    : undefined
                }
                onClick={() =>
                  section.page === "receiving" ? openReceipt(null) : go(section.page)
                }
              >
                {section.label}
              </button>
            ))}
          </nav>
          <div className={styles.account}>
            <span className={styles.accountRole}>{role === "manager" ? "Manager" : "Staff"}</span>
            <Notifications role={role} onOpen={(id) => openReceipt(id)} />
          </div>
        </div>
      </header>
      <div className={styles.shell}>
        <main
          id="estock-main"
          ref={mainRef}
          className={styles.main}
          tabIndex={-1}
          aria-busy={loadingData}
        >
          {error && dataReady && <ErrorNotice text={error} onRetry={() => void loadData(role)} />}
          {notice && (
            <div className={styles.notice} role="status">
              {notice}
            </div>
          )}
          {role === "manager" && scanPending && page !== "scan" && (
            <div className={styles.notice} role="status" aria-live="polite">
              {scanSlow
                ? "Still reading your document. You can keep using eStock; we will show the result when it finishes."
                : "Reading your document. The scan will continue while you use eStock."}{" "}
              <button className={styles.textButton} type="button" onClick={() => go("scan")}>
                View scan
              </button>
            </div>
          )}
          {loadingData && (
            <p className={styles.loading} role="status">
              Loading saved stock records…
            </p>
          )}
          {!loadingData && !dataReady && (
            <EmptyState
              title="Inventory unavailable"
              description={error || "The saved warehouse records could not be loaded."}
              action={
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={() => void loadData(role)}
                >
                  Try loading again
                </button>
              }
            />
          )}
          {!loadingData && dataReady && (
            <div key={page} className={styles.screen}>
              {page === "receiving" && (
                <ReceivingWorkspace
                  role={role}
                  selectedId={selectedReceiptId}
                  onSelect={openReceipt}
                  onCompleted={async () => {
                    await loadProducts();
                    if (role === "manager") await loadHistory();
                  }}
                />
              )}
              {(page === "inventory" || (role === "manager" && page === "products")) && (
                <Inventory
                  management={page === "products"}
                  role={role}
                  products={products}
                  visibleProducts={visibleProducts}
                  query={query}
                  searchPending={searchPending}
                  searchError={searchError}
                  onQuery={setQuery}
                  onAdd={() => setProductDialog(true)}
                  onManage={() => go("products")}
                  onBack={() => go("inventory")}
                  onDeletedAll={async () => {
                    setQuery("");
                    setSearchMatches(null);
                    setSearchRevision((value) => value + 1);
                    await Promise.all([loadProducts(), loadDrafts(), loadHistory()]);
                  }}
                  onMove={(product, type) => setMovementTarget({ product, type })}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                />
              )}
              {role === "manager" && page === "scan" && (
                <ScanReceipt
                  file={scanFile}
                  pending={scanPending}
                  slow={scanSlow}
                  error={scanError}
                  onFileChange={(image) => {
                    setScanFile(image);
                    setScanError("");
                  }}
                  onSubmit={submitScan}
                />
              )}
              {role === "manager" && page === "drafts" && (
                <Drafts
                  drafts={drafts}
                  products={products}
                  selectedId={selectedDraftId}
                  onSelect={setSelectedDraftId}
                  onRefresh={loadDrafts}
                  onChanged={async () => {
                    await Promise.all([loadDrafts(), loadProducts(), loadHistory()]);
                    setSearchRevision((current) => current + 1);
                  }}
                  onProductCreated={(product) => {
                    setProducts((current) =>
                      [...current, product].sort((a, b) => a.name.localeCompare(b.name)),
                    );
                    setSearchRevision((current) => current + 1);
                  }}
                />
              )}
              {role === "manager" && page === "history" && (
                <History
                  movements={history}
                  drafts={drafts}
                  onRefresh={loadHistory}
                  onDraftsRefresh={loadDrafts}
                />
              )}
            </div>
          )}
        </main>
      </div>
      {movementTarget && (
        <MovementDialog
          key={`${movementTarget.product.id}:${movementTarget.type}`}
          product={movementTarget.product}
          type={movementTarget.type}
          onClose={() => setMovementTarget(null)}
          onAvailability={(latest) => {
            setProducts(latest);
            setSearchRevision((current) => current + 1);
          }}
          onSaved={async (updated) => {
            setMovementTarget(null);
            setNotice("Movement saved. Refreshing current stock…");
            try {
              const latest = await loadProducts();
              const current = latest.find((item) => item.id === updated.id);
              setNotice(
                current
                  ? `${current.name}: ${current.stock} ${current.unit} in stock.`
                  : "Movement saved. Refresh inventory to see current stock.",
              );
            } catch (cause) {
              setNotice("Movement saved. Current stock could not be refreshed.");
              setError(message(cause));
            }
            setSearchRevision((current) => current + 1);
            if (role === "manager")
              void loadHistory().catch((cause) =>
                setError(`Movement saved, but History could not refresh: ${message(cause)}`),
              );
          }}
        />
      )}
      {deleteTarget && role === "manager" && (
        <DeleteProductDialog
          product={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={async () => {
            setDeleteTarget(null);
            setNotice("Product deleted. Transaction history is retained.");
            await loadProducts();
            setSearchRevision((v) => v + 1);
            requestAnimationFrame(() => mainRef.current?.focus());
          }}
        />
      )}
      {editTarget && role === "manager" && (
        <EditProductDialog
          product={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setProducts((current) =>
              current.map((item) => (item.id === updated.id ? updated : item)),
            );
            setSearchRevision((current) => current + 1);
            setEditTarget(null);
            setNotice(`${updated.name} updated.`);
          }}
        />
      )}
      {productDialog && role === "manager" && (
        <ProductDialog
          onClose={() => setProductDialog(false)}
          onCreated={async (product) => {
            setProducts((current) =>
              [...current, product].sort((a, b) => a.name.localeCompare(b.name)),
            );
            setSearchRevision((current) => current + 1);
            setProductDialog(false);
            setNotice(`${product.name} added with ${product.stock} ${product.unit} in stock.`);
            void loadHistory().catch((cause) =>
              setError(`Product added, but History could not refresh: ${message(cause)}`),
            );
          }}
        />
      )}
    </div>
  );
}

function Inventory({
  management,
  role,
  products,
  visibleProducts,
  query,
  searchPending,
  searchError,
  onQuery,
  onAdd,
  onManage,
  onBack,
  onDeletedAll,
  onMove,
  onEdit,
  onDelete,
}: {
  management: boolean;
  role: Role;
  products: Product[];
  visibleProducts: Product[];
  query: string;
  searchPending: boolean;
  searchError: string;
  onQuery: (value: string) => void;
  onAdd: () => void;
  onManage: () => void;
  onBack: () => void;
  onDeletedAll: () => Promise<void>;
  onMove: (product: Product, type: MovementType) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const deletionAttempt = useRef<{ signature: string; key: string } | null>(null);
  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <h1>{management ? "Manage products" : "Inventory"}</h1>
          <p>
            {management ? "Edit product names or delete products." : "Search and update stock."}
          </p>
        </div>
        {role === "manager" && (
          <div className={styles.pageActions}>
            {management ? (
              <button className={styles.secondaryButton} type="button" onClick={onBack}>
                Back to inventory
              </button>
            ) : (
              <button className={styles.secondaryButton} type="button" onClick={onManage}>
                Manage products
              </button>
            )}
            <button className={styles.primaryButton} type="button" onClick={onAdd}>
              Add product
            </button>
          </div>
        )}
      </div>
      <div className={styles.inventoryToolbar}>
        <label className={styles.field}>
          <span>Search products</span>
          <input
            type="search"
            value={query}
            placeholder="Search by product name"
            onChange={(event) => onQuery(event.target.value)}
          />
        </label>
        <p role="status">
          {visibleProducts.length} of {products.length} products
        </p>
      </div>
      {searchPending ? (
        <p className={styles.loading} role="status">
          Searching products and confirmed aliases…
        </p>
      ) : searchError ? (
        <ErrorNotice text={searchError} onRetry={() => onQuery("")} />
      ) : !products.length ? (
        <EmptyState
          title="No products yet"
          description={
            role === "manager"
              ? "Add your first product and its opening stock to start the warehouse record."
              : "Your manager needs to add products before you can record stock."
          }
          action={
            role === "manager" ? (
              <button className={styles.primaryButton} type="button" onClick={onAdd}>
                Add first product
              </button>
            ) : undefined
          }
        />
      ) : !visibleProducts.length ? (
        <EmptyState
          title="No matching products"
          description="Try another product name or confirmed supplier alias."
        />
      ) : (
        <ul
          className={styles.inventoryList}
          aria-label={management ? "Products to manage" : "Current warehouse stock"}
        >
          <li className={styles.inventoryHeader} aria-hidden="true">
            <span>Product</span>
            <span>In stock</span>
            <span>Status</span>
            <span>Actions</span>
          </li>
          {visibleProducts.map((item) => (
            <li className={styles.inventoryRow} key={item.id}>
              <div className={styles.productIdentity}>
                <strong>{item.name}</strong>
                <small>{item.unit}</small>
              </div>
              <div className={styles.stockNumber}>
                <strong>{item.stock}</strong>
                <small>{item.unit}</small>
              </div>
              <div>
                <span className={item.stock < 5 ? styles.lowStatus : styles.stockStatus}>
                  {item.stock === 0 ? "Out of stock" : item.stock < 5 ? "Low stock" : "In stock"}
                </span>
              </div>
              <div className={styles.rowActions}>
                {management && role === "manager" ? (
                  <>
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      onClick={() => onEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      aria-label={`Delete ${item.name}`}
                      onClick={() => onDelete(item)}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      disabled={item.stock === 0}
                      onClick={() => onMove(item, "TAKE")}
                    >
                      Take
                    </button>
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      onClick={() => onMove(item, "RETURN")}
                    >
                      Return
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {management && role === "manager" && (
        <section className={styles.inventoryReset} aria-label="Delete inventory">
          <h2>Delete all inventory</h2>
          <p>
            Permanently remove every product and its stock balance, including archived products.
            Receipt and activity history remain. Pending checks return to Drafts for correction.
          </p>
          <ClearRecordsControl
            label="Delete all inventory"
            phrase="Delete All Inventory"
            description="This cannot be undone. All product names, stock balances and confirmed aliases will be deleted."
            disabled={false}
            confirmLabel="Delete permanently"
            pendingLabel="Deleting…"
            onClear={async (confirmation) => {
              const payload = { confirmation };
              const result = await api<{ deletedProducts: number }>(
                "/api/estock/products",
                json("DELETE", {
                  ...payload,
                  requestId: retryKey(deletionAttempt, payload),
                }),
              );
              await onDeletedAll();
              deletionAttempt.current = null;
              return `${result.deletedProducts} products permanently deleted.`;
            }}
          />
        </section>
      )}
    </>
  );
}

function MovementDialog({
  product,
  type,
  onClose,
  onSaved,
  onAvailability,
}: {
  product: Product;
  type: MovementType;
  onClose: () => void;
  onSaved: (product: Product) => Promise<void>;
  onAvailability: (products: Product[]) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const [available, setAvailable] = useState(product.stock);
  const [active, setActive] = useState(true);
  const invalid = (value: string) =>
    value !== "" &&
    (!Number.isSafeInteger(Number(value)) ||
      Number(value) <= 0 ||
      (type === "TAKE" && Number(value) > available));
  const [quantity, setQuantity] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    opener.current = document.activeElement;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      if (opener.current instanceof HTMLElement && opener.current.isConnected)
        opener.current.focus();
      else document.getElementById("estock-main")?.focus();
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !active) return;
    const amount = Number(quantity);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("Enter a whole number greater than zero.");
      return;
    }
    if (type === "TAKE" && amount > available) {
      setError(
        `Only ${available} ${product.unit} available. Check the current stock and try again.`,
      );
      return;
    }
    setPending(true);
    setError("");
    const payload = { productId: product.id, type, quantity: amount };
    try {
      const result = await api<{ product: Product }>(
        "/api/estock/movements",
        json("POST", { ...payload, requestId: retryKey(attempt, payload) }),
      );
      attempt.current = null;
      await onSaved(result.product);
    } catch (cause) {
      setError(message(cause));
      if (
        cause instanceof ApiError &&
        ["INSUFFICIENT_STOCK", "ARCHIVED_PRODUCT"].includes(cause.code || "")
      ) {
        try {
          const result = await api<{ products: Product[] }>("/api/estock/products");
          onAvailability(result.products);
          const current = result.products.find((p) => p.id === product.id);
          setAvailable(current?.stock ?? 0);
          setActive(Boolean(current));
        } catch {
          setError("Could not refresh available stock. Close and reopen this dialog.");
          setActive(false);
        }
      }
    } finally {
      setPending(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="movement-title"
      onCancel={(event) => {
        if (pending) event.preventDefault();
        else onClose();
      }}
    >
      <div className={styles.dialogHead}>
        <div>
          <p className={styles.kicker}>Stock movement</p>
          <h2 id="movement-title">
            {type === "TAKE" ? "Take" : "Return"} {product.name}
          </h2>
        </div>
        <button
          className={styles.closeButton}
          type="button"
          disabled={pending}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <p className={styles.dialogContext}>
        Current stock:{" "}
        <strong>
          {available} {product.unit}
        </strong>
      </p>
      <form onSubmit={(event) => void submit(event)} aria-busy={pending}>
        <label className={styles.field}>
          <span>Quantity ({product.unit})</span>
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            min="1"
            max={type === "TAKE" ? available : undefined}
            aria-invalid={invalid(quantity)}
            aria-describedby="quantity-hint"
            step="1"
            required
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value);
              setError("");
            }}
          />
        </label>
        <p id="quantity-hint" className={invalid(quantity) ? styles.errorNotice : styles.smallCopy}>
          {invalid(quantity)
            ? type === "TAKE"
              ? `Enter a positive whole number up to ${available}.`
              : "Enter a positive whole number."
            : type === "TAKE"
              ? `Available: ${available} ${product.unit}`
              : "Enter usable goods returned."}
        </p>
        {type === "RETURN" && (
          <p className={styles.smallCopy}>
            Only return goods that are physically back in usable warehouse stock.
          </p>
        )}
        {error && <ErrorNotice text={error} />}
        <div className={styles.dialogActions}>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.primaryButton}
            type="submit"
            disabled={
              pending ||
              !active ||
              quantity === "" ||
              invalid(quantity) ||
              (type === "TAKE" && available === 0)
            }
          >
            {pending ? "Saving…" : `Confirm ${type === "TAKE" ? "Take" : "Return"}`}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function DeleteProductDialog({
  product,
  onClose,
  onDeleted,
}: {
  product: Product;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    opener.current = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="delete-product-title"
      onCancel={(event) => {
        if (pending) event.preventDefault();
        else onClose();
      }}
    >
      <h2 id="delete-product-title">Delete {product.name}?</h2>
      <p>
        Current stock:{" "}
        <strong>
          {product.stock} {product.unit}
        </strong>
        . This removes the product from active Inventory. Transaction history and the
        remaining-stock snapshot are retained.
      </p>
      {error && <ErrorNotice text={error} />}
      <div className={styles.dialogActions}>
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={pending}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className={styles.dangerButton}
          type="button"
          disabled={pending}
          onClick={async () => {
            if (pending) return;
            setPending(true);
            setError("");
            const payload = { expectedVersion: product.version };
            try {
              await api(
                `/api/estock/products/${product.id}`,
                json("DELETE", {
                  ...payload,
                  requestId: retryKey(attempt, { id: product.id, ...payload }),
                }),
              );
              await onDeleted();
            } catch (cause) {
              setError(message(cause));
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </dialog>
  );
}

function ProductDialog({
  onClose,
  onCreated,
  initialName = "",
  openingLocked = false,
  preparationDraftId,
}: {
  onClose: () => void;
  onCreated: (product: Product) => Promise<void> | void;
  initialName?: string;
  openingLocked?: boolean;
  preparationDraftId?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const [name, setName] = useState(initialName.slice(0, 120));
  const [unit, setUnit] = useState("pcs");
  const [openingStock, setOpeningStock] = useState("0");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    opener.current = document.activeElement;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = openingLocked ? 0 : Number(openingStock);
    if (!name.trim() || !unit.trim()) {
      setError("Enter a product name and base unit.");
      return;
    }
    if (!Number.isSafeInteger(amount) || amount < 0) {
      setError("Opening stock must be a whole number of zero or more.");
      return;
    }
    setPending(true);
    setError("");
    const payload = {
      name: name.trim(),
      unit: unit.trim(),
      openingStock: amount,
      preparationDraftId,
    };
    try {
      const result = await api<{ product: Product }>(
        "/api/estock/products",
        json("POST", { ...payload, requestId: retryKey(attempt, payload) }),
      );
      attempt.current = null;
      await onCreated(result.product);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setPending(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="product-dialog-title"
      onCancel={(event) => {
        if (pending) event.preventDefault();
        else onClose();
      }}
    >
      <div className={styles.dialogHead}>
        <div>
          <p className={styles.kicker}>Product setup</p>
          <h2 id="product-dialog-title">Add product</h2>
        </div>
        <button
          className={styles.closeButton}
          type="button"
          disabled={pending}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <form onSubmit={(event) => void submit(event)} aria-busy={pending}>
        <label className={styles.field}>
          <span>Official product name</span>
          <input
            autoFocus
            value={name}
            maxLength={120}
            required
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Base unit</span>
          <input
            value={unit}
            maxLength={24}
            required
            onChange={(event) => setUnit(event.target.value)}
          />
          <small>Use the unit you count in the warehouse, such as pcs.</small>
        </label>
        {openingLocked ? (
          <p className={styles.infoNotice}>
            This product starts at 0. The reviewed receipt quantity will be added once when
            Staff confirms the receipt.
          </p>
        ) : (
          <label className={styles.field}>
            <span>Opening stock</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              required
              value={openingStock}
              onChange={(event) => setOpeningStock(event.target.value)}
            />
          </label>
        )}
        {error && <ErrorNotice text={error} />}
        <div className={styles.dialogActions}>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className={styles.primaryButton} type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add product"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function EditProductDialog({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: (product: Product) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const [name, setName] = useState(product.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    opener.current = document.activeElement;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter an official product name.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await api<{ product: Product }>(
        `/api/estock/products/${encodeURIComponent(product.id)}`,
        json("PATCH", { name: name.trim(), expectedVersion: product.version }),
      );
      onSaved(result.product);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setPending(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="edit-product-title"
      onCancel={(event) => {
        if (pending) event.preventDefault();
        else onClose();
      }}
    >
      <div className={styles.dialogHead}>
        <div>
          <p className={styles.kicker}>Catalogue</p>
          <h2 id="edit-product-title">Edit product</h2>
        </div>
        <button
          className={styles.closeButton}
          type="button"
          disabled={pending}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <form onSubmit={(event) => void submit(event)} aria-busy={pending}>
        <label className={styles.field}>
          <span>Official product name</span>
          <input
            autoFocus
            value={name}
            maxLength={120}
            required
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <p className={styles.smallCopy}>
          Base unit: <strong>{product.unit}</strong>. Existing stock and History will not change
          when you rename this product.
        </p>
        {error && <ErrorNotice text={error} />}
        <div className={styles.dialogActions}>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.primaryButton}
            type="submit"
            disabled={pending || name.trim() === product.name}
          >
            Save name
          </button>
        </div>
      </form>
    </dialog>
  );
}

function ScanReceipt({
  file,
  pending,
  slow,
  error,
  onFileChange,
  onSubmit,
}: {
  file: File | null;
  pending: boolean;
  slow: boolean;
  error: string;
  onFileChange: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <h1>Scan receipt</h1>
          <p>Scan a supplier document.</p>
        </div>
      </div>
      <div className={styles.scanLayout}>
        <form className={styles.scanPanel} onSubmit={onSubmit} aria-busy={pending}>
          <h2>Choose a document image</h2>
          <p className={styles.syntheticNotice}>
            For the competition demo, use team-created synthetic documents only.
          </p>
          <p>
            Make sure product names, quantities and the document date are readable. A receipt,
            invoice or order is text evidence. Staff must check the physical goods before stock is
            added.
          </p>
          <ReceiptImagePicker
            file={file}
            onChange={onFileChange}
            disabled={pending}
            previewDescription="Check that the date, product names and quantities are readable. The selected image stays ready if you switch sections and is cleared after a draft is created."
          />
          {error && <ErrorNotice text={error} />}
          <button className={styles.primaryButton} type="submit" disabled={!file || pending}>
            {pending ? "Reading document…" : "Create draft"}
          </button>
          {pending && (
            <p className={styles.smallCopy} role="status">
              {slow
                ? "Still reading the image. Keep this tab open; stock will stay unchanged."
                : "Gemini is reading the image. Stock will stay unchanged."}
            </p>
          )}
        </form>
        <aside className={styles.scanAside}>
          <h2>What happens next</h2>
          <ol>
            <li>Gemini proposes product descriptions, quantities and a date.</li>
            <li>You correct uncertain lines and match them to products.</li>
            <li>
              You send the prepared receipt to Staff. Their physical check posts actual quantities.
            </li>
          </ol>
          <p>
            The uploaded image is used for this request and is not kept in eStock. Reopened drafts
            contain structured data only.
          </p>
        </aside>
      </div>
    </>
  );
}

function Drafts({
  drafts,
  products,
  selectedId,
  onSelect,
  onRefresh,
  onChanged,
  onProductCreated,
}: {
  drafts: Draft[];
  products: Product[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRefresh: () => Promise<void>;
  onChanged: () => Promise<void>;
  onProductCreated: (product: Product) => void;
}) {
  const [error, setError] = useState("");
  const pendingDrafts = drafts.filter(
    (item) => item.status === "DRAFT" || item.status === "AWAITING_STAFF",
  );
  const currentId =
    selectedId && pendingDrafts.some((item) => item.id === selectedId)
      ? selectedId
      : pendingDrafts.find((item) => item.status === "DRAFT")?.id || pendingDrafts[0]?.id;
  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <h1>Receipt drafts</h1>
          <p>Prepare receipts for Staff.</p>
        </div>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={async () => {
            setError("");
            try {
              await onRefresh();
            } catch (cause) {
              setError(message(cause));
            }
          }}
        >
          Refresh drafts
        </button>
      </div>
      {error && <ErrorNotice text={error} />}
      {!pendingDrafts.length ? (
        <EmptyState
          title="No receipt drafts"
          description="Scan a supplier document to prepare a receipt. Completed and discarded receipts are in History."
        />
      ) : (
        <div className={styles.draftLayout}>
          <section className={styles.draftList} aria-label="Receipt drafts">
            {pendingDrafts.map((item) => (
              <button
                key={item.id}
                type="button"
                className={currentId === item.id ? styles.draftListActive : styles.draftListItem}
                aria-current={currentId === item.id ? "true" : undefined}
                onClick={() => onSelect(item.id)}
              >
                <span className={styles.draftListTop}>
                  <strong>
                    {item.lines.length} {item.lines.length === 1 ? "line" : "lines"}
                  </strong>
                  <span
                    className={item.status === "DRAFT" ? styles.draftStatus : styles.finalStatus}
                  >
                    {item.status === "DRAFT" ? "Draft" : "Awaiting Staff check"}
                  </span>
                </span>
                <small>
                  Document: {formatDate(item.documentDate || item.extractedDocumentDate)}
                </small>
                <small>Updated {formatTime(item.updatedAt)}</small>
              </button>
            ))}
          </section>
          {currentId && (
            <DraftReview
              key={currentId}
              id={currentId}
              products={products}
              onChanged={onChanged}
              onProductCreated={onProductCreated}
            />
          )}
        </div>
      )}
    </>
  );
}

function editsFromDraft(draft: Draft): DraftEdit[] {
  return draft.lines.map((line) => ({
    id: line.id,
    reviewedName: line.reviewedName || line.rawName,
    productId: line.productId || (!line.excluded ? line.suggestedProductId : "") || "",
    approvedQuantity:
      line.approvedQuantity !== null
        ? String(line.approvedQuantity)
        : line.rawQuantity !== null &&
            Number.isSafeInteger(line.rawQuantity) &&
            line.rawQuantity > 0
          ? String(line.rawQuantity)
          : "",
    excluded: line.excluded,
    exclusionReason: line.exclusionReason || "",
    confirmAlias: line.confirmAlias || false,
  }));
}

function draftPatch(documentDate: string, edits: DraftEdit[]) {
  return {
    documentDate: documentDate.trim() || null,
    lines: edits.map((line) => ({
      id: line.id,
      reviewedName: line.reviewedName.trim(),
      productId: line.excluded ? null : line.productId || null,
      approvedQuantity:
        line.excluded || line.approvedQuantity.trim() === "" ? null : Number(line.approvedQuantity),
      excluded: line.excluded,
      exclusionReason: line.excluded ? line.exclusionReason.trim() || null : null,
      confirmAlias: !line.excluded && Boolean(line.productId) && line.confirmAlias,
    })),
  };
}

function DraftReview({
  id,
  products,
  onChanged,
  onProductCreated,
}: {
  id: string;
  products: Product[];
  onChanged: () => Promise<void>;
  onProductCreated: (product: Product) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [documentDate, setDocumentDate] = useState("");
  const [edits, setEdits] = useState<DraftEdit[]>([]);
  const [savedSignature, setSavedSignature] = useState("");

  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [newProductLineId, setNewProductLineId] = useState<string | null>(null);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const approvalAttempt = useRef<{ signature: string; key: string } | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ draft: Draft }>(`/api/estock/drafts/${encodeURIComponent(id)}`);
      setDraft(result.draft);
      const newEdits = editsFromDraft(result.draft);
      const newDate = result.draft.documentDate || result.draft.extractedDocumentDate || "";
      setEdits(newEdits);
      setDocumentDate(newDate);
      setSavedSignature(
        JSON.stringify(
          draftPatch(
            result.draft.documentDate || "",
            newEdits.map((line, index) => ({
              ...line,
              productId: result.draft.lines[index].productId || "",
              approvedQuantity:
                result.draft.lines[index].approvedQuantity === null
                  ? ""
                  : String(result.draft.lines[index].approvedQuantity),
            })),
          ),
        ),
      );

      setDiscardConfirm(false);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);

  function editLine(lineId: string, changes: Partial<DraftEdit>) {
    setEdits((current) =>
      current.map((line) => (line.id === lineId ? { ...line, ...changes } : line)),
    );

    setFeedback("");
  }

  function stepQuantity(lineId: string, change: -1 | 1) {
    setEdits((current) =>
      current.map((line) => {
        if (line.id !== lineId) return line;
        if (line.approvedQuantity.trim() === "" && change === 1)
          return { ...line, approvedQuantity: "1" };
        const value = Number(line.approvedQuantity);
        const next = value + change;
        if (!Number.isSafeInteger(value) || value < 1 || !Number.isSafeInteger(next) || next < 1)
          return line;
        return { ...line, approvedQuantity: String(next) };
      }),
    );
    setFeedback("");
  }

  async function saveChanges(current: Draft): Promise<Draft> {
    const payload = draftPatch(documentDate, edits);
    const signature = JSON.stringify(payload);
    if (signature === savedSignature) return current;
    const result = await api<{ draft: Draft }>(
      `/api/estock/drafts/${encodeURIComponent(id)}`,
      json("PATCH", { expectedRevision: current.revision, ...payload }),
    );
    setDraft(result.draft);
    setSavedSignature(signature);
    return result.draft;
  }

  async function save() {
    if (!draft || pending) return;
    setPending(true);
    setError("");
    setFeedback("");
    try {
      await saveChanges(draft);
      setFeedback("Draft saved. Stock has not changed.");
      void onChanged().catch((cause) =>
        setError(`Draft saved, but the list could not refresh: ${message(cause)}`),
      );
    } catch (cause) {
      setError(message(cause));
    } finally {
      setPending(false);
    }
  }

  const included = edits.filter((line) => !line.excluded);
  const approvalReady = Boolean(
    documentDate &&
      included.length &&
      included.every(
        (line) =>
          line.reviewedName.trim() &&
          line.productId &&
          Number.isSafeInteger(Number(line.approvedQuantity)) &&
          Number(line.approvedQuantity) > 0,
      ) &&
      edits.every((line) => !line.excluded || line.exclusionReason.trim()),
  );

  async function approve() {
    if (!draft || pending) return;
    if (!approvalReady) {
      setError(
        "Enter a document date, resolve each included line, and give a reason for every excluded line.",
      );
      return;
    }
    setPending(true);
    setError("");
    setFeedback("");
    try {
      const saved = await saveChanges(draft);
      if (
        saved.similarDocumentWarning &&
        saved.similarDocumentWarning !== draft.similarDocumentWarning
      ) {
        setError(
          "A similar completed receipt was found. Review the warning, then send again if this is a different delivery.",
        );
        return;
      }
      const payload = { expectedRevision: saved.revision };
      const result = await api<{ draft: Draft }>(
        `/api/estock/drafts/${encodeURIComponent(id)}/send`,
        json("POST", {
          ...payload,
          requestId: retryKey(approvalAttempt, { draftId: id, ...payload }),
        }),
      );
      approvalAttempt.current = null;
      setDraft(result.draft);
      setFeedback("Sent to Staff. Stock will update when Staff confirms the physical goods.");
      void onChanged().catch((cause) =>
        setError(`Receipt sent, but the page could not refresh: ${message(cause)}`),
      );
    } catch (cause) {
      setError(message(cause));
    } finally {
      setPending(false);
    }
  }

  async function discard() {
    if (!draft || pending) return;
    setPending(true);
    setError("");
    try {
      const result = await api<{ draft: Draft }>(
        `/api/estock/drafts/${encodeURIComponent(id)}/discard`,
        json("POST", { expectedRevision: draft.revision }),
      );
      setDraft(result.draft);
      setDiscardConfirm(false);
      setFeedback("Draft discarded. Stock has not changed.");
      void onChanged().catch((cause) =>
        setError(`Draft discarded, but the list could not refresh: ${message(cause)}`),
      );
    } catch (cause) {
      setError(message(cause));
    } finally {
      setPending(false);
    }
  }

  if (loading)
    return (
      <section className={styles.reviewPanel} role="status" aria-busy="true">
        Loading draft…
      </section>
    );
  if (!draft)
    return (
      <section className={styles.reviewPanel}>
        <ErrorNotice
          text={error || "This draft could not be opened."}
          onRetry={() => void load()}
        />
      </section>
    );
  const targetLine = newProductLineId
    ? draft.lines.find((line) => line.id === newProductLineId)
    : null;
  const availableProducts = [
    ...products,
    ...newProducts.filter((item) => !products.some((known) => known.id === item.id)),
  ];
  return (
    <section className={styles.reviewPanel} aria-labelledby="review-heading" aria-busy={pending}>
      <div className={styles.reviewHeading}>
        <div>
          <p className={styles.kicker}>Receipt review</p>
          <h2 id="review-heading">
            {draft.status === "DRAFT"
              ? "Preparation draft"
              : draft.status === "APPROVED"
                ? "Historical Manager-approved intake"
                : draft.status === "AWAITING_STAFF"
                  ? "Awaiting Staff check"
                  : draft.status === "RECEIVED"
                    ? "Received"
                    : "Discarded draft"}
          </h2>
          <p>Created {formatTime(draft.createdAt)}</p>
        </div>
        <span className={draft.status === "DRAFT" ? styles.draftStatus : styles.finalStatus}>
          {draft.status === "DRAFT"
            ? "Draft"
            : draft.status === "APPROVED"
              ? "Manager approved (historical)"
              : draft.status === "AWAITING_STAFF"
                ? "Awaiting Staff check"
                : draft.status === "RECEIVED"
                  ? "Received"
                  : "Discarded"}
        </span>
      </div>
      {draft.status === "DRAFT" &&
        (draft.documentType === "surat_pesanan" || draft.documentType === "proforma") && (
          <div className={styles.warningNotice} role="status">
            <strong>Order document: check the delivery</strong>
            <p>
              This document can describe goods that have not arrived. Prepare the expected items
              here; Staff must confirm the physical goods before stock changes.
            </p>
          </div>
        )}
      {draft.similarDocumentWarning && (
        <div className={styles.warningNotice} role="status">
          <strong>Possible similar document</strong>
          <p>{draft.similarDocumentWarning}</p>
          <p>
            Check History before sending this document. Separate uploads may describe the same
            delivery.
          </p>
        </div>
      )}
      {draft.status === "DRAFT" ? (
        <>
          <div className={styles.dateFields}>
            <label className={styles.field}>
              <span>Document date</span>
              <input
                type="date"
                value={documentDate}
                onChange={(event) => {
                  setDocumentDate(event.target.value);

                  setFeedback("");
                }}
              />
            </label>
          </div>
          <div className={styles.lineHeader}>
            <h3>Document lines</h3>
            <p>Edit the scanned names and quantities before sending.</p>
          </div>
          <div className={styles.draftLines}>
            {draft.lines.map((line, index) => {
              const edit = edits.find((item) => item.id === line.id);
              if (!edit) return null;
              const matched = availableProducts.find((item) => item.id === edit.productId);
              const quantityValue = Number(edit.approvedQuantity);
              const quantityIsValid =
                edit.approvedQuantity.trim() !== "" &&
                Number.isSafeInteger(quantityValue) &&
                quantityValue > 0;
              const aliasRelevant =
                matched &&
                edit.reviewedName.trim().toLocaleLowerCase() !== matched.name.toLocaleLowerCase();
              return (
                <div key={line.id} className={styles.draftLine}>
                  <div className={styles.lineTitle}>
                    <h4>Line {index + 1}</h4>
                  </div>
                  <div className={styles.reviewFields}>
                    <div className={styles.finalColumn}>
                      <label className={styles.field}>
                        <span>Supplier description</span>
                        <input
                          value={edit.reviewedName}
                          maxLength={160}
                          disabled={edit.excluded || pending}
                          onChange={(event) =>
                            editLine(line.id, {
                              reviewedName: event.target.value,
                              confirmAlias: false,
                            })
                          }
                        />
                      </label>
                      {line.needsReview && (
                        <p className={styles.fieldHint}>
                          Scan uncertain. Verify this line on the bon.
                        </p>
                      )}
                      <label className={styles.field}>
                        <span>Official product</span>
                        <select
                          value={edit.productId}
                          disabled={edit.excluded || pending}
                          onChange={(event) =>
                            editLine(line.id, {
                              productId: event.target.value,
                              confirmAlias: false,
                            })
                          }
                        >
                          <option value="">Choose a product</option>
                          {availableProducts.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} · {item.unit}
                              {line.candidates.some((candidate) => candidate.id === item.id)
                                ? " (suggested)"
                                : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        className={styles.textButton}
                        type="button"
                        disabled={edit.excluded || pending}
                        onClick={() => setNewProductLineId(line.id)}
                      >
                        Create new product
                      </button>
                      <div className={styles.field}>
                        <label htmlFor={`expected-${line.id}`}>
                          Expected quantity {matched ? `(${matched.unit})` : "(base unit)"}
                        </label>
                        <div className={styles.quantityStepper}>
                          <button
                            type="button"
                            aria-label={`Decrease expected quantity for line ${index + 1}`}
                            disabled={
                              edit.excluded || pending || !quantityIsValid || quantityValue <= 1
                            }
                            onClick={() => stepQuantity(line.id, -1)}
                          >
                            −
                          </button>
                          <input
                            id={`expected-${line.id}`}
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max={Number.MAX_SAFE_INTEGER}
                            step="1"
                            value={edit.approvedQuantity}
                            disabled={edit.excluded || pending}
                            onChange={(event) =>
                              editLine(line.id, { approvedQuantity: event.target.value })
                            }
                          />
                          <button
                            type="button"
                            aria-label={`Increase expected quantity for line ${index + 1}`}
                            disabled={
                              edit.excluded ||
                              pending ||
                              (edit.approvedQuantity.trim() !== "" && !quantityIsValid) ||
                              quantityValue >= Number.MAX_SAFE_INTEGER
                            }
                            onClick={() => stepQuantity(line.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {line.rawUnit &&
                        matched &&
                        line.rawUnit.toLocaleLowerCase() !== matched.unit.toLocaleLowerCase() && (
                          <p className={styles.smallCopy}>
                            Check the package contents yourself and enter the total in{" "}
                            {matched.unit}. No conversion is assumed.
                          </p>
                        )}
                      {aliasRelevant && (
                        <label className={styles.checkbox}>
                          <input
                            type="checkbox"
                            checked={edit.confirmAlias}
                            disabled={edit.excluded || pending}
                            onChange={(event) =>
                              editLine(line.id, { confirmAlias: event.target.checked })
                            }
                          />
                          <span>
                            Save this supplier description as a confirmed alias for {matched.name}
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={edit.excluded}
                      disabled={pending}
                      onChange={(event) =>
                        editLine(line.id, { excluded: event.target.checked, confirmAlias: false })
                      }
                    />
                    <span>Exclude this line from Intake</span>
                  </label>
                  {edit.excluded && (
                    <label className={styles.field}>
                      <span>Reason for excluding this line</span>
                      <input
                        value={edit.exclusionReason}
                        maxLength={240}
                        required
                        disabled={pending}
                        onChange={(event) =>
                          editLine(line.id, { exclusionReason: event.target.value })
                        }
                        placeholder="For example, a non-product document line"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
          {error && (
            <ErrorNotice
              text={error}
              onRetry={error.includes("Refresh") ? () => void load() : undefined}
            />
          )}
          {feedback && (
            <p className={styles.notice} role="status">
              {feedback}
            </p>
          )}
          <div className={styles.reviewActions}>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={pending}
              onClick={() => void save()}
            >
              {pending ? "Working…" : "Save draft"}
            </button>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={pending || !approvalReady}
              onClick={() => void approve()}
            >
              Send to Staff
            </button>
          </div>
          <div className={styles.discardArea}>
            {discardConfirm ? (
              <div className={styles.discardConfirm}>
                <p>Discard this draft? It will move to History, and stock will not change.</p>
                <button
                  className={styles.dangerButton}
                  type="button"
                  disabled={pending}
                  onClick={() => void discard()}
                >
                  Yes, discard draft
                </button>
                <button
                  className={styles.textButton}
                  type="button"
                  disabled={pending}
                  onClick={() => setDiscardConfirm(false)}
                >
                  Keep draft
                </button>
              </div>
            ) : (
              <button
                className={styles.textButton}
                type="button"
                disabled={pending}
                onClick={() => setDiscardConfirm(true)}
              >
                Discard draft
              </button>
            )}
          </div>
        </>
      ) : (
        <div className={styles.finalReview}>
          {draft.status === "AWAITING_STAFF" && (
            <>
              <p>
                Submitted details are frozen while Staff checks. Recall before correcting and
                resending.
              </p>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={pending}
                onClick={async () => {
                  setPending(true);
                  setError("");
                  try {
                    const result = await api<{ draft: Draft }>(
                      `/api/estock/drafts/${id}/recall`,
                      json("POST", { expectedRevision: draft.revision }),
                    );
                    setDraft(result.draft);
                    await load();
                    await onChanged();
                  } catch (cause) {
                    setError(message(cause));
                  } finally {
                    setPending(false);
                  }
                }}
              >
                Recall to correct
              </button>
            </>
          )}
          {error && <ErrorNotice text={error} />}
          {feedback && (
            <p className={styles.notice} role="status">
              {feedback}
            </p>
          )}
          <dl>
            <div>
              <dt>Document date</dt>
              <dd>{formatDate(draft.documentDate)}</dd>
            </div>
            {draft.status === "APPROVED" && (
              <div>
                <dt>Approved at</dt>
                <dd>{formatTime(draft.approvedAt || draft.updatedAt)}</dd>
              </div>
            )}
          </dl>
          <h3>Saved lines</h3>
          <ul>
            {draft.lines.map((line) => (
              <li key={line.id}>
                <strong>{line.reviewedName || line.rawName}</strong>
                <span>
                  {line.excluded
                    ? `Excluded: ${line.exclusionReason || "Reason unavailable"}`
                    : `${line.approvedQuantity ?? "?"} ${products.find((item) => item.id === line.productId)?.unit || "units"}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {newProductLineId && targetLine && (
        <ProductDialog
          initialName={
            edits.find((line) => line.id === newProductLineId)?.reviewedName || targetLine.rawName
          }
          openingLocked
          preparationDraftId={id}
          onClose={() => setNewProductLineId(null)}
          onCreated={(product) => {
            setNewProducts((current) => [...current, product]);
            onProductCreated(product);
            editLine(newProductLineId, { productId: product.id, confirmAlias: false });
            setNewProductLineId(null);
          }}
        />
      )}
    </section>
  );
}

function History({
  movements,
  drafts,
  onRefresh,
  onDraftsRefresh,
}: {
  movements: Movement[];
  drafts: Draft[];
  onRefresh: () => Promise<void>;
  onDraftsRefresh: () => Promise<void>;
}) {
  return (
    <ManagerHistory
      movements={movements}
      drafts={drafts}
      onRefresh={onRefresh}
      onDraftsRefresh={onDraftsRefresh}
      formatDate={formatDate}
      formatTime={formatTime}
    />
  );
}
