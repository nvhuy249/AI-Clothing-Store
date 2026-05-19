"use client";

import Fuse from "fuse.js";
import { useMemo } from "react";
import Link from "next/link";
import ProductCard, { ProductListItem } from "./ProductCard";

const PAGE_SIZE = 12;

type SearchMatch = {
  key?: string;
  indices: ReadonlyArray<readonly [number, number]>;
};

type Props = {
  products: ProductListItem[];
  query: string;
  currentPage: number;
  params: Record<string, string | undefined>;
};

function toUrlParams(obj: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value) params.set(key, value);
  }
  params.set("page", page.toString());
  return params;
}

export default function ShopProductGrid({ products, query, currentPage, params }: Props) {
  const searchResults = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return products.map((product) => ({ item: product, matches: [] as SearchMatch[] }));
    }

    const fuse = new Fuse(products, {
      keys: [
        { name: "name", weight: 0.45 },
        { name: "brand_name", weight: 0.2 },
        { name: "category_name", weight: 0.15 },
        { name: "subcategory_name", weight: 0.1 },
        { name: "colour", weight: 0.06 },
        { name: "size", weight: 0.04 },
      ],
      includeMatches: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
      threshold: 0.34,
    });

    return fuse.search(trimmed).map((result) => ({
      item: result.item,
      matches: [...(result.matches ?? [])] as SearchMatch[],
    }));
  }, [products, query]);

  const totalPages = Math.max(1, Math.ceil(searchResults.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const visible = searchResults.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="w-full md:w-3/4 space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[color:var(--text-muted)]">
            {query.trim()
              ? `${searchResults.length} fuzzy ${searchResults.length === 1 ? "match" : "matches"} for "${query.trim()}"`
              : `${products.length} ${products.length === 1 ? "product" : "products"}`}
          </p>
          {query.trim() && (
            <p className="text-xs text-[color:var(--text-muted)]">
              Typo-tolerant search checks names, brands, categories, colours, and sizes.
            </p>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-6 text-sm text-[color:var(--text-muted)]">
          No products match the current search and filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {visible.map(({ item, matches }, index) => {
            const pid = item.product_id;
            const nameMatch = matches.find((match) => match.key === "name");
            return (
              <ProductCard
                key={pid || `${item.name}-${index}`}
                product={item}
                href={pid ? `/product/${pid}` : "#"}
                nameMatchIndices={nameMatch?.indices ?? []}
              />
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            const urlParams = toUrlParams(params, pageNum);
            return (
              <Link
                key={pageNum}
                href={`/shop?${urlParams.toString()}`}
                aria-current={pageNum === safePage ? "page" : undefined}
                className={`rounded-[12px] border border-[color:var(--border-subtle)] px-3 py-2 text-[color:var(--text-primary)] hover:border-[color:var(--border-soft)] hover:shadow-[var(--shadow-soft)] glow-none ${
                  pageNum === safePage ? "border-transparent bg-[color:var(--accent-blue)] text-[color:var(--bg-base)]" : ""
                }`}
              >
                {pageNum}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
