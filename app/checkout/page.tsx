"use client";

import { useEffect, useState } from "react";
import { useCart } from "../hooks/useCart";
import { useRouter } from "next/navigation";

type FormState = {
  name: string;
  address: string;
  phone: string;
  note: string;
};

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [form, setForm] = useState<FormState>({ name: "", address: "", phone: "", note: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Prefill from customer profile
    (async () => {
      try {
       const res = await fetch("/api/customer/me");
       if (!res.ok) return;
       const data = await res.json();
       setForm((f) => ({
         ...f,
          name: data.name || f.name,
          address: data.address || f.address,
          phone: data.phone || f.phone,
        }));
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const placeOrder = async () => {
    if (items.length === 0) return;
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/orders/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
         items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          shippingName: form.name,
          shippingAddress: form.address,
         phone: form.phone,
         note: form.note,
       }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Order failed");
      }
      clear();
      setStatus("success");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Order failed";
      setStatus("error");
      setError(message);
    }
  };

  if (status === "success") {
    return (
      <div className="pt-18 min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white px-4 py-12 items-center flex">
        <div className="max-w-3xl mx-auto space-y-4 text-center">
          <h1 className="text-3xl font-semibold text-emerald-300">Order placed!</h1>
          <p className="text-[color:var(--text-muted)]">Thank you. A confirmation email would be sent in a real flow.</p>
          <button
            onClick={() => router.push("/shop")}
            className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-500 font-semibold"
          >
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-18 min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white px-4 py-12">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <div className="space-y-3">
            <label className="block text-sm text-[color:var(--text-muted)]">
              Full name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="mt-1 w-full rounded bg-slate-800 border border-slate-700 p-2 text-white"
                placeholder="Your name"
              />
            </label>
            <label className="block text-sm text-[color:var(--text-muted)]">
              Shipping address
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                className="mt-1 w-full rounded bg-slate-800 border border-slate-700 p-2 text-white"
                rows={3}
                placeholder="Street, city, country"
              />
            </label>
            <label className="block text-sm text-[color:var(--text-muted)]">
              Phone
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="mt-1 w-full rounded bg-slate-800 border border-slate-700 p-2 text-white"
                placeholder="Contact number"
              />
            </label>
            <label className="block text-sm text-[color:var(--text-muted)]">
              Note (optional)
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                className="mt-1 w-full rounded bg-slate-800 border border-slate-700 p-2 text-white"
                rows={2}
                placeholder="Anything else"
              />
            </label>
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            onClick={placeOrder}
            disabled={status === "submitting" || items.length === 0}
            className="mt-2 px-6 py-3 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60 font-semibold"
          >
            {status === "submitting" ? "Placing order..." : "Place order"}
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h2 className="text-lg font-semibold">Order summary</h2>
          {items.length === 0 ? (
            <p className="text-[color:var(--text-muted)] text-sm">No items.</p>
          ) : (
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.productId} className="flex justify-between text-sm text-[color:var(--text-primary)]">
                  <span>{i.name} Ã— {i.qty}</span>
                  <span>${(Number(i.price) * i.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-slate-800 pt-2 flex justify-between text-white font-semibold">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


