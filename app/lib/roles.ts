import { getDb } from "./db";
import { ensureUsersTableName } from "./users";

export type UserRole = "customer" | "admin" | "moderator";

export type AdminUser = {
  customer_id: string;
  name: string;
  email: string;
  roles: UserRole[];
};

const ROLE_VALUES: UserRole[] = ["customer", "admin", "moderator"];

let rolesTableReady: Promise<void> | null = null;

export function getBootstrapAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function ensureRolesTable() {
  rolesTableReady ??= ensureRolesTableInner();
  return rolesTableReady;
}

async function ensureRolesTableInner() {
  await ensureUsersTableName();
  await getDb()`
    CREATE TABLE IF NOT EXISTS user_roles (
      customer_id UUID NOT NULL REFERENCES users(customer_id) ON DELETE CASCADE,
      role VARCHAR(40) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (customer_id, role),
      CHECK (role IN ('customer', 'admin', 'moderator'))
    )
  `;

  const bootstrapEmails = getBootstrapAdminEmails();
  if (bootstrapEmails.length > 0) {
    await getDb()`
      INSERT INTO user_roles (customer_id, role)
      SELECT customer_id, 'admin'
      FROM users
      WHERE lower(email) = ANY(${bootstrapEmails})
      ON CONFLICT (customer_id, role) DO NOTHING
    `;
  }
}

export async function getRolesForEmail(email?: string | null): Promise<UserRole[]> {
  if (!email) return [];
  await ensureRolesTable();

  const rows = await getDb()<Array<{ role: UserRole }>>`
    SELECT ur.role
    FROM user_roles ur
    JOIN users c ON c.customer_id = ur.customer_id
    WHERE lower(c.email) = ${email.toLowerCase()}
    ORDER BY ur.role
  `;

  return rows.map((row) => row.role).filter((role): role is UserRole => ROLE_VALUES.includes(role));
}

export async function isAdminEmail(email?: string | null): Promise<boolean> {
  const roles = await getRolesForEmail(email);
  return roles.includes("admin");
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  await ensureRolesTable();

  const rows = await getDb()<Array<{ customer_id: string; name: string; email: string; roles: UserRole[] }>>`
    SELECT
      c.customer_id,
      c.name,
      c.email,
      COALESCE(array_agg(ur.role ORDER BY ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') AS roles
    FROM users c
    LEFT JOIN user_roles ur ON ur.customer_id = c.customer_id
    GROUP BY c.customer_id
    HAVING COUNT(ur.role) > 0
    ORDER BY c.email ASC
  `;

  return rows.map((row) => ({
    ...row,
    roles: row.roles.filter((role): role is UserRole => ROLE_VALUES.includes(role)),
  }));
}

export async function grantRoleByEmail(email: string, role: UserRole) {
  await ensureRolesTable();

  const rows = await getDb()<Array<{ customer_id: string }>>`
    SELECT customer_id FROM users WHERE lower(email) = ${email.toLowerCase()} LIMIT 1
  `;
  const customer = rows[0];
  if (!customer) return null;

  await getDb()`
    INSERT INTO user_roles (customer_id, role)
    VALUES (${customer.customer_id}, ${role})
    ON CONFLICT (customer_id, role) DO NOTHING
  `;
  return customer.customer_id;
}

export async function grantRoleByCustomerId(customerId: string, role: UserRole) {
  await ensureRolesTable();
  await getDb()`
    INSERT INTO user_roles (customer_id, role)
    VALUES (${customerId}, ${role})
    ON CONFLICT (customer_id, role) DO NOTHING
  `;
}

export async function revokeRole(customerId: string, role: UserRole) {
  await ensureRolesTable();
  await getDb()`
    DELETE FROM user_roles
    WHERE customer_id = ${customerId} AND role = ${role}
  `;
}

export function isRole(value: string): value is UserRole {
  return ROLE_VALUES.includes(value as UserRole);
}
