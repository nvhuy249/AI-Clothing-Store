import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "../../lib/auth";
import { fetchCustomerByEmail } from "../../lib/data";
import { getDb } from "../../lib/db";
import { ensureReviewsTable, fetchCustomerReview } from "../../lib/reviews";

const createSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().nullable(),
  body: z.string().trim().min(10).max(1500),
  fitFeedback: z.string().trim().max(80).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const customer = await fetchCustomerByEmail(email);
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review", details: parsed.error.flatten() }, { status: 400 });
    }

    await ensureReviewsTable();
    const { productId, rating, title, body, fitFeedback } = parsed.data;

    const product = await getDb()<Array<{ product_id: string }>>`
      SELECT product_id FROM products WHERE product_id = ${productId} LIMIT 1
    `;
    if (product.length === 0) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const rows = await getDb()`
      INSERT INTO product_reviews (product_id, customer_id, rating, title, body, fit_feedback, is_flagged, status, updated_at)
      VALUES (
        ${productId},
        ${customer.customer_id},
        ${rating},
        ${title || null},
        ${body},
        ${fitFeedback || null},
        FALSE,
        'published',
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (product_id, customer_id)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        fit_feedback = EXCLUDED.fit_feedback,
        is_flagged = FALSE,
        status = 'published',
        updated_at = CURRENT_TIMESTAMP
      RETURNING review_id
    `;

    const review = await fetchCustomerReview(productId, customer.customer_id);
    return NextResponse.json({ ok: true, review, reviewId: rows[0]?.review_id });
  } catch (error) {
    console.error("Review create error", error);
    return NextResponse.json({ error: "Unable to save review" }, { status: 500 });
  }
}

