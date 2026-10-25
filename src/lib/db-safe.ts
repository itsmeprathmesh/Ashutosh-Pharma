/**
 * Public, read-only pages can remain usable while local development is missing
 * database credentials. Write operations should still return an explicit error.
 */
export async function safeDatabaseQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  if (!process.env.DATABASE_URL || process.env.TEST_DATABASE_ENABLED === "false") return fallback;
  try {
    return await query();
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "public_database_query_failed", errorName: error instanceof Error ? error.name : "unknown" }));
    return fallback;
  }
}
