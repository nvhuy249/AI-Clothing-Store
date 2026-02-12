export default function AboutPage() {
  return (
    <div className="pt-18 min-h-screen bg-[color:var(--bg-base)] text-[color:var(--text-primary)] px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent-blue-soft)]">About</p>
          <h1 className="text-4xl font-semibold">Why I built AI Fashion Store</h1>
          <p className="text-[color:var(--text-muted)] max-w-3xl">
            This is a personal sandbox to explore how AI-assisted shopping might feel: real products, try-on renders, and a lean admin backend. It’s not a production store, but it reflects how I approach UX, safety, and tooling.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-5 space-y-2">
            <h2 className="text-xl font-semibold">What’s inside</h2>
            <ul className="list-disc list-inside text-[color:var(--text-muted)] space-y-1 text-sm">
              <li>Next.js App Router, typed APIs, and protected admin area.</li>
              <li>AI try-on via OpenAI/Stability/Replicate with storage on Supabase.</li>
              <li>NextAuth auth (credentials + OAuth), rate limits, and CSRF checks.</li>
              <li>Inventory-aware checkout stub, wishlist, and profile/orders pages.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-5 space-y-2">
            <h2 className="text-xl font-semibold">How the AI flow works</h2>
            <ol className="list-decimal list-inside text-[color:var(--text-muted)] space-y-1 text-sm">
              <li>You pick a product and upload a photo (JPEG/PNG/WebP, max size enforced).</li>
              <li>Image is cleaned (orientation/metadata stripped) and stored privately (Supabase or data URL fallback).</li>
              <li>An AI service generates a try-on render; the URL is saved to your account.</li>
              <li>You can view/delete renders from your profile; caps and toggles apply.</li>
            </ol>
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-5 space-y-3">
          <h2 className="text-xl font-semibold">Privacy & Safety</h2>
          <ul className="list-disc list-inside text-[color:var(--text-muted)] space-y-1 text-sm">
            <li>Uploads are limited by MIME and size; EXIF is stripped server-side.</li>
            <li>Try-on renders are private to your account; you can delete them from profile.</li>
            <li>Admin routes are email-gated; rate limiting is applied to sensitive endpoints.</li>
            <li>AI usage is behind toggles and daily caps to control cost and abuse.</li>
          </ul>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-5 space-y-2">
            <h2 className="text-xl font-semibold">Limitations</h2>
            <ul className="list-disc list-inside text-[color:var(--text-muted)] space-y-1 text-sm">
              <li>No live payments yet (Stripe test slot only).</li>
              <li>Inventory and products are seeded/demo data.</li>
              <li>Rate limiting is in-memory by default; use Redis for multi-instance.</li>
              <li>AI quality varies by prompt/model; not a production fitting room.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-5 space-y-2">
            <h2 className="text-xl font-semibold">Tech stack</h2>
            <ul className="list-disc list-inside text-[color:var(--text-muted)] space-y-1 text-sm">
              <li>Next.js 16 (App Router), TypeScript, Tailwind-ish tokens.</li>
              <li>NextAuth, Postgres, Supabase storage.</li>
              <li>AI: OpenAI, Stability, Replicate VITON; sharp for image prep.</li>
              <li>Sentry-ready, zod validation, middleware rate limiting.</li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-5 space-y-2">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-[color:var(--text-muted)] text-sm">
            Questions or feedback? Open an issue or drop me a note. This is a living project; I iterate as I learn.
          </p>
        </section>
      </div>
    </div>
  );
}

