"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "../hooks/useCart";

type Props = {
  productId: string;
  name: string;
  price: number;
  photo?: string;
};

export default function AddToCartButton({ productId, name, price, photo }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({ productId, name, price, photo });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="space-y-2">
      <button
        className="btn btn-primary w-full py-3 font-semibold glow-none inline-flex items-center justify-center gap-2"
        onClick={handleAdd}
      >
        {added ? <Check size={18} /> : <ShoppingBag size={18} />}
        {added ? "Added" : "Add to Cart"}
      </button>
      {added && (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-center text-xs text-emerald-300">
          Added to cart
        </p>
      )}
    </div>
  );
}
