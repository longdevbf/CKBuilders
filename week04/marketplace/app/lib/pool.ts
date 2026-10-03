import pg from "pg";

const globalForPg = globalThis as unknown as { pgPool?: pg.Pool };

export const pool =
  globalForPg.pgPool ?? new pg.Pool({ connectionString: process.env.DB_URL });

// avoid creating a new pool on every hot reload in dev
if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;
