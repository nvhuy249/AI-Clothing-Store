"use client";

import { useEffect, useRef, useState } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  photo?: string;
  qty: number;
};

const STORAGE_KEY = "cart:v1";
const CHANNEL_NAME = "cart-channel";

function load(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return parsed.map((i) => ({
      ...i,
      price: Number(i.price) || 0,
      qty: Number(i.qty) || 1,
    }));
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => load());
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      ch.onmessage = () => setItems(load());
      channelRef.current = ch;
      return () => ch.close();
    }
  }, []);

  const persist = (next: CartItem[]) => {
    setItems(next);
    save(next);
    channelRef.current?.postMessage({ type: "updated" });
  };

  const addItem = (item: Omit<CartItem, "qty">) => {
    persist(addToList(load(), item));
  };

  const removeItem = (productId: string) => {
    persist(load().filter((i) => i.productId !== productId));
  };

  const updateQty = (productId: string, delta: number) => {
    const next = load()
      .map((i) =>
        i.productId === productId ? { ...i, qty: Math.max(1, i.qty + delta) } : i,
      )
      .filter((i) => i.qty > 0);
    persist(next);
  };

  const clear = () => persist([]);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return { items, addItem, removeItem, updateQty, clear, total, count };
}

function addToList(list: CartItem[], item: Omit<CartItem, "qty">): CartItem[] {
  const existing = list.find((i) => i.productId === item.productId);
  if (existing) {
    return list.map((i) =>
      i.productId === item.productId ? { ...i, qty: i.qty + 1 } : i,
    );
  }
  return [...list, { ...item, qty: 1 }];
}

