/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type ProductListItem = {
  product_id?: string;
  name: string;
  price: number;
  photos?: string[];
  ai_photo?: string | null;
};

type ProductCardProps = {
  product: ProductListItem;
  href: string;
  hoverDelayMs?: number;
};

export default function ProductCard({ product, href, hoverDelayMs = 500 }: ProductCardProps) {
  const [showAi, setShowAi] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cover = product.photos?.[0] || "";
  const ai = product.ai_photo || "";
  const canSwap = Boolean(ai);

  const onEnter = () => {
    if (!canSwap) return;
    timerRef.current = setTimeout(() => setShowAi(true), hoverDelayMs);
  };

  const onLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowAi(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const imgSrc = showAi && ai ? ai : cover;
  const price = Number(product.price ?? 0);
  const priceLabel = Number.isFinite(price) ? price.toFixed(2) : "--";

  return (
    <Link
      href={href}
      className={`group relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-card)] border border-[rgba(255,255,255,0.1)] bg-[color:var(--bg-panel)] p-4 md:p-5 transition-all duration-200 hover:border-[rgba(255,255,255,0.2)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] glow-none ${product.product_id ? "" : "pointer-events-none opacity-60"}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="overflow-hidden rounded-[18px] border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)]">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full aspect-[3/4] object-cover"
          />
        ) : (
          <div className="w-full aspect-[3/4]" />
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm md:text-base font-medium text-[color:var(--text-primary)] leading-tight">
          {product.name}
        </h2>
        <p className="text-base font-semibold text-[color:var(--text-primary)]">${priceLabel}</p>
      </div>
    </Link>
  );
}


