import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const primaryGlowTarget: "hero" | "tryon" | "none" = "hero";

  return (
    <main className="flex flex-col items-center w-full pt-28">

      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden px-4 pb-14 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.18),transparent_55%)]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1.05fr_0.95fr] gap-12 items-center relative">
          <div className="space-y-6">
            <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-[color:var(--accent-blue-soft)]">
              Premium AI wardrobe
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-[color:var(--text-primary)]">
              Try Fashion Before You Buy
            </h1>
            <p className="text-lg text-[color:var(--text-muted)] max-w-xl leading-relaxed">
              AI-generated models wearing real products, instantly.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className={`btn btn-primary px-6 py-3 ${primaryGlowTarget === "hero" ? "glow-primary" : "glow-none"}`}
              >
                Try on with AI
              </Link>
              <Link
                href="/shop"
                className="btn btn-secondary px-6 py-3 glow-none"
              >
                Browse collection
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4 hover:border-[color:var(--border-soft)] hover:shadow-[var(--shadow-soft)] transition glow-none">
                <p className="text-2xl font-semibold text-[color:var(--text-primary)]">+3K</p>
                <p className="text-[color:var(--text-muted)] text-xs">Looks rendered daily</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4 hover:border-[color:var(--border-soft)] hover:shadow-[var(--shadow-soft)] transition glow-none">
                <p className="text-2xl font-semibold text-[color:var(--text-primary)]">12ms</p>
                <p className="text-[color:var(--text-muted)] text-xs">Average response latency</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4 hover:border-[color:var(--border-soft)] hover:shadow-[var(--shadow-soft)] transition glow-none">
                <p className="text-2xl font-semibold text-[color:var(--text-primary)]">98%</p>
                <p className="text-[color:var(--text-muted)] text-xs">Fit confidence rating</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="panel overflow-hidden relative aspect-[4/3]">
              <Image
                src="/images/page-hero.png"
                alt="NeuroFit hero"
                width={1920}
                height={1080}
                priority
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,11,20,0.75)] via-[rgba(6,11,20,0.35)] to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* QUICK NAV SECTION */}
      <section className="w-full max-w-6xl px-4 pb-20 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent-blue-soft)]">Navigate</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[color:var(--text-primary)]">
              Move through NeuroFit
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex btn px-4 py-2 border border-[color:var(--border-subtle)] text-[color:var(--text-primary)] hover:border-[color:var(--border-soft)] bg-[color:var(--bg-panel)] glow-none"
          >
            Shop all
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Shop", href: "/shop", image: "/images/shop-hero.png", tag: "Collection", desc: "Curated drops + AI sizing" },
            { title: "Closet", href: "/closet", image: "/images/closet-hero.png", tag: "Virtual wardrobe", desc: "Save looks & build outfits" },
            { title: "Sign In", href: "/login", image: "/images/blank-avatar.png", tag: "Account", desc: "Sync purchases & try-ons" },
            { title: "About Us", href: "/about", image: "/images/about-hero.png", tag: "Story", desc: "How we blend fashion x ML" },
          ].map((tile) => (
            <Link key={tile.title} href={tile.href} className="group glow-none">
              <div className="relative aspect-[1/1] overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] hover:border-[color:var(--border-soft)] hover:shadow-[var(--shadow-soft)] transition duration-200">
                <Image
                  src={tile.image}
                  alt={tile.title}
                  fill
                  className="object-cover opacity-80 group-hover:opacity-100 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,11,20,0.6)] to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-4 space-y-1">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--accent-blue-soft)]">
                    {tile.tag}
                  </span>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">{tile.title}</h3>
                  </div>
                  <p className="text-sm text-[color:var(--text-muted)]">{tile.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

