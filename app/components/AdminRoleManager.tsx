"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminUser, UserRole } from "../lib/roles";

type Props = {
  initialUsers?: AdminUser[];
};

const roleOptions: UserRole[] = ["admin", "moderator"];

export default function AdminRoleManager({ initialUsers = [] }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/roles", {
      headers: { "x-csrf-token": getCsrf() },
    });
    if (!res.ok) return;
    const data = await res.json();
    setUsers(Array.isArray(data.users) ? data.users : []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function grant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrf() },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to grant role");
      setEmail("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to grant role");
    } finally {
      setSaving(false);
    }
  }

  async function revoke(customerId: string, nextRole: UserRole) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrf() },
        body: JSON.stringify({ customerId, role: nextRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to revoke role");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to revoke role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4">
      <div className="mb-4">
        <p className="text-sm text-[color:var(--text-muted)]">Access control</p>
        <h2 className="text-xl font-semibold">Admin roles</h2>
      </div>

      <form onSubmit={grant} className="grid gap-3 md:grid-cols-[1fr_160px_120px]">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="user@example.com"
          className="rounded border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-3 py-2"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          className="rounded border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-3 py-2"
        >
          {roleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-[color:var(--accent-blue)] px-4 py-2 font-semibold text-[color:var(--bg-base)] hover:brightness-110 disabled:opacity-60"
        >
          Grant
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      <div className="mt-4 space-y-2">
        {users.length === 0 ? (
          <p className="text-sm text-[color:var(--text-muted)]">No roles assigned yet.</p>
        ) : (
          users.map((user) => (
            <div
              key={user.customer_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] p-3"
            >
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-[color:var(--text-muted)]">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.roles.map((assignedRole) => (
                  <button
                    key={assignedRole}
                    type="button"
                    disabled={saving}
                    onClick={() => revoke(user.customer_id, assignedRole)}
                    className="rounded-full border border-[color:var(--border-subtle)] px-3 py-1 text-xs text-[color:var(--text-primary)] hover:border-rose-500/60 hover:text-rose-300 disabled:opacity-60"
                  >
                    {assignedRole} x
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function getCsrf() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/csrfToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
