"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Heart, User, ShoppingBag, Search } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [cartOpen, setCartOpen] = useState<boolean>(false);

  const navLinks = [
    { href: "/women", label: "Women" },
    { href: "/men", label: "Men" },
    { href: "/accessories", label: "Accessories" },
  ];

  return (
    <>
      {/* Navbar */}
      <nav className="bg-black shadow-sm fixed w-full top-0 left-0 z-50 border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          {/* Left - Nav Links */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm font-medium text-white hover:text-blue-700 transition group"
              >
                {link.label}

                <span
                  className="
                    absolute left-0 -bottom-1 h-[2px] w-0 bg-blue-700 
                    transition-all duration-300 group-hover:w-full
                  "
                />
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-3">
            {/* Menu button */}
            <button
              className="text-gray-800"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Search button */}
            <button aria-label="Search" className="text-gray-700 hover:text-blue-700">
              <Search size={20} />
            </button>
          </div>


          {/* Center - Logo */}
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-white"
          >
            NEURO<span className="text-blue-700">FIT</span>
          </Link>

          {/* Right - Icons */}
          <div className="flex items-center space-x-5">
            <button aria-label="Search" className="hidden md:block text-gray-700 hover:text-blue-700">
              <Search size={20} />
            </button>
            <button aria-label="Favourites" className="text-gray-700 hover:text-blue-700">
              <Heart size={20} />
            </button>
            <Link aria-label="Profile" href="/profile" className="text-gray-700 hover:text-blue-700">
              <User size={20} />
            </Link>
            <button
              aria-label="Cart"
              className="text-gray-700 hover:text-blue-700 relative"
              onClick={() => setCartOpen(!cartOpen)}
            >
              <ShoppingBag size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-black border-t border-gray-900">
            <div className="flex flex-col items-center py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:text-blue-600 transition font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Cart Overlay */}
      {cartOpen && (
        <div
          className={`
            fixed inset-0 z-40 bg-black transition-opacity duration-300
            ${cartOpen ? "bg-opacity-30" : "bg-opacity-0"}
          `}
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Cart Drawer */}
      <div
        className={`
          fixed top-0 right-0 z-50 h-full w-full sm:w-1/3 md:w-1/4 bg-white shadow-xl p-6
          transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          ${cartOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <button
          className="absolute top-5 right-5 text-black"
          onClick={() => setCartOpen(false)}
        >
          <X size={24} />
        </button>

        <h2 className="text-blue-700 font-semibold mb-4">Your Cart</h2>
        <p className="text-gray-500">Your cart is currently empty.</p>
      </div>
    </>
  );
}

