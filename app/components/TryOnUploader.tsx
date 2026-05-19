/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

type Props = {
  productId: string;
  aiEnabled: boolean;
  authed: boolean;
  primaryGlowTarget?: "hero" | "tryon" | "none";
  dailyCap?: number | null;
};

export default function TryOnUploader({
  productId,
  aiEnabled,
  authed,
  dailyCap = null,
  primaryGlowTarget = "none",
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [privacyBlur, setPrivacyBlur] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const maxUploadBytes = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES || 5 * 1024 * 1024);
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  const getCsrf = () => {
    if (typeof document === "undefined") return "";
    const match = document.cookie.match(/csrfToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  };

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
      setError(null);
      if (!allowedTypes.includes(f.type)) {
        setStatus("error");
        setError("Use a JPEG, PNG, or WebP image.");
        return;
      }
      if (f.size > maxUploadBytes) {
        setStatus("error");
        setError(`Image is too large. Max upload size is ${(maxUploadBytes / 1024 / 1024).toFixed(1)} MB.`);
        return;
      }
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResultUrl(null);
      setStatus("idle");
    }
  };

  const onSave = async () => {
    if (!file) return;
    if (!consent) {
      setStatus("error");
      setError("Confirm the image is yours or you have permission to use it.");
      return;
    }
    setStatus("uploading");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", productId);
      const res = await fetch("/api/ai/tryon/user", {
        method: "POST",
        headers: { "x-csrf-token": getCsrf() },
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed. Try again.");
      }
      const data = await res.json();
      setResultUrl(data.url || null);
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("error");
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    }
  };

  const tryOnGlow = primaryGlowTarget === "tryon" ? "glow-primary" : "glow-none";

  return (
    <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-[color:var(--text-muted)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">Try-On Upload</h3>
          <span
            className="group relative inline-flex text-[color:var(--text-muted)]"
            tabIndex={0}
            aria-label="Privacy note"
          >
            <Info size={15} />
            <span className="pointer-events-none absolute left-1/2 top-6 z-10 hidden w-64 -translate-x-1/2 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-3 text-xs leading-5 text-[color:var(--text-muted)] shadow-[var(--shadow-card)] group-hover:block group-focus:block">
              Your selected photo preview is blurred by default on this device. The uploaded image is sent only when you generate a try-on and can be deleted from your profile history.
            </span>
          </span>
        </div>
        <div>
          {!authed && <span className="text-xs text-amber-400">Sign in to upload</span>}
          {!aiEnabled && <span className="text-xs text-blue-300 ml-2">AI generation disabled (preview only)</span>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <button
            type="button"
            onClick={onPick}
            disabled={disabled}
            className="btn btn-secondary w-full py-2 disabled:opacity-50 glow-none"
            aria-label="Choose a photo for try-on"
          >
            Choose photo
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={disabled || !file || !consent}
            className={`btn btn-primary w-full py-2 disabled:opacity-50 ${tryOnGlow}`}
            aria-label="Upload and generate try-on"
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
          <label className="flex items-start gap-2 text-xs leading-5 text-[color:var(--text-muted)]">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1"
            />
            I own this image or have permission to use it, and it does not contain sensitive personal content.
          </label>
          <label className="flex items-start gap-2 text-xs leading-5 text-[color:var(--text-muted)]">
            <input
              type="checkbox"
              checked={privacyBlur}
              onChange={(event) => setPrivacyBlur(event.target.checked)}
              className="mt-1"
            />
            Blur uploaded preview by default to reduce on-screen PII exposure.
          </label>
          {status === "error" && <p className="text-xs text-rose-400">{error || "Upload failed. Try again."}</p>}
          <p className="text-xs text-[color:var(--text-muted)] leading-5">
            Tip: Use a clear, well-lit full-body photo, neutral pose, plain background, no heavy shadows or obstructions. Avoid group photos, cropped heads, or extreme angles for best try-on results.
          </p>
          <p className="text-xs text-[color:var(--text-muted)] leading-5">
            Privacy: your upload is used only to render this try-on and stored privately; delete anytime from your profile.
          </p>
          {dailyCap && (
            <p className="text-[11px] text-[color:var(--text-muted)]">
              Daily AI render cap: {dailyCap} per store (resets daily).
            </p>
          )}
        </div>

        <div className="rounded-lg bg-slate-950 border border-slate-800 min-h-[220px] flex items-center justify-center overflow-hidden">
          {resultUrl ? (
            <img src={resultUrl} alt="Generated try-on" className="w-full h-full object-cover" />
          ) : preview ? (
            <div className="relative h-full w-full">
              <img
                src={preview}
                alt="Selected"
                className={`h-full w-full object-cover opacity-80 transition duration-200 ${privacyBlur ? "blur-md scale-105" : ""}`}
              />
              {privacyBlur && (
                <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  Privacy blur on
                </span>
              )}
            </div>
          ) : (
            <span className="text-[color:var(--text-muted)] text-xs">Upload a photo to see preview</span>
          )}
        </div>
      </div>
    </div>
  );
}



