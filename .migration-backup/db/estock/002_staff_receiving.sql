ALTER TABLE estock_products ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE estock_products ADD COLUMN IF NOT EXISTS archived_by text;
ALTER TABLE estock_products ADD COLUMN IF NOT EXISTS archived_stock bigint;

ALTER TABLE estock_drafts DROP CONSTRAINT IF EXISTS estock_drafts_status_check;
ALTER TABLE estock_drafts ADD CONSTRAINT estock_drafts_status_check
  CHECK (status IN ('DRAFT','AWAITING_STAFF','RECEIVED','APPROVED','DISCARDED'));
ALTER TABLE estock_drafts ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE estock_drafts ADD COLUMN IF NOT EXISTS sent_by text;
ALTER TABLE estock_drafts ADD COLUMN IF NOT EXISTS received_at timestamptz;
ALTER TABLE estock_drafts ADD COLUMN IF NOT EXISTS checked_by text;
ALTER TABLE estock_drafts ADD COLUMN IF NOT EXISTS has_discrepancies boolean NOT NULL DEFAULT false;

-- One immutable snapshot per submission revision. Recalling never rewrites this evidence.
CREATE TABLE IF NOT EXISTS estock_receipt_submissions (
  draft_id uuid NOT NULL REFERENCES estock_drafts(id),
  revision integer NOT NULL,
  document_date date NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_by text NOT NULL CHECK (sent_by='manager'),
  PRIMARY KEY(draft_id,revision)
);
CREATE TABLE IF NOT EXISTS estock_receipt_lines (
  draft_id uuid NOT NULL,
  revision integer NOT NULL,
  line_id uuid NOT NULL REFERENCES estock_draft_lines(id),
  line_order integer NOT NULL,
  product_id uuid NOT NULL REFERENCES estock_products(id),
  product_name text NOT NULL,
  unit text NOT NULL,
  expected_quantity bigint NOT NULL CHECK (expected_quantity BETWEEN 1 AND 9007199254740991),
  actual_quantity bigint CHECK (actual_quantity BETWEEN 0 AND 9007199254740991),
  outcome text CHECK (outcome IN ('MATCH','SHORT','EXTRA')),
  difference bigint CHECK (difference BETWEEN 1 AND 9007199254740991),
  PRIMARY KEY(draft_id,revision,line_id),
  FOREIGN KEY(draft_id,revision) REFERENCES estock_receipt_submissions(draft_id,revision),
  CHECK ((actual_quantity IS NULL AND outcome IS NULL AND difference IS NULL)
    OR (actual_quantity IS NOT NULL AND outcome='MATCH' AND difference IS NULL AND actual_quantity=expected_quantity)
    OR (actual_quantity IS NOT NULL AND outcome='SHORT' AND difference IS NOT NULL AND actual_quantity=expected_quantity-difference)
    OR (actual_quantity IS NOT NULL AND outcome='EXTRA' AND difference IS NOT NULL AND actual_quantity=expected_quantity+difference))
);
CREATE TABLE IF NOT EXISTS estock_receipt_checks (
  draft_id uuid PRIMARY KEY REFERENCES estock_drafts(id),
  revision integer NOT NULL,
  checked_by text NOT NULL CHECK (checked_by='staff'),
  checked_at timestamptz NOT NULL,
  FOREIGN KEY(draft_id,revision) REFERENCES estock_receipt_submissions(draft_id,revision)
);
CREATE TABLE IF NOT EXISTS estock_notifications (
  id uuid PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('manager','staff')),
  kind text NOT NULL CHECK (kind IN ('RECEIVING','DISCREPANCY')),
  draft_id uuid NOT NULL REFERENCES estock_drafts(id),
  revision integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  resolved_at timestamptz,
  UNIQUE(role,kind,draft_id,revision)
);
CREATE INDEX IF NOT EXISTS estock_notifications_role ON estock_notifications(role,created_at DESC);
