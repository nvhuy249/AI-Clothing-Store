/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchProductById, fetchProductFeedback } from "../../lib/data";
import WishlistButton from "../../components/WishlistButton";
import ProductGallery from "../../components/ProductGallery";
import TryOnUploader from "../../components/TryOnUploader";
import AddToCartButton from "../../components/AddToCartButton";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export const dynamic = "force-dynamic";

const formatMoney = (n: number) => `$${Number(n).toFixed(2)}`;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;
  if (!resolvedParams?.id || resolvedParams.id === "undefined") {
    return notFound();
  }

  const product = await fetchProductById(resolvedParams.id);
  if (!product) return notFound();

  const feedback = await fetchProductFeedback(product.product_id);
  const allPhotos = [
    ...((product?.photos as string[] | null) ?? []),
    ...((product?.ai_photos as string[] | null) ?? []),
  ];

  const session = await getServerSession(authOptions);
  const authed = !!session?.user?.email;
  const aiEnabled = process.env.AI_IMAGES_ENABLED === "true";
  const dailyCap =
    process.env.NEXT_PUBLIC_AI_IMAGES_DAILY_CAP
      ? Number(process.env.NEXT_PUBLIC_AI_IMAGES_DAILY_CAP)
      : null;
  const primaryGlowTarget: "hero" | "tryon" | "none" = "tryon";

  return (
    <div className="min-h-screen bg-[color:var(--bg-base)] text-[color:var(--text-muted)] px-4 py-12 pt-18">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <ProductGallery photos={allPhotos} alt={product.name} />

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">{product.name}</h1>
            <p className="text-[color:var(--text-muted)] text-sm mt-1">
              {product.brand_name ? `${product.brand_name} · ` : ""}
              {product.category_name || "Category"}
              {product.subcategory_name ? ` / ${product.subcategory_name}` : ""}
            </p>
          </div>

          <div className="text-3xl font-semibold text-emerald-400">{formatMoney(product.price)}</div>

          <div className="space-y-2 text-sm text-[color:var(--text-muted)]">
            <p>Colour: {product.colour || "—"}</p>
            <p>Size: {product.size || "—"}</p>
            <p>Description: {product.description || "No description provided."}</p>
            <div className="flex items-center gap-2 text-amber-400">
              <span>★★★★☆</span>
              <span className="text-[color:var(--text-muted)] text-xs">4.0 (placeholder)</span>
            </div>
          </div>

          <div className="space-y-3">
            <AddToCartButton
              productId={product.product_id}
              name={product.name}
              price={Number(product.price)}
              photo={product.photos?.[0]}
            />
            <WishlistButton productId={product.product_id} authed={authed} />
            {!authed && (
              <Link href="/login" className="block text-center text-sm text-[color:var(--accent-blue)] hover:brightness-110">
                Sign in to checkout faster
              </Link>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="font-semibold mb-2 text-[color:var(--text-primary)]">Sizing</h3>
            <p className="text-sm text-[color:var(--text-muted)]">
              Size listed: {product.size || "—"}. For best fit, compare with your favorite similar garment.
            </p>
          </div>

          <TryOnUploader
            productId={product.product_id}
            aiEnabled={aiEnabled}
            authed={authed}
            dailyCap={dailyCap}
            primaryGlowTarget={primaryGlowTarget}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-12">
        <h2 className="text-xl font-semibold mb-3 text-[color:var(--text-primary)]">AI Styled Looks</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="group relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-panel)] p-4 transition duration-200 hover:border-[color:var(--border-soft)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-soft)] glow-none"
            >
              <div className="overflow-hidden rounded-[18px] border border-[color:var(--border-subtle)] bg-[color:var(--bg-base)] aspect-[3/4]" />
              <p className="text-sm text-[color:var(--text-muted)]">Styled by AI</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div className="max-w-6xl mx-auto mt-12">
        <h2 className="text-xl font-semibold mb-3 text-[color:var(--text-primary)]">Customer Photos & Feedback</h2>
        {feedback.length === 0 ? (
          <p className="text-[color:var(--text-muted)] text-sm">No feedback yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {feedback.map((f) => (
              <div key={f.photo_id} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <img src={f.image_url} alt="Customer upload" className="w-full h-48 object-cover" />
                <div className="p-3 text-xs text-[color:var(--text-muted)]">
                  Uploaded {new Date(f.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
