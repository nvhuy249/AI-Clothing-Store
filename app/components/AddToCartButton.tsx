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
      className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold"
      onClick={() => addItem({ productId, name, price, photo })}
    >
      Add to Cart
    </button>
  );
}
