"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[color:var(--bg-base)] text-[color:var(--text-primary)] px-4">
      <div className="text-4xl font-semibold mb-3">Something went wrong</div>
      <p className="text-[color:var(--text-muted)] mb-6 text-center max-w-md">
        {error?.message || "An unexpected error occurred."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-3 rounded-lg bg-[color:var(--accent-blue)] text-[color:var(--bg-base)] font-semibold"
          aria-label="Retry"
        >
          Retry
        </button>
        <a
          href="/"
          className="px-5 py-3 rounded-lg border border-[color:var(--border-subtle)] text-[color:var(--text-primary)]"
          aria-label="Go home"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

