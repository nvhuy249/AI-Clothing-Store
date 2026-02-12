const faqs = [
  {
    q: "Is this a real store?",
    a: "No. It’s a personal project to explore AI try-on and modern web patterns. Products, payments, and inventory are demo-only.",
  },
  {
    q: "What happens to my uploaded photo?",
    a: "The image is validated (type/size), EXIF-stripped, and stored privately (Supabase if configured). It’s used only to generate your try-on and can be deleted from your profile.",
  },
  {
    q: "Are there limits on AI renders?",
    a: "Yes. Daily caps and toggles are enforced server-side; the UI shows the current cap when provided.",
  },
  {
    q: "Why did a try-on fail?",
    a: "Common causes: missing AI keys, storage not configured, oversized/unsupported image, or daily cap reached. Check the banner on the product page.",
  },
  {
    q: "Can I run this locally?",
    a: "Yes. Set the env vars in README (Postgres, auth secret, optional Supabase/AI keys), then `npm install` and `npm run dev`.",
  },
  {
    q: "How is security handled?",
    a: "NextAuth sessions, admin email gating, input validation with zod, MIME/size checks on uploads, rate limiting and CSRF-origin checks in middleware. See README for details.",
  },
];

export default function FAQPage() {
  return (
    <div className="pt-18 min-h-screen bg-[color:var(--bg-base)] text-[color:var(--text-primary)] px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent-blue-soft)]">FAQ</p>
          <h1 className="text-4xl font-semibold">Frequently Asked Questions</h1>
          <p className="text-[color:var(--text-muted)] max-w-3xl">
            Quick answers about AI try-on, privacy, limits, and running the project yourself.
          </p>
        </header>

        <div className="space-y-4">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4"
            >
              <h2 className="text-lg font-semibold mb-2">{item.q}</h2>
              <p className="text-sm text-[color:var(--text-muted)] leading-6">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

