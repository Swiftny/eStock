import { closeDb, databasePath, getDb } from "../src/lib/server/db.ts";
import { seedDatabase } from "../src/lib/server/seed.ts";
getDb();
if (process.argv.includes("--seed")) seedDatabase();
console.log(`SQLite ready: ${databasePath()}. Migrations applied${process.argv.includes("--seed") ? "; synthetic seed present" : ""}.`);
closeDb();
