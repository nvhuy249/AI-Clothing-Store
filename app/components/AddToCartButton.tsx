"use client";

import { useCart } from "../hooks/useCart";

type Props = {
  productId: string;
  name: string;
  price: number;
  photo?: string;
};

export default function AddToCartButton({ productId, name, price, photo }: Props) {
  const { addItem } = useCart();

  return (
    <button
      className="btn btn-primary w-full py-3 font-semibold glow-none"
      onClick={() => addItem({ productId, name, price, photo })}
    >
      Add to Cart
    </button>
  );
}

