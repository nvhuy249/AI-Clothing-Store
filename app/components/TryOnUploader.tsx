/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  productId: string;
  aiEnabled: boolean;
  authed: boolean;
  primaryGlowTarget?: "hero" | "tryon" | "none";
};

export default function TryOnUploader({
  productId,
  aiEnabled,
  authed,
  primaryGlowTarget = "none",
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error" | "done">("idle");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const disabled = !authed || status === "uploading" || !aiEnabled;

  const onPick = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResultUrl(null);
    }
  };

  const onSave = async () => {
    if (!file) return;
    setStatus("uploading");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", productId);
      const res = await fetch("/api/ai/tryon/user", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResultUrl(data.url || null);
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  const tryOnGlow = primaryGlowTarget === "tryon" ? "glow-primary" : "glow-none";

  return (
    <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-[color:var(--text-muted)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white">Try-On Upload</h3>
        {!authed && <span className="text-xs text-amber-400">Sign in to upload</span>}
        {!aiEnabled && <span className="text-xs text-blue-300 ml-2">AI generation disabled (preview only)</span>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <button
            type="button"
            onClick={onPick}
            disabled={disabled}
            className="btn btn-secondary w-full py-2 disabled:opacity-50 glow-none"
          >
            Choose photo
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={disabled || !file}
            className={`btn btn-primary w-full py-2 disabled:opacity-50 ${tryOnGlow}`}
          >
            {status === "uploading" ? "Saving..." : "Save & generate"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
          {status === "error" && <p className="text-xs text-rose-400">Upload failed. Try again.</p>}
          <p className="text-xs text-[color:var(--text-muted)] leading-5">
            Tip: Use a clear, well-lit full-body photo, neutral pose, plain background, no heavy shadows or obstructions. Avoid group photos, cropped heads, or extreme angles for best try-on results.
          </p>
          <p className="text-xs text-[color:var(--text-muted)] leading-5">
            Your photo is private. Used only for preview. Deleted automatically.
          </p>
        </div>

        <div className="rounded-lg bg-slate-950 border border-slate-800 min-h-[220px] flex items-center justify-center overflow-hidden">
          {resultUrl ? (
            <img src={resultUrl} alt="Generated try-on" className="w-full h-full object-cover" />
          ) : preview ? (
            <img src={preview} alt="Selected" className="w-full h-full object-cover opacity-80" />
          ) : (
            <span className="text-[color:var(--text-muted)] text-xs">Upload a photo to see preview</span>
          )}
        </div>
      </div>
    </div>
  );
}



