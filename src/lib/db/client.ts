import { Database } from "duckdb-async";
import { seedDatabase } from "./seed";

// Bump this whenever the DB schema changes to force a reseed on next request.
const SCHEMA_VERSION = 4;

const globalForDb = global as typeof global & { _db?: Database; _dbVersion?: number };

export async function getDb(): Promise<Database> {
  if (globalForDb._db && globalForDb._dbVersion === SCHEMA_VERSION) {
    return globalForDb._db;
  }

  const db = await Database.create(":memory:");
  await seedDatabase(db);
  globalForDb._db = db;
  globalForDb._dbVersion = SCHEMA_VERSION;
  return db;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const database = await getDb();
  const conn = await database.connect();
  try {
    const stmt = await conn.prepare(sql);
    const result = await stmt.all(...params);
    await stmt.finalize();
    // DuckDB returns COUNT/SUM results as BigInt (HUGEINT). JSON.stringify throws on BigInt,
    // breaking the AI tool. Convert to Number — safe at people-analytics scale (never > 2^53).
    return result.map((row) =>
      Object.fromEntries(
        Object.entries(row as Record<string, unknown>).map(([k, v]) => [
          k,
          typeof v === "bigint" ? Number(v) : v,
        ])
      )
    ) as T[];
  } finally {
    await conn.close();
  }
}
