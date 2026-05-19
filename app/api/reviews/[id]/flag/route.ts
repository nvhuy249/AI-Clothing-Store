import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "../../../../lib/db";
import { ensureReviewsTable } from "../../../../lib/reviews";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_req: Request, { params }: Props) {
  try {
    const resolvedParams = await params;
    const parsed = paramsSchema.safeParse(resolvedParams);
    if (!parsed.success) return NextResponse.json({ error: "Invalid review" }, { status: 400 });

    await ensureReviewsTable();
    const updated = await getDb()`
      UPDATE product_reviews
      SET is_flagged = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE review_id = ${parsed.data.id}
      RETURNING review_id
    `;

    if (updated.length === 0) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Review flag error", error);
    return NextResponse.json({ error: "Unable to flag review" }, { status: 500 });
  }
}

