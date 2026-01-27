'use client';

import { useState } from 'react';

type Props = {
  photos: string[];
  alt: string;
};

export default function ProductGallery({ photos, alt }: Props) {
  const [active, setActive] = useState(0);
  const main = photos[active] || '';

  return (
    <div className="space-y-4">
      <div className="w-full h-[520px] overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center justify-center">
        {main ? (
          <img src={main} alt={alt} className="h-full w-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">No image</div>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto">
          {photos.map((p, idx) => (
            <button
              key={p + idx}
              onClick={() => setActive(idx)}
              className={`h-24 w-24 flex-shrink-0 rounded-lg border ${
                idx === active ? 'border-emerald-500' : 'border-slate-800'
              } bg-slate-900/40 overflow-hidden`}
            >
              <img src={p} alt={`${alt} ${idx + 1}`} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
