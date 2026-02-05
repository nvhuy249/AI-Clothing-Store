/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Heart, User, ShoppingBag, Search } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const { items, removeItem, updateQty, clear, total, count } = useCart();
  const { count: wishCount } = useWishlist();

  // Avoid hydration mismatch for badges that depend on client-only state
  useEffect(() => {
    // schedule after paint to avoid hydration mismatch lint warning
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const navLinks = [
    { href: "/women", label: "Women" },
    { href: "/men", label: "Men" },
    { href: "/accessories", label: "Accessories" },
  ];

  const navLinkClass =
    "relative text-sm font-medium text-[color:var(--text-primary)] hover:text-[color:var(--accent-blue)] transition group";

  return (
    <>
      {/* Navbar */}
      <nav className="fixed w-full top-0 left-0 z-50 border-b border-[color:var(--border-subtle)] bg-[rgba(6,11,20,0.78)] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          {/* Left - Nav Links */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={navLinkClass}
              >
                {link.label}

                <span
                  className="
                    absolute left-0 -bottom-1 h-[2px] w-0 bg-[color:var(--accent-blue)] 
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
              className="text-[color:var(--text-muted)] hover:text-[color:var(--accent-blue)]"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Search button */}
            <button
              aria-label="Search"
              className="text-[color:var(--text-muted)] hover:text-[color:var(--accent-blue)]"
            >
              <Search size={20} />
            </button>
          </div>


          {/* Center - Logo */}
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-[color:var(--text-primary)]"
          >
            NEURO<span className="text-[color:var(--accent-blue)]">FIT</span>
          </Link>

          {/* Right - Icons */}
          <div className="flex items-center space-x-5">
            <button
              aria-label="Search"
              className="hidden md:block text-[color:var(--text-muted)] hover:text-[color:var(--accent-blue)]"
            >
              <Search size={20} />
            </button>
            <Link
              aria-label="Favourites"
              href="/wishlist"
              className="text-[color:var(--text-muted)] hover:text-[color:var(--accent-blue)] relative"
            >
              {wishCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[color:var(--accent-blue)] text-[color:var(--bg-base)] text-[10px] px-1.5 py-0.5 rounded-full">
                  {wishCount}
                </span>
              )}
              <Heart size={20} />
            </Link>
            <Link
              aria-label="Profile"
              href="/profile"
              className="text-[color:var(--text-muted)] hover:text-[color:var(--accent-blue)]"
            >
              <User size={20} />
            </Link>
            <button
              aria-label="Cart"
            className="text-[color:var(--text-muted)] hover:text-[color:var(--accent-blue)] relative"
            onClick={() => setCartOpen(!cartOpen)}
          >
            <ShoppingBag size={20} />
              {mounted && count > 0 && (
                <span className="absolute -top-2 -right-2 bg-[color:var(--accent-blue)] text-[color:var(--bg-base)] text-[10px] px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-[color:var(--bg-panel)] border-t border-[color:var(--border-subtle)] backdrop-blur-md">
            <div className="flex flex-col items-center py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[color:var(--text-primary)] hover:text-[color:var(--accent-blue)] transition font-medium"
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
            fixed inset-0 z-[80] transition-opacity duration-300
            ${cartOpen ? "bg-[rgba(6,11,20,0.65)]" : "bg-transparent"}
          `}
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Cart Drawer */}
      <div
        className={`
          fixed top-0 right-0 z-[90] h-full w-full sm:w-1/3 md:w-1/4 bg-[color:var(--bg-panel)] text-[color:var(--text-primary)] border-l border-[color:var(--border-subtle)] shadow-[var(--shadow-card)] p-6
          transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          ${cartOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <button
          className="absolute top-5 right-5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
          onClick={() => setCartOpen(false)}
        >
          <X size={24} />
        </button>

        <h2 className="text-[color:var(--accent-blue-soft)] font-semibold mb-4">Your Cart</h2>
        {!mounted ? (
          <p className="text-[color:var(--text-muted)]">Loading cart...</p>
        ) : items.length === 0 ? (
          <p className="text-[color:var(--text-muted)]">Your cart is currently empty.</p>
        ) : (
          <div className="flex flex-col gap-3 h-full">
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 border-b border-[color:var(--border-subtle)] pb-3"
                >
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
                  ) : (
                    <div className="w-14 h-14 bg-[color:var(--bg-base)] rounded-lg border border-[color:var(--border-subtle)]" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-[color:var(--text-primary)]">
                      {item.name}
                    </div>
                    <div className="text-sm text-[color:var(--text-muted)] flex items-center gap-2">
                      <button
                        className="w-7 h-7 rounded-lg border border-[color:var(--border-subtle)] text-[color:var(--text-primary)] hover:border-[color:var(--border-soft)] hover:bg-[color:var(--bg-base)] glow-none"
                        onClick={() => updateQty(item.productId, -1)}
                      >
                        -
                      </button>
                      <span>{item.qty}</span>
                      <button
                        className="w-7 h-7 rounded-lg border border-[color:var(--border-subtle)] text-[color:var(--text-primary)] hover:border-[color:var(--border-soft)] hover:bg-[color:var(--bg-base)] glow-none"
                        onClick={() => updateQty(item.productId, 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="text-sm text-[color:var(--text-primary)] font-semibold">
                      ${(Number(item.price) * item.qty).toFixed(2)}
                    </div>
                  </div>
                  <button
                    className="text-sm text-red-300 hover:text-red-200 glow-none"
                    onClick={() => removeItem(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-[color:var(--border-subtle)] pt-3 text-sm text-[color:var(--text-primary)] sticky bottom-0 bg-[color:var(--bg-panel)] pb-2">
              <div className="flex justify-between mb-3">
                <span>Subtotal</span>
                <span className="font-semibold">${total.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="w-1/2 py-3 rounded-lg border border-[color:var(--border-soft)] text-[color:var(--text-primary)] hover:border-[color:var(--accent-blue)] hover:bg-[rgba(59,130,246,0.08)] text-sm font-semibold glow-none"
                  onClick={clear}
                >
                  Clear
                </button>
                <Link
                  href="/checkout"
                  className="w-1/2 py-3 rounded-lg bg-[color:var(--accent-blue)] hover:brightness-110 text-[color:var(--bg-base)] text-center text-sm font-semibold glow-none"
                  onClick={() => setCartOpen(false)}
                >
                  Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
