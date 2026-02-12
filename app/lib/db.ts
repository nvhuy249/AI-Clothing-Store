import postgres, { Sql } from "postgres";

// Singleton Postgres client to avoid connection storms in serverless environments.
let sqlInstance: Sql | null = null;

export function getDb(): Sql {
  if (!sqlInstance) {
    sqlInstance = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
  }
  return sqlInstance;
}

