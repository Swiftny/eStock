CREATE TABLE IF NOT EXISTS estock_activity_balances (
  product_id uuid PRIMARY KEY REFERENCES estock_products(id),
  delta numeric NOT NULL CHECK (delta = trunc(delta))
);

ALTER TABLE estock_products
  ADD COLUMN IF NOT EXISTS opening_recorded boolean NOT NULL DEFAULT false;
UPDATE estock_products SET opening_recorded = true;

-- Clearing Opening history must not allow a second Opening for the same product.
CREATE OR REPLACE FUNCTION estock_claim_opening() RETURNS trigger AS $$
BEGIN
  IF NEW.type = 'OPENING' THEN
    UPDATE estock_products SET opening_recorded = true
      WHERE id = NEW.product_id AND NOT opening_recorded;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Opening was already recorded for this product'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS estock_claim_opening ON estock_movements;
CREATE TRIGGER estock_claim_opening BEFORE INSERT ON estock_movements
  FOR EACH ROW EXECUTE FUNCTION estock_claim_opening();
