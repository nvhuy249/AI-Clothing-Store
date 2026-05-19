import { getDb } from "./db";

let usersTableReady: Promise<void> | null = null;

export async function ensureUsersTableName() {
  usersTableReady ??= getDb()`
    DO $$
    BEGIN
      IF to_regclass('public.users') IS NULL AND to_regclass('public.customers') IS NOT NULL THEN
        ALTER TABLE customers RENAME TO users;
      END IF;
    END $$;
  `.then(() => undefined);

  return usersTableReady;
}
