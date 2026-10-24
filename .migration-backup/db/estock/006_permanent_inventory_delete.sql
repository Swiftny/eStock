-- Historical rows retain their name/unit/count snapshots after product removal.
ALTER TABLE estock_movements ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE estock_movements DROP CONSTRAINT estock_movements_product_id_fkey;
ALTER TABLE estock_movements ADD CONSTRAINT estock_movements_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES estock_products(id) ON DELETE SET NULL;

ALTER TABLE estock_receipt_lines ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE estock_receipt_lines DROP CONSTRAINT estock_receipt_lines_product_id_fkey;
ALTER TABLE estock_receipt_lines ADD CONSTRAINT estock_receipt_lines_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES estock_products(id) ON DELETE SET NULL;

ALTER TABLE estock_draft_lines DROP CONSTRAINT estock_draft_lines_product_id_fkey;
ALTER TABLE estock_draft_lines ADD CONSTRAINT estock_draft_lines_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES estock_products(id) ON DELETE SET NULL;

ALTER TABLE estock_aliases DROP CONSTRAINT estock_aliases_product_id_fkey;
ALTER TABLE estock_aliases ADD CONSTRAINT estock_aliases_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES estock_products(id) ON DELETE CASCADE;

ALTER TABLE estock_activity_balances DROP CONSTRAINT estock_activity_balances_product_id_fkey;
ALTER TABLE estock_activity_balances ADD CONSTRAINT estock_activity_balances_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES estock_products(id) ON DELETE CASCADE;
