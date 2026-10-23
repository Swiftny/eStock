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
import { DraftComparison } from "./draft-comparison";
import { ManagerHistory } from "./manager-history";
import styles from "./estock-app.module.css";
import { ReceiptImagePicker } from "./receipt-image-picker";

type Role = "manager" | "staff";
type Page = "overview" | "inventory" | "scan" | "drafts" | "history";
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
  reviewedName?: string | null;
  needsReview: boolean;
  productId: string | null;
  approvedQuantity: number | null;
  excluded: boolean;
  exclusionReason?: string | null;
  confirmAlias?: boolean;
  candidates: Candidate[];
};
type Draft = {
  id: string;
  status: "DRAFT" | "APPROVED" | "DISCARDED";
  revision: number;
  documentDate: string | null;
  extractedDocumentDate: string | null;
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

function json(method: "POST" | "PATCH", value: unknown): RequestInit {
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

const managerPages: { id: Page; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "inventory", label: "Inventory" },
  { id: "scan", label: "Scan receipt" },
  { id: "drafts", label: "Drafts" },
  { id: "history", label: "History" },
];

export function EStockApp() {
  const [role, setRole] = useState<Role | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [page, setPage] = useState<Page>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [history, setHistory] = useState<Movement[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [authRole, setAuthRole] = useState<Role>("manager");
  const [password, setPassword] = useState("");
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
    void (async () => {
      try {
        const session = await api<{ authenticated: boolean; role?: Role }>("/api/estock/session");
        if (!live) return;
        if (session.authenticated && session.role) {
          setRole(session.role);
          setPage(session.role === "manager" ? "overview" : "inventory");
          await loadData(session.role);
        }
      } catch (cause) {
        if (live && !(cause instanceof ApiError && cause.status === 401)) setError(message(cause));
      } finally {
        if (live) setInitializing(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [loadData]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (signingIn) return;
    setSigningIn(true);
    setError("");
    try {
      const result = await api<{ role: Role }>(
        "/api/estock/session",
        json("POST", { role: authRole, password }),
      );
      setRole(result.role);
      setPage(result.role === "manager" ? "overview" : "inventory");
      setPassword("");
      await loadData(result.role);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setSigningIn(false);
    }
  }

  async function signOut() {
    setError("");
    try {
      await api<{ ok: boolean }>("/api/estock/session", { method: "DELETE" });
      setRole(null);
      setProducts([]);
      setDataReady(false);
      setDrafts([]);
      setHistory([]);
      setSelectedDraftId(null);
      setMovementTarget(null);
      setEditTarget(null);
      setProductDialog(false);
      setNotice("");
    } catch (cause) {
      setError(message(cause));
    }
  }

  function go(next: Page) {
    if (role === "staff" && next !== "inventory") return;
    setPage(next);
    setError("");
    setNotice("");
    if (next === "inventory" && role) void loadData(role);
    requestAnimationFrame(() => mainRef.current?.focus());
  }

  const visibleProducts = useMemo(
    () => (query.trim() ? searchMatches || [] : products),
    [products, query, searchMatches],
  );
  const lowStock = products.filter((item) => item.stock < 5);
  const pendingDrafts = drafts.filter((item) => item.status === "DRAFT");

  if (initializing) {
    return (
      <main className={styles.boot} role="status" aria-busy="true">
        <span className={styles.wordmark}>
          e<span>Stock</span>
        </span>
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
          <a href="/" className={styles.wordmark} aria-label="eStock home">
            e<span>Stock</span>
          </a>
          <span className={styles.headerHint}>Warehouse inventory</span>
        </header>
        <main id="estock-main" className={styles.signIn}>
          <div className={styles.signInIntro}>
            <p className={styles.kicker}>Your workspace</p>
            <h1>Sign in to eStock</h1>
            <p>
              Choose the account for your work. Manager reviews receipts; Staff records stock taken
              or returned.
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
                    <small>Inventory and receipt approval</small>
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
                    <small>Take and Return</small>
                  </span>
                </label>
              </div>
            </fieldset>
            <label className={styles.field}>
              <span>Access code</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
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
      <header className={styles.header}>
        <a href="/" className={styles.wordmark} aria-label="eStock home">
          e<span>Stock</span>
        </a>
        <span className={styles.workspaceLabel}>One shop · One warehouse</span>
        <div className={styles.account}>
          <span className={styles.accountRole}>{role === "manager" ? "Manager" : "Staff"}</span>
          <button className={styles.signOut} type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <div className={styles.shell}>
        <nav className={styles.navigation} aria-label="Workspace sections">
          {(role === "manager"
            ? managerPages
            : [{ id: "inventory" as Page, label: "Inventory" }]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={page === item.id ? styles.navActive : styles.navItem}
              aria-current={page === item.id ? "page" : undefined}
              onClick={() => go(item.id)}
            >
              {item.label}
              {item.id === "drafts" && pendingDrafts.length > 0 && (
                <span className={styles.navCount}>
                  {pendingDrafts.length}
                  <span className={styles.srOnly}> pending drafts</span>
                </span>
              )}
            </button>
          ))}
        </nav>
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
          {!loadingData && dataReady && role === "manager" && page === "overview" && (
            <Overview
              products={products}
              lowStock={lowStock}
              pendingDrafts={pendingDrafts}
              history={history}
              onOpenDraft={(id) => {
                setSelectedDraftId(id);
                go("drafts");
              }}
              onNavigate={go}
            />
          )}
          {!loadingData && dataReady && page === "inventory" && (
            <Inventory
              role={role}
              products={products}
              visibleProducts={visibleProducts}
              query={query}
              searchPending={searchPending}
              searchError={searchError}
              onQuery={setQuery}
              onAdd={() => setProductDialog(true)}
              onMove={(product, type) => setMovementTarget({ product, type })}
              onEdit={setEditTarget}
            />
          )}
          {!loadingData && dataReady && role === "manager" && page === "scan" && (
            <ScanReceipt
              onCreated={async (draft) => {
                setDrafts((current) => [draft, ...current.filter((item) => item.id !== draft.id)]);
                setSelectedDraftId(draft.id);
                go("drafts");
                void loadDrafts().catch((cause) =>
                  setError(`Draft created, but the list could not refresh: ${message(cause)}`),
                );
              }}
            />
          )}
          {!loadingData && dataReady && role === "manager" && page === "drafts" && (
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
          {!loadingData && dataReady && role === "manager" && page === "history" && (
            <History movements={history} onRefresh={loadHistory} />
          )}
        </main>
      </div>
      {movementTarget && (
        <MovementDialog
          key={`${movementTarget.product.id}:${movementTarget.type}`}
          product={movementTarget.product}
          type={movementTarget.type}
          onClose={() => setMovementTarget(null)}
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

function Overview({
  products,
  lowStock,
  pendingDrafts,
  history,
  onOpenDraft,
  onNavigate,
}: {
  products: Product[];
  lowStock: Product[];
  pendingDrafts: Draft[];
  history: Movement[];
  onOpenDraft: (id: string) => void;
  onNavigate: (page: Page) => void;
}) {
  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.kicker}>Manager workspace</p>
          <h1>Warehouse overview</h1>
          <p>See what needs attention and review stock in one place.</p>
        </div>
        <button className={styles.primaryButton} type="button" onClick={() => onNavigate("scan")}>
          Scan receipt
        </button>
      </div>
      <div className={styles.overviewGrid}>
        <section className={styles.overviewPrimary} aria-labelledby="pending-heading">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="pending-heading">Pending review</h2>
              <p>Receipts only update stock after your approval.</p>
            </div>
            <span className={styles.bigNumber}>{pendingDrafts.length}</span>
          </div>
          {pendingDrafts.length ? (
            <div className={styles.simpleList}>
              {pendingDrafts.slice(0, 4).map((draft) => (
                <button
                  key={draft.id}
                  className={styles.simpleListButton}
                  type="button"
                  onClick={() => onOpenDraft(draft.id)}
                >
                  <span>
                    <strong>
                      {draft.lines.length} {draft.lines.length === 1 ? "item" : "items"}
                    </strong>
                    <small>Document date: {formatDate(draft.documentDate)}</small>
                  </span>
                  <span>Review</span>
                </button>
              ))}
              {pendingDrafts.length > 4 && (
                <button
                  className={styles.textButton}
                  type="button"
                  onClick={() => onNavigate("drafts")}
                >
                  View all drafts
                </button>
              )}
            </div>
          ) : (
            <p className={styles.quietEmpty}>No receipts waiting for review.</p>
          )}
        </section>
        <section className={styles.overviewSecondary} aria-labelledby="stock-summary-heading">
          <h2 id="stock-summary-heading">Inventory at a glance</h2>
          <dl className={styles.summaryList}>
            <div>
              <dt>Products</dt>
              <dd>{products.length}</dd>
            </div>
            <div>
              <dt>Low stock</dt>
              <dd>{lowStock.length}</dd>
            </div>
          </dl>
          <p className={styles.smallCopy}>
            Low stock means fewer than 5 units in the product’s base unit.
          </p>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => onNavigate("inventory")}
          >
            View all inventory
          </button>
        </section>
      </div>
      {lowStock.length > 0 && (
        <section className={styles.plainSection} aria-labelledby="low-heading">
          <div className={styles.sectionHeading}>
            <h2 id="low-heading">Low stock</h2>
            <button
              className={styles.textButton}
              type="button"
              onClick={() => onNavigate("inventory")}
            >
              Open inventory
            </button>
          </div>
          <ul className={styles.lowList}>
            {lowStock.slice(0, 6).map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <strong>
                  {item.stock} {item.unit}
                </strong>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className={styles.plainSection} aria-labelledby="recent-heading">
        <div className={styles.sectionHeading}>
          <h2 id="recent-heading">Recent activity</h2>
          <button className={styles.textButton} type="button" onClick={() => onNavigate("history")}>
            View history
          </button>
        </div>
        {history.length ? (
          <ul className={styles.recentList}>
            {history.slice(0, 5).map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.productName}</strong>
                  <small>
                    {item.type} · {formatTime(item.createdAt)}
                  </small>
                </span>
                <strong>
                  {item.delta > 0 ? "+" : ""}
                  {item.delta} {item.unit}
                </strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.quietEmpty}>
            No stock movements yet. Add a product to record its opening balance.
          </p>
        )}
      </section>
    </>
  );
}

function Inventory({
  role,
  products,
  visibleProducts,
  query,
  searchPending,
  searchError,
  onQuery,
  onAdd,
  onMove,
  onEdit,
}: {
  role: Role;
  products: Product[];
  visibleProducts: Product[];
  query: string;
  searchPending: boolean;
  searchError: string;
  onQuery: (value: string) => void;
  onAdd: () => void;
  onMove: (product: Product, type: MovementType) => void;
  onEdit: (product: Product) => void;
}) {
  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.kicker}>{role === "manager" ? "Manager" : "Staff"} workspace</p>
          <h1>Inventory</h1>
          <p>
            {role === "manager"
              ? "All products and their current warehouse stock."
              : "Find a product, then Take or Return its stock."}
          </p>
        </div>
        {role === "manager" && (
          <button className={styles.primaryButton} type="button" onClick={onAdd}>
            Add product
          </button>
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
        <ul className={styles.inventoryList} aria-label="Current warehouse stock">
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
                {role === "manager" && (
                  <button className={styles.textButton} type="button" onClick={() => onEdit(item)}>
                    Edit
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function MovementDialog({
  product,
  type,
  onClose,
  onSaved,
}: {
  product: Product;
  type: MovementType;
  onClose: () => void;
  onSaved: (product: Product) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const [quantity, setQuantity] = useState("");
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
    const amount = Number(quantity);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("Enter a whole number greater than zero.");
      return;
    }
    if (type === "TAKE" && amount > product.stock) {
      setError(
        `Only ${product.stock} ${product.unit} available. Check the current stock and try again.`,
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
          {product.stock} {product.unit}
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
            max={type === "TAKE" ? product.stock : undefined}
            step="1"
            required
            value={quantity}
            onChange={(event) => {
              setQuantity(event.target.value);
              setError("");
            }}
          />
        </label>
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
          <button className={styles.primaryButton} type="submit" disabled={pending}>
            {pending ? "Saving…" : `Confirm ${type === "TAKE" ? "Take" : "Return"}`}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function ProductDialog({
  onClose,
  onCreated,
  initialName = "",
  openingLocked = false,
}: {
  onClose: () => void;
  onCreated: (product: Product) => Promise<void> | void;
  initialName?: string;
  openingLocked?: boolean;
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
    const payload = { name: name.trim(), unit: unit.trim(), openingStock: amount };
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
            This product starts at 0. The reviewed receipt quantity will be added once when you
            approve the draft.
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

function ScanReceipt({ onCreated }: { onCreated: (draft: Draft) => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || pending) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("Choose an image smaller than 6 MB.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const form = new FormData();
      form.append("image", file);
      const result = await api<{ draft: Draft }>("/api/estock/drafts", {
        method: "POST",
        body: form,
      });
      setFile(null);
      await onCreated(result.draft);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.kicker}>Manager workspace</p>
          <h1>Scan receipt</h1>
          <p>
            Photograph or upload a supplier document. Review the extracted draft before any stock is
            added.
          </p>
        </div>
      </div>
      <div className={styles.scanLayout}>
        <form
          className={styles.scanPanel}
          onSubmit={(event) => void submit(event)}
          aria-busy={pending}
        >
          <h2>Choose a document image</h2>
          <p className={styles.syntheticNotice}>
            For the competition demo, use team-created synthetic documents only.
          </p>
          <p>
            Make sure product names, quantities and the document date are readable. A receipt,
            invoice or order is text evidence; approval also requires you to confirm the goods
            arrived.
          </p>
          <ReceiptImagePicker
            file={file}
            onChange={(image) => {
              setFile(image);
              setError("");
            }}
            disabled={pending}
          />
          {error && <ErrorNotice text={error} />}
          <button className={styles.primaryButton} type="submit" disabled={!file || pending}>
            {pending ? "Reading document…" : "Create draft"}
          </button>
          {pending && (
            <p className={styles.smallCopy} role="status">
              Gemini is reading the image. Stock will stay unchanged.
            </p>
          )}
        </form>
        <aside className={styles.scanAside}>
          <h2>What happens next</h2>
          <ol>
            <li>Gemini proposes product descriptions, quantities and a date.</li>
            <li>You correct uncertain lines and match them to products.</li>
            <li>You confirm the usable goods received and approve the intake.</li>
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
  const currentId =
    selectedId && drafts.some((item) => item.id === selectedId)
      ? selectedId
      : drafts.find((item) => item.status === "DRAFT")?.id || drafts[0]?.id;
  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.kicker}>Manager workspace</p>
          <h1>Receipt drafts</h1>
          <p>Review and save corrections. Only approved drafts add stock.</p>
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
      {!drafts.length ? (
        <EmptyState
          title="No receipt drafts"
          description="Scan a supplier document to create a draft for review."
        />
      ) : (
        <div className={styles.draftLayout}>
          <section className={styles.draftList} aria-label="Receipt drafts">
            {drafts.map((item) => (
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
                    {item.status === "DRAFT"
                      ? "Draft"
                      : item.status === "APPROVED"
                        ? "Approved"
                        : "Discarded"}
                  </span>
                </span>
                <small>Document: {formatDate(item.documentDate)}</small>
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
    reviewedName: line.reviewedName ?? line.rawName,
    productId: line.productId || "",
    approvedQuantity: line.approvedQuantity === null ? "" : String(line.approvedQuantity),
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
  const [confirmed, setConfirmed] = useState(false);
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
      const newDate = result.draft.documentDate || "";
      setEdits(newEdits);
      setDocumentDate(newDate);
      setSavedSignature(JSON.stringify(draftPatch(newDate, newEdits)));
      setConfirmed(false);
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
    setConfirmed(false);
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
    if (!confirmed) {
      setError("Confirm the quantities physically received before approving.");
      return;
    }
    setPending(true);
    setError("");
    setFeedback("");
    try {
      const saved = await saveChanges(draft);
      const payload = { expectedRevision: saved.revision, confirmReceived: true };
      const result = await api<{ draft: Draft }>(
        `/api/estock/drafts/${encodeURIComponent(id)}/approve`,
        json("POST", {
          ...payload,
          requestId: retryKey(approvalAttempt, { draftId: id, ...payload }),
        }),
      );
      approvalAttempt.current = null;
      setDraft(result.draft);
      setFeedback("Intake approved. Inventory and History have been updated together.");
      void onChanged().catch((cause) =>
        setError(`Intake approved, but the page could not refresh: ${message(cause)}`),
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
              ? "Draft awaiting approval"
              : draft.status === "APPROVED"
                ? "Approved intake"
                : "Discarded draft"}
          </h2>
          <p>Created {formatTime(draft.createdAt)}</p>
        </div>
        <span className={draft.status === "DRAFT" ? styles.draftStatus : styles.finalStatus}>
          {draft.status === "DRAFT"
            ? "Draft"
            : draft.status === "APPROVED"
              ? "Approved"
              : "Discarded"}
        </span>
      </div>
      <p className={styles.infoNotice}>
        The original image is not stored. Re-upload it if you need to compare it with this saved
        draft.
      </p>
      <DraftComparison key={id} disabled={pending} />
      {draft.similarDocumentWarning && (
        <div className={styles.warningNotice} role="status">
          <strong>Possible similar document</strong>
          <p>{draft.similarDocumentWarning}</p>
          <p>
            Check the document and delivery before approving. This warning does not block approval.
          </p>
        </div>
      )}
      {draft.status === "DRAFT" ? (
        <>
          <div className={styles.dateFields}>
            <div>
              <span className={styles.readOnlyLabel}>Extracted document date</span>
              <strong>{formatDate(draft.extractedDocumentDate)}</strong>
            </div>
            <label className={styles.field}>
              <span>Document date for this intake</span>
              <input
                type="date"
                value={documentDate}
                onChange={(event) => {
                  setDocumentDate(event.target.value);
                  setConfirmed(false);
                  setFeedback("");
                }}
              />
            </label>
          </div>
          <div className={styles.lineHeader}>
            <h3>Document lines</h3>
            <p>
              Compare the source text with your corrected stock entry. No line is dropped
              automatically.
            </p>
          </div>
          <div className={styles.draftLines}>
            {draft.lines.map((line, index) => {
              const edit = edits.find((item) => item.id === line.id);
              if (!edit) return null;
              const matched = availableProducts.find((item) => item.id === edit.productId);
              const aliasRelevant =
                matched &&
                edit.reviewedName.trim().toLocaleLowerCase() !== matched.name.toLocaleLowerCase();
              return (
                <div key={line.id} className={styles.draftLine}>
                  <div className={styles.lineTitle}>
                    <h4>Line {index + 1}</h4>
                    {line.needsReview && (
                      <span className={styles.reviewFlag}>Check extraction</span>
                    )}
                  </div>
                  <div className={styles.lineColumns}>
                    <div className={styles.sourceColumn}>
                      <p className={styles.columnLabel}>From document</p>
                      <dl>
                        <div>
                          <dt>Name</dt>
                          <dd>{line.rawName || "Unreadable"}</dd>
                        </div>
                        <div>
                          <dt>Quantity</dt>
                          <dd>
                            {line.rawQuantity === null ? "Unreadable" : line.rawQuantity}{" "}
                            {line.rawUnit || "unit not found"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className={styles.finalColumn}>
                      <p className={styles.columnLabel}>Reviewed warehouse entry</p>
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
                      <label className={styles.field}>
                        <span>
                          Quantity actually received {matched ? `(${matched.unit})` : "(base unit)"}
                        </span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          step="1"
                          value={edit.approvedQuantity}
                          disabled={edit.excluded || pending}
                          onChange={(event) =>
                            editLine(line.id, { approvedQuantity: event.target.value })
                          }
                        />
                      </label>
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
                        placeholder="For example, not delivered"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
          <div className={styles.approvalBox}>
            <h3>Confirm physical receipt</h3>
            <p>
              A document alone does not prove delivery. Check that each included quantity is
              physically in usable warehouse stock.
            </p>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={confirmed}
                disabled={pending}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <span>I confirm the included quantities were received and are usable.</span>
            </label>
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
              disabled={pending || !approvalReady || !confirmed}
              onClick={() => void approve()}
            >
              Approve stock intake
            </button>
          </div>
          <div className={styles.discardArea}>
            {discardConfirm ? (
              <div className={styles.discardConfirm}>
                <p>Discard this draft? It will remain in Drafts, and stock will not change.</p>
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
  onRefresh,
}: {
  movements: Movement[];
  onRefresh: () => Promise<void>;
}) {
  return (
    <ManagerHistory
      movements={movements}
      onRefresh={onRefresh}
      formatDate={formatDate}
      formatTime={formatTime}
    />
  );
}
