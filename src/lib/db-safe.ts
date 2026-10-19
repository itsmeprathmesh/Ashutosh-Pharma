/**
 * Public, read-only pages can remain usable while local development is missing
 * database credentials. Write operations should still return an explicit error.
 */
export async function safeDatabaseQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  if (!process.env.DATABASE_URL || process.env.TEST_DATABASE_ENABLED === "false") return fallback;
  try {
    return await query();
  } catch {
    return fallback;
  }
}
