import { Database } from "duckdb-async";
import { seedDatabase } from "./seed";

// Use global to survive Next.js hot-module reloads across workers
const globalForDb = global as typeof global & { _db?: Database };

export async function getDb(): Promise<Database> {
  if (globalForDb._db) return globalForDb._db;

  const db = await Database.create(":memory:");
  await seedDatabase(db);
  globalForDb._db = db;
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
    return result as T[];
  } finally {
    await conn.close();
  }
}
