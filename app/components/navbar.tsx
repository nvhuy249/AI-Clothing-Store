/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, X, Heart, User, ShoppingBag, Search } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";

type NavbarSearchProps = {
  open: boolean;
  value: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  suggestions: SearchSuggestion[];
  loadingSuggestions: boolean;
  compact?: boolean;
  onOpen: () => void;
  onClose: () => void;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSuggestionClick: () => void;
};

type SearchSuggestion = {
  product_id: string;
  name: string;
  price: number;
  photos: string[] | null;
  brand_name: string | null;
  category_name: string | null;
  colour: string | null;
};

function NavbarSearch({
  open,
  value,
  inputRef,
  suggestions,
  loadingSuggestions,
  compact = false,
  onOpen,
  onClose,
  onChange,
  onSubmit,
  onSuggestionClick,
}: NavbarSearchProps) {
  const showDropdown = open && value.trim().length >= 2;

  return (
    <div className="relative">
      <form
        onSubmit={onSubmit}
        className={`relative flex h-9 items-center justify-end overflow-hidden rounded-full border transition-all duration-300 ease-out ${
          open
            ? `${compact ? "w-56" : "w-72"} border-[color:var(--border-soft)] bg-[color:var(--bg-panel)] pl-3 pr-9`
            : "w-9 border-transparent bg-transparent"
        }`}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
          }}
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          placeholder="Search products"
          className={`h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-[color:var(--text-primary)] outline-none ring-0 placeholder:text-[color:var(--text-muted)] focus:border-0 focus:outline-none focus:ring-0 transition-opacity duration-200 ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
        <button
          type="button"
          aria-label={open ? "Focus search" : "Open search"}
          onClick={(event) => {
            event.preventDefault();
            onOpen();
            inputRef.current?.focus();
          }}
          className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center text-[color:var(--text-muted)] transition-transform duration-300 hover:text-[color:var(--accent-blue)]"
        >
          <Search size={20} />
        </button>
      </form>

      {showDropdown && (
        <div
          className={`absolute right-0 top-11 z-[95] w-80 overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] shadow-[var(--shadow-card)] ${
            compact ? "max-w-[calc(100vw-2rem)]" : ""
          }`}
        >
          {loadingSuggestions ? (
            <div className="p-4 text-sm text-[color:var(--text-muted)]">Searching...</div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-sm text-[color:var(--text-muted)]">No quick matches. Press Enter to search all products.</div>
          ) : (
            <div className="py-2">
              {suggestions.map((item) => {
                const meta = [item.brand_name, item.category_name, item.colour].filter(Boolean).join(" / ");
                const photo = item.photos?.[0];
                return (
                  <Link
                    key={item.product_id}
                    href={`/product/${item.product_id}`}
                    onClick={onSuggestionClick}
                    className="flex gap-3 px-3 py-2 transition hover:bg-[color:var(--bg-base)]"
                  >
                    {photo ? (
                      <img src={photo} alt={item.name} className="h-14 w-11 rounded-lg object-cover" />
                    ) : (
                      <div className="h-14 w-11 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[color:var(--text-primary)]">{item.name}</p>
                      {meta && <p className="truncate text-xs text-[color:var(--text-muted)]">{meta}</p>}
                      <p className="text-xs font-semibold text-[color:var(--text-primary)]">${Number(item.price).toFixed(2)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              const syntheticEvent = { preventDefault() {} } as React.FormEvent<HTMLFormElement>;
              onSubmit(syntheticEvent);
            }}
            className="w-full border-t border-[color:var(--border-subtle)] px-3 py-2 text-left text-sm text-[color:var(--accent-blue-soft)] hover:bg-[color:var(--bg-base)]"
          >
            Search all for &quot;{value.trim()}&quot;
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<NavbarShell />}>
      <NavbarInner />
    </Suspense>
  );
}

function NavbarShell() {
  return (
    <nav className="fixed w-full top-0 left-0 z-50 border-b border-[color:var(--border-subtle)] bg-[rgba(6,11,20,0.78)] backdrop-blur-md">
      <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="hidden md:flex space-x-8">
          <span className="text-sm font-medium text-[color:var(--text-primary)]">Women</span>
          <span className="text-sm font-medium text-[color:var(--text-primary)]">Men</span>
          <span className="text-sm font-medium text-[color:var(--text-primary)]">Accessories</span>
        </div>
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 text-2xl font-extrabold tracking-tight text-[color:var(--text-primary)]"
        >
          NEURO<span className="text-[color:var(--accent-blue)]">FIT</span>
        </Link>
        <div className="h-9 w-32" />
      </div>
    </nav>
  );
}

function NavbarInner() {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState<string>(() => searchParams.get("query") || "");
  const { items, removeItem, updateQty, clear, total, count } = useCart();
  const { count: wishCount } = useWishlist();
  const { data: session } = useSession();

  // Avoid hydration mismatch for badges that depend on client-only state
  useEffect(() => {
    // schedule after paint to avoid hydration mismatch lint warning
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const id = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [searchOpen]);

  useEffect(() => {
    const query = searchValue.trim();
    if (!searchOpen || query.length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingSuggestions(false);
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchOpen, searchValue]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchValue.trim();
    if (!query) {
      setSearchOpen(true);
      searchInputRef.current?.focus();
      return;
    }

    const params = pathname === "/shop"
      ? new URLSearchParams(Array.from(searchParams.entries()))
      : new URLSearchParams();

    params.set("query", query);
    params.set("page", "1");

    const suffix = params.toString();
    router.push(`/shop${suffix ? `?${suffix}` : ""}`);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSuggestions([]);
  };

  const openSearch = () => {
    setSearchOpen(true);
    setCartOpen(false);
  };

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
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
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

            <NavbarSearch
              open={searchOpen}
              value={searchValue}
              inputRef={searchInputRef}
              suggestions={suggestions}
              loadingSuggestions={loadingSuggestions}
              onOpen={openSearch}
              onClose={closeSearch}
              onChange={setSearchValue}
              onSubmit={submitSearch}
              onSuggestionClick={closeSearch}
              compact
            />
          </div>


          {/* Center - Logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-2xl font-extrabold tracking-tight text-[color:var(--text-primary)]"
          >
            NEURO<span className="text-[color:var(--accent-blue)]">FIT</span>
          </Link>

          {/* Right - Icons */}
          <div className="flex items-center space-x-5">
            <div className="hidden md:block">
              <NavbarSearch
                open={searchOpen}
                value={searchValue}
                inputRef={searchInputRef}
                suggestions={suggestions}
                loadingSuggestions={loadingSuggestions}
                onOpen={openSearch}
                onClose={closeSearch}
                onChange={setSearchValue}
                onSubmit={submitSearch}
                onSuggestionClick={closeSearch}
              />
            </div>
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
            {session?.user?.isAdmin && (
              <Link
                href="/admin"
                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/15"
              >
                Admin
              </Link>
            )}
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
