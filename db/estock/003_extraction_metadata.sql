-- Preserve extraction evidence without storing the uploaded image.
-- "unknown" marks drafts created before this metadata was collected.
ALTER TABLE estock_drafts ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT 'unknown'
  CHECK (document_type IN ('unknown','faktur','nota','surat_jalan','surat_pesanan','proforma','bukti_titipan','lainnya','tidak_terbaca'));
ALTER TABLE estock_drafts ADD COLUMN IF NOT EXISTS image_status text NOT NULL DEFAULT 'unknown'
  CHECK (image_status IN ('unknown','clear','partial','unreadable'));
ALTER TABLE estock_drafts ADD COLUMN IF NOT EXISTS date_needs_review boolean NOT NULL DEFAULT false;

ALTER TABLE estock_draft_lines ADD COLUMN IF NOT EXISTS quantity_text text;
ALTER TABLE estock_draft_lines ADD COLUMN IF NOT EXISTS review_reason text;
