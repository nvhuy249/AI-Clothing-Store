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

export async function fetchFilterOptions() {
  try {
    const [categories, brands, colours, sizes] = await Promise.all([
      sql<Array<{ category_id: string; name: string }>>`
        SELECT DISTINCT category_id, name FROM categories ORDER BY name ASC
      `,
      sql<Array<{ brand_id: string; name: string }>>`
        SELECT DISTINCT brand_id, name FROM brands ORDER BY name ASC
      `,
      sql<Array<{ colour: string }>>`
        SELECT DISTINCT colour FROM products WHERE colour IS NOT NULL ORDER BY colour ASC
      `,
      sql<Array<{ size: string }>>`
        SELECT DISTINCT size FROM products WHERE size IS NOT NULL ORDER BY size ASC
      `,
    ]);

    return {
      categories: categories as Array<{ category_id: string; name: string }>,
      brands: brands as Array<{ brand_id: string; name: string }>,
      colours: colours.map(row => row.colour),
      sizes: sizes.map(row => row.size),
    };
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
    throw new Error('Failed to fetch filter options');
  }
}

export async function fetchSubCategoriesByCategory(categoryId: string) {
  try {
    // Some schemas lack category_id on sub_categories; derive via products join.
    const subCategories = await sql<Array<{ sub_category_id: string; name: string }>>`
      SELECT DISTINCT sc.sub_category_id, sc.name
      FROM sub_categories sc
      JOIN products p ON p.sub_category_id = sc.sub_category_id
      WHERE p.category_id = ${categoryId}
      ORDER BY sc.name ASC
    `;
    return subCategories as Array<{ sub_category_id: string; name: string }>;
  } catch (error) {
    console.error('Failed to fetch subcategories:', error);
    throw new Error('Failed to fetch subcategories');
  }
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

// --- Customer / Orders helpers ---

export type CustomerProfile = {
  customer_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  profile_photo_url: string | null;
  created_at: string;
};

export type OrderWithItems = {
  order_id: string;
  order_date: string;
  status: string;
  total_amount: number;
  items: Array<{
    order_item_id: string;
    product_id: string | null;
    product_name: string | null;
    quantity: number;
    unit_price: number;
  }>;
};

export async function fetchCustomerByEmail(email: string): Promise<CustomerProfile | null> {
  const rows = await sql<CustomerProfile[]>`
    SELECT customer_id, name, email, phone, address, profile_photo_url, created_at
    FROM customers
    WHERE email = ${email}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function fetchOrdersForCustomer(customerId: string): Promise<OrderWithItems[]> {
  const rows = await sql<OrderWithItems[]>`
    SELECT
      o.order_id,
      o.order_date,
      o.status,
      o.total_amount,
      COALESCE(
        json_agg(
          json_build_object(
            'order_item_id', oi.order_item_id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price
          )
        ) FILTER (WHERE oi.order_item_id IS NOT NULL),
        '[]'::json
      ) AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.order_id
    LEFT JOIN products p ON p.product_id = oi.product_id
    WHERE o.customer_id = ${customerId}
    GROUP BY o.order_id
    ORDER BY o.order_date DESC;
  `;
  return rows;
}

// --- Products (detail) ---

export type ProductDetail = {
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  sub_category_id: string | null;
  brand_id: string | null;
  colour: string | null;
  size: string | null;
  fit?: string | null;
  material?: string | null;
  photos: string[] | null;
  created_at: string;
  brand_name: string | null;
  category_name: string | null;
  subcategory_name: string | null;
  ai_photos?: string[] | null;
};

export async function fetchProductById(productId: string): Promise<ProductDetail | null> {
  if (!productId) return null;

  const rows = await sql<ProductDetail[]>`
    SELECT
      p.product_id,
      p.name,
      p.description,
      p.price,
      p.category_id,
      p.sub_category_id,
      p.brand_id,
      p.colour,
      p.size,
      p.fit,
      p.material,
      p.photos,
      p.created_at,
      b.name AS brand_name,
      c.name AS category_name,
      sc.name AS subcategory_name,
      ARRAY_REMOVE(ARRAY_AGG(agp.image_url ORDER BY agp.created_at DESC), NULL) AS ai_photos
    FROM products p
    LEFT JOIN brands b ON b.brand_id = p.brand_id
    LEFT JOIN categories c ON c.category_id = p.category_id
    LEFT JOIN sub_categories sc ON sc.sub_category_id = p.sub_category_id
    LEFT JOIN ai_generated_photos agp ON agp.product_id = p.product_id
    WHERE p.product_id::text = ${productId}
    GROUP BY p.product_id, b.name, c.name, sc.name
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export type ProductFeedback = {
  photo_id: string;
  image_url: string;
  customer_id: string | null;
  created_at: string;
};

export async function fetchProductFeedback(productId: string): Promise<ProductFeedback[]> {
  const rows = await sql<ProductFeedback[]>`
    SELECT photo_id, image_url, customer_id, created_at
    FROM uploaded_photos
    WHERE product_id = ${productId}
    ORDER BY created_at DESC
  `;
  return rows;
}
