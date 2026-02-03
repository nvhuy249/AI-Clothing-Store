"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Heart, User, ShoppingBag, Search } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const { items, removeItem, updateQty, clear, total, count } = useCart();
  const { count: wishCount } = useWishlist();

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
            <Link aria-label="Favourites" href="/wishlist" className="text-gray-700 hover:text-blue-700 relative">
              {wishCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {wishCount}
                </span>
              )}
              <Heart size={20} />
            </Link>
            <Link aria-label="Profile" href="/profile" className="text-gray-700 hover:text-blue-700">
              <User size={20} />
            </Link>
            <button
              aria-label="Cart"
              className="text-gray-700 hover:text-blue-700 relative"
              onClick={() => setCartOpen(!cartOpen)}
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
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
            fixed inset-0 z-[80] transition-opacity duration-300
            ${cartOpen ? "bg-gray-900/40" : "bg-transparent"}
          `}
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Cart Drawer */}
      <div
        className={`
          fixed top-0 right-0 z-[90] h-full w-full sm:w-1/3 md:w-1/4 bg-slate-900 text-white shadow-xl p-6
          transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          ${cartOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <button
          className="absolute top-5 right-5 text-white"
          onClick={() => setCartOpen(false)}
        >
          <X size={24} />
        </button>

        <h2 className="text-blue-300 font-semibold mb-4">Your Cart</h2>
        {items.length === 0 ? (
          <p className="text-slate-300">Your cart is currently empty.</p>
        ) : (
          <div className="flex flex-col gap-3 h-full">
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 border-b pb-2">
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} className="w-14 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-white">{item.name}</div>
                    <div className="text-sm text-slate-300 flex items-center gap-2">
                      <button
                        className="w-6 h-6 rounded border border-slate-600 text-white hover:bg-slate-800"
                        onClick={() => updateQty(item.productId, -1)}
                      >
                        -
                      </button>
                      <span>{item.qty}</span>
                      <button
                        className="w-6 h-6 rounded border border-slate-600 text-white hover:bg-slate-800"
                        onClick={() => updateQty(item.productId, 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="text-sm text-white font-semibold">
                      ${(Number(item.price) * item.qty).toFixed(2)}
                    </div>
                  </div>
                  <button
                    className="text-sm text-red-300 hover:text-red-200"
                    onClick={() => removeItem(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-700 pt-3 text-sm text-white sticky bottom-0 bg-slate-900 pb-2">
              <div className="flex justify-between mb-3">
                <span>Subtotal</span>
                <span className="font-semibold">${total.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="w-1/2 py-3 rounded border border-slate-600 text-slate-200 hover:bg-slate-800 text-sm font-semibold"
                  onClick={clear}
                >
                  Clear
                </button>
                <Link
                  href="/checkout"
                  className="w-1/2 py-3 rounded bg-blue-600 hover:bg-blue-500 text-white text-center text-sm font-semibold"
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
