"use client";

import { useEffect, useState } from 'react';
import { useWishlist } from '../hooks/useWishlist';

interface Props {
  productId: string;
  authed: boolean;
}

export default function WishlistButton({ productId, authed }: Props) {
  const { isSaved, add, remove, loading } = useWishlist();
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isSaved(productId)) setStatus('saved');
    else setStatus('idle');
  }, [productId, isSaved]);

  const handleToggle = async () => {
    if (!authed) {
      setMessage('Sign in to save items');
      setStatus('error');
      return;
    }
    setStatus('saving');
    setMessage(null);
    try {
      if (isSaved(productId)) {
        await remove(productId);
        setStatus('idle');
        setMessage('Removed from wishlist');
      } else {
        await add(productId);
        setStatus('saved');
        setMessage('Added to wishlist');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Could not update wishlist');
    }
  };

  const label =
    status === 'saving'
      ? 'Saving…'
      : isSaved(productId)
      ? 'Saved to Wishlist'
      : 'Save to Wishlist';

  const disabled = loading || status === 'saving';

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full py-3 rounded-lg border ${
          isSaved(productId)
            ? 'border-emerald-500 text-emerald-200 bg-emerald-900/30'
            : 'border-slate-700 text-slate-200 hover:border-emerald-400'
        } disabled:opacity-60`}
        title={authed ? 'Toggle wishlist' : 'Sign in to save'}
      >
        {label}
      </button>
      {message && (
        <p
          className={`text-sm ${
            status === 'error' ? 'text-red-400' : 'text-emerald-300'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
