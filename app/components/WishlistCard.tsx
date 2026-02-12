/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useState } from 'react';

type Props = {
  productId: string;
  name: string;
  price: number;
  photos: string[] | null;
};

const formatMoney = (n: number) => `$${Number(n).toFixed(2)}`;

export default function WishlistCard({ productId, name, price, photos }: Props) {
  const [removing, setRemoving] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

const getCsrf = () => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/csrfToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
};

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrf() },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not remove');
      }
      setRemoved(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not remove';
      setError(message);
    } finally {
      setRemoving(false);
    }
  };

  if (removed) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4 hover:border-[color:var(--border-soft)] hover:shadow-[var(--shadow-soft)] transition glow-none">
      <Link href={`/product/${productId}`} className="block">
        {photos && photos.length > 0 ? (
          <img
            src={photos[0]}
            alt={name}
            className="w-full h-40 object-cover rounded-[18px] mb-3 border border-[color:var(--border-subtle)]"
          />
        ) : (
          <div className="w-full h-40 rounded-[18px] bg-[color:var(--bg-base)] border border-[color:var(--border-subtle)] mb-3" />
        )}
        <h3 className="font-semibold text-[color:var(--text-primary)]">{name}</h3>
        <p className="text-[color:var(--text-muted)] text-sm">{formatMoney(price)}</p>
      </Link>
      <button
        onClick={handleRemove}
        disabled={removing}
        className="btn btn-danger mt-3 w-full py-2 text-sm rounded-[var(--radius-button)] disabled:opacity-60 glow-none"
      >
        {removing ? 'Removing...' : 'Remove'}
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

