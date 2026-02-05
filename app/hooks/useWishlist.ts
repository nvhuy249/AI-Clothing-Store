"use client";

import { useEffect, useRef, useState } from "react";

const CHANNEL_NAME = "wishlist-channel";

export function useWishlist() {
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    load();
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      ch.onmessage = () => load();
      channelRef.current = ch;
      return () => ch.close();
    }
  }, []);

  const broadcast = () => channelRef.current?.postMessage({ type: "updated" });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/wishlist", { method: "GET" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { items?: Array<{ product_id?: string }> };
      const productIds: string[] = (data.items || []).map((i) => i.product_id).filter(Boolean) as string[];
      setIds(productIds);
    } catch {
      setIds([]);
    } finally {
      setLoading(false);
    }
  }

  const add = async (productId: string) => {
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    await load();
    broadcast();
  };

  const remove = async (productId: string) => {
    await fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    await load();
    broadcast();
  };

  const isSaved = (productId: string) => ids.includes(productId);
  const count = ids.length;

  return { ids, count, isSaved, add, remove, loading };
}

