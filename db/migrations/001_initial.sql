CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS suppliers (
 id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, channel TEXT NOT NULL CHECK(channel='SIMULATED')
);
CREATE TABLE IF NOT EXISTS products (
 id TEXT PRIMARY KEY, org_id TEXT NOT NULL, sku TEXT NOT NULL, name TEXT NOT NULL, unit TEXT NOT NULL,
 precision INTEGER NOT NULL CHECK(precision BETWEEN 0 AND 3), ledger_start TEXT NOT NULL,
 ledger_version INTEGER NOT NULL DEFAULT 0, inbound_version INTEGER NOT NULL DEFAULT 0,
 UNIQUE(org_id,sku)
);
CREATE TABLE IF NOT EXISTS policies (
 product_id TEXT PRIMARY KEY REFERENCES products(id), org_id TEXT NOT NULL, supplier_id TEXT NOT NULL REFERENCES suppliers(id),
 version INTEGER NOT NULL DEFAULT 1, payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS stock_movements (
 id TEXT PRIMARY KEY, org_id TEXT NOT NULL, product_id TEXT NOT NULL REFERENCES products(id),
 event_key TEXT NOT NULL, type TEXT NOT NULL, quantity_milli INTEGER NOT NULL CHECK(quantity_milli>=0),
 delta_milli INTEGER NOT NULL, business_date TEXT NOT NULL, reference TEXT NOT NULL, reason TEXT NOT NULL,
 actor TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(org_id,event_key)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_opening_per_product ON stock_movements(org_id,product_id) WHERE type='OPENING_BALANCE';
CREATE TABLE IF NOT EXISTS daily_sales (
 org_id TEXT NOT NULL, product_id TEXT NOT NULL REFERENCES products(id), business_date TEXT NOT NULL,
 quantity_milli INTEGER NOT NULL CHECK(quantity_milli>=0), complete INTEGER NOT NULL CHECK(complete IN(0,1)),
 stockout INTEGER NOT NULL CHECK(stockout IN(0,1)), source_id TEXT NOT NULL, source TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(org_id,product_id,business_date), UNIQUE(org_id,source_id)
);
CREATE TABLE IF NOT EXISTS analysis_runs (
 id TEXT PRIMARY KEY, org_id TEXT NOT NULL, product_id TEXT NOT NULL REFERENCES products(id),
 identity_hash TEXT NOT NULL, status TEXT NOT NULL, request TEXT NOT NULL, result TEXT,
 payload TEXT NOT NULL, UNIQUE(org_id,identity_hash)
);
CREATE TABLE IF NOT EXISTS recommendations (
 id TEXT PRIMARY KEY, org_id TEXT NOT NULL, product_id TEXT NOT NULL REFERENCES products(id), revision INTEGER NOT NULL,
 status TEXT NOT NULL, analysis_id TEXT NOT NULL REFERENCES analysis_runs(id), payload TEXT NOT NULL,
 UNIQUE(org_id,product_id,revision), UNIQUE(org_id,analysis_id)
);
CREATE TABLE IF NOT EXISTS approvals (
 id TEXT PRIMARY KEY, org_id TEXT NOT NULL, recommendation_id TEXT NOT NULL REFERENCES recommendations(id),
 decision TEXT NOT NULL, actor TEXT NOT NULL, reason TEXT NOT NULL, snapshot TEXT NOT NULL, created_at TEXT NOT NULL,
 UNIQUE(org_id,recommendation_id)
);
CREATE TABLE IF NOT EXISTS purchase_orders (
 id TEXT PRIMARY KEY, org_id TEXT NOT NULL, product_id TEXT NOT NULL REFERENCES products(id),
 recommendation_id TEXT NOT NULL REFERENCES recommendations(id), status TEXT NOT NULL,
 ordered_milli INTEGER NOT NULL CHECK(ordered_milli>0), remaining_milli INTEGER NOT NULL CHECK(remaining_milli>=0),
 payload TEXT NOT NULL, UNIQUE(org_id,recommendation_id)
);
CREATE TABLE IF NOT EXISTS outbox_messages (
 id TEXT PRIMARY KEY, org_id TEXT NOT NULL, order_id TEXT NOT NULL REFERENCES purchase_orders(id),
 status TEXT NOT NULL, payload TEXT NOT NULL, UNIQUE(org_id,order_id)
);
CREATE TABLE IF NOT EXISTS receipts (
 id TEXT PRIMARY KEY, org_id TEXT NOT NULL, order_id TEXT NOT NULL REFERENCES purchase_orders(id),
 event_key TEXT NOT NULL, usable_milli INTEGER NOT NULL CHECK(usable_milli>=0),
 damaged_milli INTEGER NOT NULL CHECK(damaged_milli>=0), payload TEXT NOT NULL, UNIQUE(org_id,event_key)
);
CREATE TABLE IF NOT EXISTS activity_events (
 id TEXT PRIMARY KEY, org_id TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, entity_id TEXT NOT NULL,
 created_at TEXT NOT NULL, payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS idempotency (
 org_id TEXT NOT NULL, key TEXT NOT NULL, action TEXT NOT NULL, input_hash TEXT NOT NULL,
 result TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(org_id,key)
);
