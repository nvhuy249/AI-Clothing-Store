"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  product_id: string;
  name: string;
  price: number;
  stock_quantity: number | null;
  photos: string[] | null;
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        headers: { "x-csrf-token": getCsrf() },
      });
      if (res.status === 403) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      setProducts(data.products || []);
      setError(null);
    } catch (e) {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateProduct = async (productId: string, price: number, stock: number) => {
    setSavingId(productId);
    await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-csrf-token": getCsrf() },
      body: JSON.stringify({ productId, price, stock }),
    });
    setSavingId(null);
    load();
  };

  const uploadPhoto = async (productId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("productId", productId);
    setUploadingId(productId);
    await fetch("/api/admin/products", { method: "POST", headers: { "x-csrf-token": getCsrf() }, body: fd });
    setUploadingId(null);
    load();
  };

  return (
    <div className="pt-18 min-h-screen bg-[color:var(--bg-base)] text-[color:var(--text-primary)] px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-[color:var(--text-muted)]">Admin</p>
            <h1 className="text-3xl font-semibold">Inventory</h1>
          </div>
        </div>

        {loading && <p className="text-[color:var(--text-muted)]">Loading products...</p>}
        {error && <p className="text-rose-400">{error}</p>}

        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.product_id} className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4">
              <div className="flex flex-wrap gap-4 justify-between">
                <div>
                  <p className="text-sm text-[color:var(--text-muted)]">ID {p.product_id.slice(0, 8)}</p>
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                </div>
                <div className="flex gap-3 items-center">
                  <label className="text-sm text-[color:var(--text-muted)]">
                    Price
                    <input
                      type="number"
                      defaultValue={Number(p.price)}
                      step="0.01"
                      className="ml-2 w-28 rounded border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-2 py-1"
                      aria-label={`Price for ${p.name}`}
                      onBlur={(e) => updateProduct(p.product_id, Number(e.target.value), Number(p.stock_quantity ?? 0))}
                    />
                  </label>
                  <label className="text-sm text-[color:var(--text-muted)]">
                    Stock
                    <input
                      type="number"
                      defaultValue={Number(p.stock_quantity ?? 0)}
                      className="ml-2 w-20 rounded border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-2 py-1"
                      aria-label={`Stock for ${p.name}`}
                      onBlur={(e) => updateProduct(p.product_id, Number(p.price), Number(e.target.value))}
                    />
                  </label>
                  <span className="text-xs text-[color:var(--text-muted)]">
                    {savingId === p.product_id ? "Saving..." : ""}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 items-center">
                {p.photos?.slice(0, 3).map((url, idx) => (
                  <img key={idx} src={url} alt={`${p.name} photo`} className="w-16 h-16 object-cover rounded border border-[color:var(--border-subtle)]" />
                ))}
                <label className="text-sm text-[color:var(--accent-blue)] cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadPhoto(p.product_id, file);
                    }}
                  />
                  {uploadingId === p.product_id ? "Uploading..." : "Upload photo"}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getCsrf() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/csrfToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
