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

  return (
    <Link
      href={href}
      className={`border rounded-lg p-3 hover:shadow-lg transition-shadow ${product.product_id ? "" : "pointer-events-none opacity-60"}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {imgSrc ? (
        <img src={imgSrc} alt={product.name} className="w-full h-100 object-cover rounded-md" />
      ) : (
        <div className="w-full h-48 bg-gray-200 rounded-md" />
      )}
      <h2 className="font-semibold mt-2">{product.name}</h2>
      <p>${product.price}</p>
    </Link>
  );
}
