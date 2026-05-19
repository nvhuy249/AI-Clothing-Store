"use client";

import { useSession } from "next-auth/react";
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

function storageKey(ownerKey?: string | null) {
  return ownerKey ? `${STORAGE_KEY}:${ownerKey}` : `${STORAGE_KEY}:anonymous`;
}

function load(ownerKey?: string | null): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(ownerKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return parsed.map((item) => ({
      ...item,
      price: Number(item.price) || 0,
      qty: Number(item.qty) || 1,
    }));
  } catch {
    return [];
  }
}

function save(items: CartItem[], ownerKey?: string | null) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(ownerKey), JSON.stringify(items));
}

export function useCart() {
  const { data: session, status } = useSession();
  const ownerKey = status === "authenticated" ? session?.user?.id || session?.user?.email || "user" : "anonymous";
  const [items, setItems] = useState<CartItem[]>([]);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setItems(load(ownerKey)));

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (!event.data?.ownerKey || event.data.ownerKey === ownerKey) {
          setItems(load(ownerKey));
        }
      };
      channelRef.current = channel;
      return () => {
        cancelAnimationFrame(frame);
        channel.close();
      };
    }

    return () => cancelAnimationFrame(frame);
  }, [ownerKey]);

  const persist = (next: CartItem[]) => {
    setItems(next);
    save(next, ownerKey);
    channelRef.current?.postMessage({ type: "updated", ownerKey });
  };

  const addItem = (item: Omit<CartItem, "qty">) => {
    persist(addToList(load(ownerKey), item));
  };

  const removeItem = (productId: string) => {
    persist(load(ownerKey).filter((item) => item.productId !== productId));
  };

  const updateQty = (productId: string, delta: number) => {
    const next = load(ownerKey)
      .map((item) =>
        item.productId === productId ? { ...item, qty: Math.max(1, item.qty + delta) } : item,
      )
      .filter((item) => item.qty > 0);
    persist(next);
  };

  const clear = () => persist([]);

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = items.reduce((sum, item) => sum + item.qty, 0);

  return { items, addItem, removeItem, updateQty, clear, total, count };
}

function addToList(list: CartItem[], item: Omit<CartItem, "qty">): CartItem[] {
  const existing = list.find((cartItem) => cartItem.productId === item.productId);
  if (existing) {
    return list.map((cartItem) =>
      cartItem.productId === item.productId ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem,
    );
  }
  return [...list, { ...item, qty: 1 }];
}
