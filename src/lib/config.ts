import { query } from '@/lib/db';

/**
 * Retrieve a config value from platform_config table.
 * Returns the value as string or null if not found.
 */
export async function getConfigValue(key: string): Promise<string | null> {
  try {
    const res = await query('SELECT value FROM platform_config WHERE key = $1', [key]);
    if (res.rows.length > 0) return res.rows[0].value as string;
    return null;
  } catch (e) {
    console.error(`[Config] Failed to fetch key ${key}:`, e);
    return null;
  }
}
