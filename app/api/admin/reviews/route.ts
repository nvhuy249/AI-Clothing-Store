import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { ensureReviewsTable, fetchReviewsForModeration } from "../../../lib/reviews";
import { isAdminEmail } from "../../../lib/roles";

const patchSchema = z.object({
  reviewId: z.string().uuid(),
  action: z.enum(["approve", "hide", "unhide"]),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(await isAdminEmail(session?.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reviews = await fetchReviewsForModeration();
  return NextResponse.json({ reviews });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(await isAdminEmail(session?.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  await ensureReviewsTable();
  const { reviewId, action } = parsed.data;
  const status = action === "hide" ? "hidden" : "published";

  const updated = await getDb()`
    UPDATE product_reviews
    SET
      status = ${status},
      is_flagged = CASE WHEN ${action} = 'approve' THEN FALSE ELSE is_flagged END,
      updated_at = CURRENT_TIMESTAMP
    WHERE review_id = ${reviewId}
    RETURNING review_id
  `;

  if (updated.length === 0) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
