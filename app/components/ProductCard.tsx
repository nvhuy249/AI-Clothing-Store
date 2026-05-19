/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useRef, useState } from "react";

export type ProductListItem = {
  product_id?: string;
  name: string;
  brand_name?: string | null;
  category_name?: string | null;
  subcategory_name?: string | null;
  colour?: string | null;
  size?: string | null;
  price: number;
  photos?: string[];
  ai_photo?: string | null;
};

type ProductCardProps = {
  product: ProductListItem;
  href: string;
  hoverDelayMs?: number;
  nameMatchIndices?: ReadonlyArray<readonly [number, number]>;
};

export default function ProductCard({ product, href, hoverDelayMs = 500, nameMatchIndices = [] }: ProductCardProps) {
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

  const meta = [product.brand_name, product.category_name, product.colour, product.size].filter(Boolean).join(" / ");

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
          {renderHighlightedText(product.name, nameMatchIndices)}
        </h2>
        <p className="text-base font-semibold text-[color:var(--text-primary)]">${priceLabel}</p>
      </div>
      {meta && <p className="text-xs text-[color:var(--text-muted)] leading-tight">{meta}</p>}
    </Link>
  );
}

function renderHighlightedText(text: string, ranges: ReadonlyArray<readonly [number, number]>) {
  if (ranges.length === 0) return text;

  const merged = [...ranges]
    .sort((a, b) => a[0] - b[0])
    .reduce<Array<[number, number]>>((acc, range) => {
      const [start, end] = range;
      const last = acc[acc.length - 1];
      if (last && start <= last[1] + 1) {
        last[1] = Math.max(last[1], end);
      } else {
        acc.push([start, end]);
      }
      return acc;
    }, []);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={`${start}-${end}`} className="rounded bg-amber-400/25 px-0.5 text-[color:var(--text-primary)]">
        {text.slice(start, end + 1)}
      </mark>,
    );
    cursor = end + 1;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}


