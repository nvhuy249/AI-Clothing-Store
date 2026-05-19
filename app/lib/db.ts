import postgres, { Sql } from "postgres";

// Singleton Postgres client to avoid connection storms in serverless environments.
let sqlInstance: Sql | null = null;

export const postgresOptions = {
  ssl: "require" as const,
  max_lifetime: null,
};

export function getDb(): Sql {
  if (!sqlInstance) {
    sqlInstance = postgres(process.env.POSTGRES_URL!, postgresOptions);
  }
  return sqlInstance;
}
