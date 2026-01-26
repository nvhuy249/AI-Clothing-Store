import Link from "next/link";
import { Suspense } from 'react';
import FilterSidebar from '../components/filter-sidebar';
import { fetchFilteredProductsPage, fetchFilterOptions, fetchSubCategoriesByCategory, fetchBrands, fetchCategories, fetchSubcategories } from "../lib/data";

function toUrlParams(obj: Record<string, any>) {
  const p = new URLSearchParams();
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      p.set(key, val);
    }
  }
  return p;
}

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const query = params.query || null;
  const categoryId = params.category || null;
  const subCategoryId = params.subcategory || null;
  const brandId = params.brand || null;
  const colour = params.colour || null;
  const size = params.size || null;
  const minPrice = params.minPrice ? Number(params.minPrice) : null;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : null;
  const sort = params.sort || null;
  const page = params.page ? Number(params.page) : 1;

  // Fetch filter options and subcategories
  const filterOptions = await fetchFilterOptions();
  const subCategories = categoryId ? await fetchSubCategoriesByCategory(categoryId) : [];

  const { products, totalPages } = await fetchFilteredProductsPage(
    query,
    categoryId,
    subCategoryId,
    brandId,
    colour,
    size,
    minPrice,
    maxPrice,
    sort,
    page
  );

  return (
    <div className="p-4 md:flex md:gap-6 pt-20">
      {/* Filters Sidebar */}
      <FilterSidebar 
            filterOptions={filterOptions} 
            subCategories={subCategories}
          />

      {/* Products Grid */}
      <div className="w-full md:w-3/4 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((prod, index) => (
          <div key={prod.product_id || index} className="border rounded-lg p-3">
            {Array.isArray(prod.photos) && prod.photos.length > 0 ? (
              <img
                src={prod.photos[0]}
                alt={prod.name}
                className="w-full h-100 object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded-md" />
            )}

            <h2 className="font-semibold mt-2">{prod.name}</h2>
            <p>${prod.price}</p>
          </div>
        ))}

        {/* Pagination */}
        <div className="col-span-full flex gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            const newParams = toUrlParams(params);
            newParams.set("page", pageNum.toString());

            return (
              <a
                key={pageNum}
                href={`/shop?${newParams.toString()}`}
                className={`px-3 py-1 border rounded ${
                  pageNum === page ? "bg-black text-white" : ""
                }`}
              >
                {pageNum}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
