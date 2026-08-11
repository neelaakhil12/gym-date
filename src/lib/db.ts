import { Pool } from 'pg';

// Global singleton pattern to prevent multiple pool creation in Next.js
declare global {
  var postgresPool: Pool | undefined;
}

const pool =
  global.postgresPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
    max: 10, // Max 10 active connections in pool (prevents CPU spikes)
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 5000, // Timeout after 5s if connection fails
  });

if (process.env.NODE_ENV !== 'production') {
  global.postgresPool = pool;
}

export default pool;

// Helper to run queries safely
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

