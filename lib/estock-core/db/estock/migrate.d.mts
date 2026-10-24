import type { Client, PoolClient } from "pg";
export function migrate(client: Client | PoolClient): Promise<void>;
