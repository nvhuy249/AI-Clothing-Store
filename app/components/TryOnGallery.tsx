"use client";

import { useState } from "react";

type TryOnItem = {
  photo_id: string;
  image_url: string;
  created_at: string;
};

type Props = {
  items: TryOnItem[];
};

export default function TryOnGallery({ items }: Props) {
  const [data, setData] = useState(items);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(photoId: string) {
    setBusyId(photoId);
    setError(null);
    try {
      const res = await fetch(`/api/ai/tryon/user?photoId=${photoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setData((prev) => prev.filter((x) => x.photo_id !== photoId));
    } catch (e: any) {
      setError(e.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">My Try-On Gallery</h2>
        <span className="text-sm text-slate-400">{data.length} generated</span>
      </div>
      {error && <p className="text-xs text-rose-400 mb-2">{error}</p>}
      {data.length === 0 ? (
        <div className="text-slate-400 text-sm">No try-on images yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.map((t) => (
            <div
              key={t.photo_id}
              className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950/60 flex flex-col"
            >
              <img src={t.image_url} alt="Try-on result" className="w-full h-52 object-cover" />
              <div className="p-2 text-xs text-slate-400 flex items-center justify-between">
                <span>{new Date(t.created_at).toLocaleDateString()}</span>
                <button
                  onClick={() => onDelete(t.photo_id)}
                  disabled={busyId === t.photo_id}
                  className="text-rose-300 hover:text-rose-200 disabled:opacity-50"
                >
                  {busyId === t.photo_id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
