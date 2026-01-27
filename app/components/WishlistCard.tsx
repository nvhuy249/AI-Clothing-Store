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

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not remove');
      }
      setRemoved(true);
    } catch (err: any) {
      setError(err.message || 'Could not remove');
    } finally {
      setRemoving(false);
    }
  };

  if (removed) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:shadow-lg transition-shadow">
      <Link href={`/product/${productId}`} className="block">
        {photos && photos.length > 0 ? (
          <img
            src={photos[0]}
            alt={name}
            className="w-full h-40 object-cover rounded-lg mb-3"
          />
        ) : (
          <div className="w-full h-40 rounded-lg bg-slate-800 mb-3" />
        )}
        <h3 className="font-semibold text-slate-100">{name}</h3>
        <p className="text-slate-300 text-sm">{formatMoney(price)}</p>
      </Link>
      <button
        onClick={handleRemove}
        disabled={removing}
        className="mt-3 w-full py-2 text-sm rounded-lg border border-red-600 text-red-300 hover:bg-red-900/30 disabled:opacity-60"
      >
        {removing ? 'Removing…' : 'Remove'}
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
