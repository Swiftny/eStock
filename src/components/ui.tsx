import type { ReactNode } from "react";

export function Icon({
  name,
  className = "",
}: {
  name:
    | "arrow"
    | "records"
    | "forecast"
    | "recommend"
    | "approval"
    | "request"
    | "receive"
    | "check";
  className?: string;
}) {
  const paths: Record<typeof name, ReactNode> = {
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    records: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    forecast: (
      <>
        <path d="M4 4v16h17M7 15l4-5 4 2 5-7" />
        <path d="M16 5h4v4" />
      </>
    ),
    recommend: (
      <>
        <path d="M4 6h16M4 12h10M4 18h6M17 15l3 3-3 3M14 18h6" />
      </>
    ),
    approval: (
      <>
        <path d="M8 4H5v17h14V4h-3M9 12l2 2 4-4" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
      </>
    ),
    request: (
      <>
        <path d="m3 11 18-8-7 18-3-7-8-3ZM11 14l5-6" />
      </>
    ),
    receive: (
      <>
        <path d="m3 8 9 5 9-5M12 13v9M3 8v10l9 4 9-4V8l-9-5-9 5ZM8 5l9 5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  };
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <span>e</span>Stock
    </span>
  );
}

export function StatusLabel({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "pending" | "success" | "danger";
}) {
  return <span className={`status-label status-${tone}`}>{children}</span>;
}
