"use client";

import { useEffect, useState } from "react";

type ImportRow = {
  rowNumber: number;
  name: string;
  description: string | null;
  price: number | null;
  stock: number;
  colour: string | null;
  size: string | null;
  fit: string | null;
  material: string | null;
  photos: string[] | null;
  errors: string[];
};

type ImportJob = {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  total_rows: number;
  processed_rows: number;
  inserted_rows: number;
  failed_rows: number;
  error: string | null;
};

export default function ProductCsvImport({ onComplete }: { onComplete: () => void }) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validCount = rows.filter((row) => row.errors.length === 0).length;
  const invalidCount = rows.length - validCount;

  async function preview(file: File) {
    setBusy(true);
    setError(null);
    setJob(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/products/imports", {
        method: "POST",
        headers: { "x-csrf-token": getCsrf() },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "CSV preview failed");
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function startImport() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrf() },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Import failed to start");
      setJob({
        job_id: data.jobId,
        status: "queued",
        total_rows: validCount,
        processed_rows: 0,
        inserted_rows: 0,
        failed_rows: 0,
        error: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed to start");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;

    const id = setInterval(async () => {
      const res = await fetch(`/api/admin/products/imports?jobId=${job.job_id}`, {
        headers: { "x-csrf-token": getCsrf() },
      });
      if (!res.ok) return;
      const data = await res.json();
      setJob(data.job);
      if (data.job?.status === "completed") onComplete();
    }, 900);

    return () => clearInterval(id);
  }, [job, onComplete]);

  return (
    <section className="mb-6 rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-[color:var(--text-muted)]">Bulk upload</p>
          <h2 className="text-xl font-semibold">CSV product import</h2>
        </div>
        <label className="inline-flex cursor-pointer rounded-lg border border-[color:var(--border-subtle)] px-4 py-2 text-sm text-[color:var(--text-primary)] hover:border-[color:var(--border-soft)]">
          Choose CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) preview(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      <p className="mb-3 text-xs leading-5 text-[color:var(--text-muted)]">
        Headers: name, price, stock, description, colour, size, fit, material, photos. Use semicolons or pipes between multiple photo URLs.
      </p>

      {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}

      {rows.length > 0 && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-[color:var(--text-muted)]">{rows.length} rows</span>
            <span className="text-emerald-300">{validCount} valid</span>
            <span className={invalidCount > 0 ? "text-amber-300" : "text-[color:var(--text-muted)]"}>{invalidCount} invalid</span>
            <button
              type="button"
              disabled={busy || validCount === 0 || Boolean(job)}
              onClick={startImport}
              className="rounded bg-[color:var(--accent-blue)] px-4 py-2 font-semibold text-[color:var(--bg-base)] hover:brightness-110 disabled:opacity-60"
            >
              {busy ? "Working..." : "Start import"}
            </button>
          </div>

          <div className="max-h-72 overflow-auto rounded-lg border border-[color:var(--border-subtle)]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[color:var(--bg-base)] text-xs uppercase text-[color:var(--text-muted)]">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Colour</th>
                  <th className="px-3 py-2">Issues</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((row) => (
                  <tr key={row.rowNumber} className="border-t border-[color:var(--border-subtle)]">
                    <td className="px-3 py-2 text-[color:var(--text-muted)]">{row.rowNumber}</td>
                    <td className="px-3 py-2">{row.name || "-"}</td>
                    <td className="px-3 py-2">{row.price ?? "-"}</td>
                    <td className="px-3 py-2">{row.stock}</td>
                    <td className="px-3 py-2">{row.colour || "-"}</td>
                    <td className={row.errors.length ? "px-3 py-2 text-amber-300" : "px-3 py-2 text-emerald-300"}>
                      {row.errors.length ? row.errors.join(" ") : "Ready"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {job && (
        <div className="mt-4 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] p-3 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold capitalize">{job.status}</span>
            <span className="text-[color:var(--text-muted)]">
              {job.processed_rows}/{job.total_rows}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[color:var(--bg-panel)]">
            <div
              className="h-full rounded-full bg-[color:var(--accent-blue)]"
              style={{ width: `${job.total_rows ? Math.round((job.processed_rows / job.total_rows) * 100) : 0}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[color:var(--text-muted)]">
            Inserted {job.inserted_rows}; failed {job.failed_rows}
            {job.error ? `; ${job.error}` : ""}
          </p>
        </div>
      )}
    </section>
  );
}

function getCsrf() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/csrfToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
