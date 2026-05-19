import { getDb } from "./db";
import { ensureUsersTableName } from "./users";

export type ReviewStatus = "published" | "hidden";

export type ProductReview = {
  review_id: string;
  product_id: string;
  customer_id: string | null;
  customer_name: string;
  rating: number;
  title: string | null;
  body: string;
  fit_feedback: string | null;
  is_flagged: boolean;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
};

export type ReviewSummary = {
  averageRating: number | null;
  reviewCount: number;
  ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
};

let reviewsTableReady: Promise<void> | null = null;

export async function ensureReviewsTable() {
  reviewsTableReady ??= ensureReviewsTableInner();
  return reviewsTableReady;
}

async function ensureReviewsTableInner() {
  await ensureUsersTableName();
  const extensionRows = await getDb()<Array<{ exists: boolean }>>`
    SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') AS exists
  `;
  if (!extensionRows[0]?.exists) {
    await getDb()`CREATE EXTENSION "uuid-ossp"`;
  }

  const tableRows = await getDb()<Array<{ exists: boolean }>>`
    SELECT to_regclass('public.product_reviews') IS NOT NULL AS exists
  `;

  if (!tableRows[0]?.exists) {
    await getDb()`
      CREATE TABLE product_reviews (
        review_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
        customer_id UUID REFERENCES users(customer_id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        title VARCHAR(120),
        body TEXT NOT NULL,
        fit_feedback VARCHAR(80),
        is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
        status VARCHAR(20) NOT NULL DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, customer_id)
      )
    `;
    return;
  }

  const existingColumns = await getDb()<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_reviews'
  `;
  const columnNames = new Set(existingColumns.map((column) => column.column_name));

  if (!columnNames.has("fit_feedback")) {
    await getDb()`ALTER TABLE product_reviews ADD COLUMN fit_feedback VARCHAR(80)`;
  }
  if (!columnNames.has("is_flagged")) {
    await getDb()`ALTER TABLE product_reviews ADD COLUMN is_flagged BOOLEAN NOT NULL DEFAULT FALSE`;
  }
  if (!columnNames.has("status")) {
    await getDb()`ALTER TABLE product_reviews ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'published'`;
  }
  if (!columnNames.has("updated_at")) {
    await getDb()`ALTER TABLE product_reviews ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
  }
}

export async function fetchReviewSummary(productId: string): Promise<ReviewSummary> {
  await ensureReviewsTable();

  const [summaryRows, countRows] = await Promise.all([
    getDb()<Array<{ average_rating: number | null; review_count: number }>>`
      SELECT ROUND(AVG(rating)::numeric, 1)::float AS average_rating, COUNT(*)::int AS review_count
      FROM product_reviews
      WHERE product_id = ${productId} AND status = 'published' AND is_flagged = FALSE
    `,
    getDb()<Array<{ rating: number; count: number }>>`
      SELECT rating, COUNT(*)::int AS count
      FROM product_reviews
      WHERE product_id = ${productId} AND status = 'published' AND is_flagged = FALSE
      GROUP BY rating
    `,
  ]);

  const ratingCounts: ReviewSummary["ratingCounts"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of countRows) {
    if (row.rating >= 1 && row.rating <= 5) {
      ratingCounts[row.rating as 1 | 2 | 3 | 4 | 5] = row.count;
    }
  }

  const summary = summaryRows[0];
  return {
    averageRating: summary?.average_rating ?? null,
    reviewCount: summary?.review_count ?? 0,
    ratingCounts,
  };
}

export async function fetchProductReviews(productId: string): Promise<ProductReview[]> {
  await ensureReviewsTable();

  return getDb()<ProductReview[]>`
    SELECT
      r.review_id,
      r.product_id,
      r.customer_id,
      COALESCE(c.name, 'Verified customer') AS customer_name,
      r.rating,
      r.title,
      r.body,
      r.fit_feedback,
      r.is_flagged,
      r.status,
      r.created_at,
      r.updated_at
    FROM product_reviews r
    LEFT JOIN users c ON c.customer_id = r.customer_id
    WHERE r.product_id = ${productId} AND r.status = 'published' AND r.is_flagged = FALSE
    ORDER BY r.created_at DESC
  `;
}

export async function fetchCustomerReview(productId: string, customerId: string): Promise<ProductReview | null> {
  await ensureReviewsTable();

  const rows = await getDb()<ProductReview[]>`
    SELECT
      r.review_id,
      r.product_id,
      r.customer_id,
      COALESCE(c.name, 'Verified customer') AS customer_name,
      r.rating,
      r.title,
      r.body,
      r.fit_feedback,
      r.is_flagged,
      r.status,
      r.created_at,
      r.updated_at
    FROM product_reviews r
    LEFT JOIN users c ON c.customer_id = r.customer_id
    WHERE r.product_id = ${productId} AND r.customer_id = ${customerId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export type ModerationReview = ProductReview & {
  product_name: string;
};

export async function fetchReviewsForModeration(): Promise<ModerationReview[]> {
  await ensureReviewsTable();

  return getDb()<ModerationReview[]>`
    SELECT
      r.review_id,
      r.product_id,
      r.customer_id,
      COALESCE(c.name, 'Verified customer') AS customer_name,
      p.name AS product_name,
      r.rating,
      r.title,
      r.body,
      r.fit_feedback,
      r.is_flagged,
      r.status,
      r.created_at,
      r.updated_at
    FROM product_reviews r
    JOIN products p ON p.product_id = r.product_id
    LEFT JOIN users c ON c.customer_id = r.customer_id
    WHERE r.is_flagged = TRUE OR r.status = 'hidden'
    ORDER BY r.is_flagged DESC, r.updated_at DESC
    LIMIT 100
  `;
}
