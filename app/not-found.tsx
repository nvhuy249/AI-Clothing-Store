export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[color:var(--bg-base)] text-[color:var(--text-primary)] px-4">
      <div className="text-5xl font-semibold mb-3">404</div>
      <p className="text-[color:var(--text-muted)] mb-6 text-center">
        We couldn&apos;t find that page. Try heading back to the shop.
      </p>
      <a
        href="/shop"
        className="px-5 py-3 rounded-lg bg-[color:var(--accent-blue)] text-[color:var(--bg-base)] font-semibold"
        aria-label="Back to shop"
      >
        Back to shop
      </a>
    </div>
  );
}

