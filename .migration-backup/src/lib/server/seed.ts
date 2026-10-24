import { getDb, metadata, ORG, setMetadata, transaction } from "./db.ts";

export const DEMO_SEED_VERSION = "estock-demo-blank-v1-20261021";
export const LEGACY_DEMO_SEED_VERSION = "estock-synthetic-v2-seed-20261021";
export const INITIAL_DEMO_DATE = "2026-10-21";

export function seedDatabase(options: { inTransaction?: boolean } = {}) {
  if (metadata("seed_version")) return;
  const initialise = () => {
    if (metadata("seed_version")) return;
    setMetadata("seed_version", DEMO_SEED_VERSION);
    setMetadata("demo_date", INITIAL_DEMO_DATE);
    setMetadata("closed_through", "2026-10-20");
    setMetadata("demo_generation", DEMO_SEED_VERSION);
    // A channel default is configuration, not a product, transaction or supplier message.
    getDb()
      .prepare("INSERT INTO suppliers VALUES(?,?,?,?)")
      .run("supplier-demo", ORG, "Demo supplier", "SIMULATED");
  };
  if (options.inTransaction) initialise();
  else transaction(initialise);
}
