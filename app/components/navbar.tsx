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
      <nav className="bg-white shadow-sm fixed w-full top-0 left-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          {/* Left - Nav Links */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-black transition"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-800"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Center - Logo */}
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-gray-900"
          >
            Neuro<span className="text-green-700">Fit</span>
          </Link>

          {/* Right - Icons */}
          <div className="flex items-center space-x-5">
            <button aria-label="Search" className="hidden md:block text-gray-300 hover:text-green-700">
              <Search size={20} />
            </button>
            <button aria-label="Favourites" className="text-gray-300 hover:text-green-700">
              <Heart size={20} />
            </button>
            <button aria-label="Profile" className="text-gray-300 hover:text-green-700">
              <User size={20} />
            </button>
            <button
              aria-label="Cart"
              className="text-gray-300 hover:text-green-700 relative"
              onClick={() => setCartOpen(!cartOpen)}
            >
              <ShoppingBag size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="flex flex-col items-center py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-blue-600 transition font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Cart Side Panel */}
      {cartOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setCartOpen(false)}
          />

          {/* Cart Drawer */}
          <div className="fixed top-0 right-0 w-full sm:w-1/3 md:w-1/4 h-full bg-white shadow-lg z-50 p-6 overflow-y-auto transition-all">
            <h2 className="text-green-700 font-semibold mb-4">Your Cart</h2>
            <p className="text-gray-500">Your cart is currently empty.</p>
            <button className="text-black fixed top-5 right-5" onClick={() => setCartOpen(false)}><X size={24} /></button>
          </div>
        </>
      )}
    </>
  );
}
