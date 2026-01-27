'use client';

import { useState } from 'react';

interface Props {
  productId: string;
  authed: boolean;
}

export default function WishlistButton({ productId, authed }: Props) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!authed) {
      setMessage('Sign in to save items');
      setStatus('error');
      return;
    }
    setStatus('saving');
    setMessage(null);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save');
      }
      setStatus('saved');
      setMessage('Added to wishlist');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Could not save');
    }
  };

  const label =
    status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved to Wishlist' : 'Save to Wishlist';

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSave}
        disabled={status === 'saving' || status === 'saved'}
        className={`w-full py-3 rounded-lg border ${
          status === 'saved'
            ? 'border-emerald-500 text-emerald-200 bg-emerald-900/30'
            : 'border-slate-700 text-slate-200 hover:border-emerald-400'
        } disabled:opacity-60`}
        title={authed ? 'Save to wishlist' : 'Sign in to save'}
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
