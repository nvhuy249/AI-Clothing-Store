import Link from "next/link";

export default function Footer() {
  const year: number = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Brand */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-3">
            Neuro<span className="text-blue-400">Fit</span>
          </h2>
          <p className="text-sm text-gray-400">
            AI-generated fashion visualisation platform.  
            No models. Just creativity and code.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white">Home</Link></li>
            <li><Link href="/shop" className="hover:text-white">Shop</Link></li>
            <li><Link href="/generate" className="hover:text-white">AI Generator</Link></li>
            <li><Link href="/about" className="hover:text-white">About</Link></li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h3 className="text-white font-semibold mb-3">Connect</h3>
          <div className="flex space-x-4 text-gray-400">
            <Link href="https://github.com" target="_blank" className="hover:text-white">
              GitHub
            </Link>
            <Link href="https://linkedin.com" target="_blank" className="hover:text-white">
              LinkedIn
            </Link>
            <Link href="#" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-gray-500">
        © {year} AI Fashion Store. All rights reserved.
      </div>
    </footer>
  );
}
