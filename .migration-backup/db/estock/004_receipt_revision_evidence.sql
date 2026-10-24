-- Keep Manager corrections and exclusions as evidence for each sent revision.
-- Existing submissions have no reconstructable correction snapshot; readers fall
-- back to their current draft-line value for those historical rows only.
ALTER TABLE estock_receipt_lines
  ADD COLUMN IF NOT EXISTS reviewed_name_snapshot text;

CREATE TABLE IF NOT EXISTS estock_receipt_exclusions (
  draft_id uuid NOT NULL,
  revision integer NOT NULL,
  line_id uuid NOT NULL REFERENCES estock_draft_lines(id),
  line_order integer NOT NULL,
  reviewed_name text NOT NULL,
  exclusion_reason text NOT NULL CHECK (length(trim(exclusion_reason)) BETWEEN 1 AND 240),
  PRIMARY KEY (draft_id, revision, line_id),
  FOREIGN KEY (draft_id, revision)
    REFERENCES estock_receipt_submissions(draft_id, revision)
);
