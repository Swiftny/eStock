CREATE TABLE IF NOT EXISTS estock_sessions (
  token_hash text PRIMARY KEY,
  account_id text NOT NULL CHECK (account_id IN ('manager', 'staff')),
  role text NOT NULL CHECK (role IN ('manager', 'staff')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estock_products (
  id uuid PRIMARY KEY,
  official_name text NOT NULL CHECK (length(trim(official_name)) BETWEEN 1 AND 120),
  normalized_name text NOT NULL,
  unit text NOT NULL CHECK (length(trim(unit)) BETWEEN 1 AND 32),
  stock bigint NOT NULL DEFAULT 0 CHECK (stock BETWEEN 0 AND 9007199254740991),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS estock_product_name_lookup ON estock_products(normalized_name);

CREATE TABLE IF NOT EXISTS estock_aliases (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES estock_products(id),
  alias text NOT NULL,
  normalized text NOT NULL,
  confirmed_by text NOT NULL CHECK (confirmed_by = 'manager'),
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, normalized)
);
CREATE INDEX IF NOT EXISTS estock_alias_lookup ON estock_aliases(normalized);

CREATE TABLE IF NOT EXISTS estock_drafts (
  id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'DISCARDED')),
  revision integer NOT NULL DEFAULT 1,
  extracted_document_date date,
  document_date date,
  extraction_mode text NOT NULL DEFAULT 'LIVE' CHECK (extraction_mode IN ('LIVE', 'MOCK')),
  model_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by text,
  approved_account_id text,
  actual_receipt_confirmed boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS estock_draft_lines (
  id uuid PRIMARY KEY,
  draft_id uuid NOT NULL REFERENCES estock_drafts(id),
  line_order integer NOT NULL,
  raw_name text NOT NULL,
  raw_quantity numeric,
  raw_unit text,
  reviewed_name text NOT NULL,
  product_id uuid REFERENCES estock_products(id),
  selected_product_version integer,
  approved_quantity bigint CHECK (approved_quantity IS NULL OR approved_quantity BETWEEN 1 AND 9007199254740991),
  excluded boolean NOT NULL DEFAULT false,
  exclusion_reason text,
  needs_review boolean NOT NULL DEFAULT false,
  confirm_alias boolean NOT NULL DEFAULT false,
  UNIQUE(draft_id, line_order)
);
CREATE INDEX IF NOT EXISTS estock_draft_lines_draft ON estock_draft_lines(draft_id, line_order);

CREATE TABLE IF NOT EXISTS estock_movements (
  id uuid PRIMARY KEY,
  source_event_id text NOT NULL UNIQUE,
  product_id uuid NOT NULL REFERENCES estock_products(id),
  product_name text NOT NULL,
  unit text NOT NULL,
  type text NOT NULL CHECK (type IN ('OPENING', 'INTAKE', 'TAKE', 'RETURN')),
  quantity bigint NOT NULL CHECK (quantity BETWEEN 0 AND 9007199254740991),
  delta bigint NOT NULL,
  balance_after bigint NOT NULL CHECK (balance_after BETWEEN 0 AND 9007199254740991),
  actor_role text NOT NULL CHECK (actor_role IN ('manager', 'staff')),
  actor_account_id text NOT NULL CHECK (actor_account_id IN ('manager', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  document_date date,
  approved_at timestamptz,
  draft_id uuid REFERENCES estock_drafts(id),
  line_id uuid REFERENCES estock_draft_lines(id),
  raw_name text,
  raw_quantity numeric,
  raw_unit text,
  reviewed_name text,
  CHECK (
    (type = 'OPENING' AND quantity >= 0 AND delta = quantity)
    OR (type IN ('INTAKE', 'RETURN') AND quantity > 0 AND delta = quantity)
    OR (type = 'TAKE' AND quantity > 0 AND delta = -quantity)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS estock_one_opening ON estock_movements(product_id) WHERE type = 'OPENING';
CREATE UNIQUE INDEX IF NOT EXISTS estock_one_intake_per_line ON estock_movements(line_id) WHERE type = 'INTAKE';
CREATE INDEX IF NOT EXISTS estock_movements_recent ON estock_movements(created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS estock_requests (
  request_id text PRIMARY KEY,
  action text NOT NULL,
  actor_role text NOT NULL CHECK (actor_role IN ('manager', 'staff')),
  fingerprint text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
