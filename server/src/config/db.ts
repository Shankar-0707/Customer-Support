import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

/**
 * PostgreSQL connection pool for Neon DB.
 *
 * Uses individual credentials from env vars.
 * SSL is required for Neon DB connections.
 */
export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  max: 10, // Max connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Fail after 10s if can't connect
});

/**
 * Test the database connection.
 * Used by the health check endpoint.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT NOW()");

    // Create mock memories table for hindsight fallback
    await client.query(`
      CREATE TABLE IF NOT EXISTS hindsight_mock_memories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bank_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hindsight_mock_memories_bank 
      ON hindsight_mock_memories(bank_id)
    `);

    client.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

/**
 * Helper to run parameterized queries.
 * Wraps pool.query with proper typing.
 */
export async function query<T extends pg.QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  if (env.NODE_ENV === "development") {
    console.log(`📊 Query executed in ${duration}ms | Rows: ${result.rowCount}`);
  }

  return result;
}
