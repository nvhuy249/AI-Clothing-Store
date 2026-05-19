import FilterSidebar from "../components/filter-sidebar";
import { ProductListItem } from "../components/ProductCard";
import ShopProductGrid from "../components/ShopProductGrid";
import { fetchFilterOptions, fetchProductsForClientSearch, fetchSubCategoriesByCategory } from "../lib/data";

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const query = params.query || null;
  const requestedCategoryName = params.categoryName || null;
  const subCategoryId = params.subcategory || null;
  const brandId = params.brand || null;
  const colour = params.colour || null;
  const size = params.size || null;
  const minPrice = params.minPrice ? Number(params.minPrice) : null;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : null;
  const sort = params.sort || null;
  const page = params.page ? Number(params.page) : 1;

  const filterOptions = await fetchFilterOptions();
  const categoryId =
    params.category ||
    (requestedCategoryName
      ? filterOptions.categories.find(
          (category) => category.name.toLowerCase() === requestedCategoryName.toLowerCase(),
        )?.category_id || null
      : null);
  const subCategories = categoryId ? await fetchSubCategoriesByCategory(categoryId) : [];

  const products = await fetchProductsForClientSearch(
    categoryId,
    subCategoryId,
    brandId,
    colour,
    size,
    minPrice,
    maxPrice,
    sort,
  );

  const items: ProductListItem[] = products.map((prod) => ({
    product_id: prod.product_id,
    name: prod.name,
    brand_name: prod.brand_name,
    category_name: prod.category_name,
    subcategory_name: prod.subcategory_name,
    colour: prod.colour,
    size: prod.size,
    price: prod.price,
    photos: prod.photos ?? undefined,
    ai_photo: prod.ai_photo,
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-28 md:flex-row md:gap-8">
      <FilterSidebar filterOptions={filterOptions} subCategories={subCategories} />
      <ShopProductGrid products={items} query={query ?? ""} currentPage={page} params={params} />
    </div>
  );
}
