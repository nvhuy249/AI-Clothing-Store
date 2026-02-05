import Link from "next/link";

export default function Footer() {
  const year: number = new Date().getFullYear();

  return (
    <footer className="bg-[color:var(--bg-panel)] border-t border-[color:var(--border-subtle)] text-[color:var(--text-muted)] py-10 mt-16">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--text-primary)] mb-3">
            Neuro<span className="text-[color:var(--accent-blue)]">Fit</span>
          </h2>
          <p className="text-sm text-[color:var(--text-muted)]">
            AI-generated fashion visualisation platform.
            No models. Just creativity and code.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-[color:var(--text-primary)] font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-[color:var(--accent-blue)]">Home</Link></li>
            <li><Link href="/shop" className="hover:text-[color:var(--accent-blue)]">Shop</Link></li>
            <li><Link href="/generate" className="hover:text-[color:var(--accent-blue)]">AI Generator</Link></li>
            <li><Link href="/about" className="hover:text-[color:var(--accent-blue)]">About</Link></li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h3 className="text-[color:var(--text-primary)] font-semibold mb-3">Connect</h3>
          <div className="flex space-x-4 text-[color:var(--text-muted)]">
            <Link href="https://github.com" target="_blank" className="hover:text-[color:var(--accent-blue)]">
              GitHub
            </Link>
            <Link href="https://linkedin.com" target="_blank" className="hover:text-[color:var(--accent-blue)]">
              LinkedIn
            </Link>
            <Link href="#" className="hover:text-[color:var(--accent-blue)]">
              Contact
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-[color:var(--text-muted)]">
        (c) {year} AI Fashion Store. All rights reserved.
      </div>
    </footer>
  );
}

