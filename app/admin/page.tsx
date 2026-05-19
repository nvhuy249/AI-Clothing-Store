/* eslint-disable @next/next/no-img-element */
"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminRoleManager from "../components/AdminRoleManager";
import ProductCsvImport from "../components/ProductCsvImport";

type Product = {
  product_id: string;
  name: string;
  price: number;
  stock_quantity: number | null;
  photos: string[] | null;
};

type NewProduct = {
  name: string;
  description: string;
  price: string;
  stock: string;
  colour: string;
  size: string;
  fit: string;
  material: string;
};

const emptyProduct: NewProduct = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  colour: "",
  size: "",
  fit: "",
  material: "",
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<NewProduct>(emptyProduct);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
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
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

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

  const createProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrf() },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description || null,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock || 0),
          colour: newProduct.colour || null,
          size: newProduct.size || null,
          fit: newProduct.fit || null,
          material: newProduct.material || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create product");
      setNewProduct(emptyProduct);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setCreating(false);
    }
  };

  const deleteProduct = async (productId: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    setDeletingId(productId);
    setError(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-csrf-token": getCsrf() },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete product");
      setProducts((current) => current.filter((product) => product.product_id !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
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
          <Link
            href="/admin/reviews"
            className="rounded-lg border border-[color:var(--border-subtle)] px-4 py-2 text-sm text-[color:var(--text-primary)] hover:border-[color:var(--border-soft)]"
          >
            Moderate reviews
          </Link>
        </div>

        {loading && <p className="text-[color:var(--text-muted)]">Loading products...</p>}
        {error && <p className="text-rose-400">{error}</p>}

        <div className="mb-6">
          <AdminRoleManager />
        </div>

        <ProductCsvImport onComplete={load} />

        <form
          onSubmit={createProduct}
          className="mb-6 rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4"
        >
          <div className="mb-4">
            <p className="text-sm text-[color:var(--text-muted)]">Product CRUD</p>
            <h2 className="text-xl font-semibold">Create product</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <input
              required
              value={newProduct.name}
              onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
              placeholder="Name"
              className="rounded border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-3 py-2"
            />
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={newProduct.price}
              onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
              placeholder="Price"
              className="rounded border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-3 py-2"
            />
            <input
              type="number"
              min="0"
              value={newProduct.stock}
              onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))}
              placeholder="Stock"
              className="rounded border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-3 py-2"
            />
            <input
              value={newProduct.colour}
              onChange={(e) => setNewProduct((p) => ({ ...p, colour: e.target.value }))}
              placeholder="Colour"
              className="rounded border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-3 py-2"
            />
            <input
              value={newProduct.size}
              onChange={(e) => setNewProduct((p) => ({ ...p, size: e.target.value }))}
              placeholder="Size"
              className="rounded border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-3 py-2"
            />
            <input
              value={newProduct.fit}
              onChange={(e) => setNewProduct((p) => ({ ...p, fit: e.target.value }))}
              placeholder="Fit"
              className="rounded border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-3 py-2"
            />
            <input
              value={newProduct.material}
              onChange={(e) => setNewProduct((p) => ({ ...p, material: e.target.value }))}
              placeholder="Material"
              className="rounded border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-3 py-2"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded bg-[color:var(--accent-blue)] px-4 py-2 font-semibold text-[color:var(--bg-base)] hover:brightness-110 disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
          <textarea
            value={newProduct.description}
            onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description"
            rows={2}
            className="mt-3 w-full rounded border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] px-3 py-2"
          />
        </form>

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
                  <button
                    type="button"
                    onClick={() => deleteProduct(p.product_id, p.name)}
                    disabled={deletingId === p.product_id}
                    className="rounded-lg border border-rose-500/50 px-3 py-2 text-sm text-rose-300 hover:bg-rose-950/30 disabled:opacity-60"
                  >
                    {deletingId === p.product_id ? "Deleting..." : "Delete"}
                  </button>
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
