import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AdminReviewsModeration from "../../components/AdminReviewsModeration";
import { authOptions } from "../../lib/auth";
import { fetchReviewsForModeration } from "../../lib/reviews";
import { isAdminEmail } from "../../lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!(await isAdminEmail(session?.user?.email))) {
    redirect("/login");
  }

  const reviews = await fetchReviewsForModeration();

  return (
    <div className="min-h-screen bg-[color:var(--bg-base)] px-4 py-10 pt-24 text-[color:var(--text-primary)]">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-[color:var(--text-muted)]">Admin</p>
            <h1 className="text-3xl font-semibold">Review moderation</h1>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-[color:var(--border-subtle)] px-4 py-2 text-sm text-[color:var(--text-primary)] hover:border-[color:var(--border-soft)]"
          >
            Inventory
          </Link>
        </header>

        <AdminReviewsModeration initialReviews={reviews} />
      </div>
    </div>
  );
}
