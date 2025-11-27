import postgres, { Sql } from 'postgres';
import {
  ProductFilters,
  Brand,
  Category,
  SubCategory,
  ProductWithRelations,
} from './definitions';

// Postgres client
const sql: Sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Pagination settings
const ITEMS_PER_PAGE = 12;

export const formatCurrency = (amount: number) => {
  return (amount / 100).toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
  });
};

export async function fetchFilteredProducts(
  query: string | null,
  categoryId: string | null,
  subCategoryId: string | null,
  brandId: string | null,
  colour: string | null,
  size: string | null,
  minPrice: number | null,
  maxPrice: number | null,
  sort: string | null, // "price_asc", "price_desc", "newest", etc
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Determine SORT SQL
  let sortSql = sql`product.created_at DESC`;
  if (sort === "price_asc") sortSql = sql`product.price ASC`;
  if (sort === "price_desc") sortSql = sql`product.price DESC`;
  if (sort === "newest") sortSql = sql`product.created_at DESC`;
  if (sort === "oldest") sortSql = sql`product.created_at ASC`;

  try {
    const products = await sql`
      SELECT
        product.product_id,
        product.name,
        product.price,
        product.category_id,
        product.sub_category_id,
        product.brand_id,
        product.colour,
        product.size,
        product.created_at,
        product.photos
      FROM products AS product
      WHERE
        -- keyword search
        (${query ? sql`product.name ILIKE ${'%' + query + '%'}` : sql`TRUE`})

        AND (${query ? sql`product.colour ILIKE ${'%' + query + '%'}` : sql`TRUE`})
        
        -- category filter
        AND (${categoryId ? sql`product.category_id = ${categoryId}` : sql`TRUE`})
        
        -- subcategory filter
        AND (${subCategoryId ? sql`product.sub_category_id = ${subCategoryId}` : sql`TRUE`})
        
        -- brand filter
        AND (${brandId ? sql`product.brand_id = ${brandId}` : sql`TRUE`})
        
        -- colour filter
        AND (${colour ? sql`product.colour ILIKE ${'%' + colour + '%'}` : sql`TRUE`})
        
        -- size filter
        AND (${size ? sql`product.size ILIKE ${'%' + size + '%'}` : sql`TRUE`})
        
        -- price range
        AND (${minPrice !== null ? sql`product.price >= ${minPrice}` : sql`TRUE`})
        AND (${maxPrice !== null ? sql`product.price <= ${maxPrice}` : sql`TRUE`})
        
      ORDER BY ${sortSql}
      LIMIT ${ITEMS_PER_PAGE}
      OFFSET ${offset}
    `;

    return products;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch products.");
  }
}

export async function fetchFilteredProductsPage(
  query: string | null,
  categoryId: string | null,
  subCategoryId: string | null,
  brandId: string | null,
  colour: string | null,
  size: string | null,
  minPrice: number | null,
  maxPrice: number | null,
  sort: string | null,
  page: number
) {
  const offset = (page - 1) * ITEMS_PER_PAGE;

  // Determine sort clause safely using sql.unsafe for dynamic ORDER BY
  let sortClause;
  if (sort === "price_asc") sortClause = sql`product.price ASC`;
  else if (sort === "price_desc") sortClause = sql`product.price DESC`;
  else if (sort === "oldest") sortClause = sql`product.created_at ASC`;
  else sortClause = sql`product.created_at DESC`; // newest (default)

  // COUNT query
  const countRows = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM products AS product
    WHERE
      (${query ? sql`product.name ILIKE ${"%" + query + "%"}` : sql`TRUE`})
      AND (${categoryId ? sql`product.category_id = ${categoryId}` : sql`TRUE`})
      AND (${subCategoryId ? sql`product.sub_category_id = ${subCategoryId}` : sql`TRUE`})
      AND (${brandId ? sql`product.brand_id = ${brandId}` : sql`TRUE`})
      AND (${colour ? sql`product.colour ILIKE ${"%" + colour + "%"}` : sql`TRUE`})
      AND (${size ? sql`product.size ILIKE ${"%" + size + "%"}` : sql`TRUE`})
      AND (${minPrice !== null ? sql`product.price >= ${minPrice}` : sql`TRUE`})
      AND (${maxPrice !== null ? sql`product.price <= ${maxPrice}` : sql`TRUE`})
  `;

  const totalPages = Math.ceil(countRows[0].count / ITEMS_PER_PAGE);

  // PRODUCT query
  const products = await sql`
    SELECT
      product.product_id,
      product.name,
      product.price,
      product.category_id,
      product.sub_category_id,
      product.brand_id,
      product.colour,
      product.size,
      product.created_at,
      product.photos
    FROM products AS product
    WHERE
      (${query ? sql`product.name ILIKE ${"%" + query + "%"}` : sql`TRUE`})
      AND (${categoryId ? sql`product.category_id = ${categoryId}` : sql`TRUE`})
      AND (${subCategoryId ? sql`product.sub_category_id = ${subCategoryId}` : sql`TRUE`})
      AND (${brandId ? sql`product.brand_id = ${brandId}` : sql`TRUE`})
      AND (${colour ? sql`product.colour ILIKE ${"%" + colour + "%"}` : sql`TRUE`})
      AND (${size ? sql`product.size ILIKE ${"%" + size + "%"}` : sql`TRUE`})
      AND (${minPrice !== null ? sql`product.price >= ${minPrice}` : sql`TRUE`})
      AND (${maxPrice !== null ? sql`product.price <= ${maxPrice}` : sql`TRUE`})
    ORDER BY ${sortClause}
    LIMIT ${ITEMS_PER_PAGE}
    OFFSET ${offset}
  `;

  return { products, totalPages };
}

// Fetch all brands (with filtering)
export async function fetchBrands(query: string) {
  console.log('Fetching brands...');

  try {
    const brands = await sql<Brand[]>`
      SELECT id, name
      FROM brands
      WHERE name ILIKE ${`%${query}%`}
      ORDER BY name ASC
    `;

    console.log('Brands fetched:', brands.length);
    return brands;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch brands.');
  }
}

// Fetch all categories (with filtering)
export async function fetchCategories(query: string) {
  console.log('Fetching categories...');

  try {
    const categories = await sql<Category[]>`
      SELECT id, name
      FROM categories
      WHERE name ILIKE ${`%${query}%`}
      ORDER BY name ASC
    `;

    console.log('Categories fetched:', categories.length);
    return categories;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch categories.');
  }
}

// Fetch all subcategories (with filtering)
export async function fetchSubcategories(query: string) {
  console.log('Fetching subcategories...');

  try {
    const subcategories = await sql<SubCategory[]>`
      SELECT id, name, category_id
      FROM subcategories
      WHERE name ILIKE ${`%${query}%`}
      ORDER BY name ASC
    `;

    console.log('Subcategories fetched:', subcategories.length);
    return subcategories;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch subcategories.');
  }
}
