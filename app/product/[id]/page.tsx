import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { fetchProductById, fetchProductFeedback } from '../../lib/data';
import WishlistButton from '../../components/WishlistButton';
import ProductGallery from '../../components/ProductGallery';
import TryOnUploader from '../../components/TryOnUploader';
import AddToCartButton from '../../components/AddToCartButton';

export const dynamic = 'force-dynamic';

const formatMoney = (n: number) => `$${Number(n).toFixed(2)}`;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;
  if (!resolvedParams?.id || resolvedParams.id === 'undefined') {
    return notFound();
  }

  const product = await fetchProductById(resolvedParams.id);
  if (!product) return notFound();

  const feedback = await fetchProductFeedback(product.product_id);
  const allPhotos = [
    ...((product?.photos as string[] | null) ?? []),
    ...((product?.ai_photos as string[] | null) ?? []),
  ];

  const cookieStore = await cookies();
  const authed = !!cookieStore.get('userEmail');
  const aiEnabled = process.env.AI_IMAGES_ENABLED === 'true';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white px-4 py-12 pt-18">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <ProductGallery photos={allPhotos} alt={product.name} />

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold">{product.name}</h1>
            <p className="text-slate-300 text-sm mt-1">
              {product.brand_name ? `${product.brand_name} · ` : ''}
              {product.category_name || 'Category'}
              {product.subcategory_name ? ` / ${product.subcategory_name}` : ''}
            </p>
          </div>

          <div className="text-3xl font-bold text-emerald-400">{formatMoney(product.price)}</div>

          <div className="space-y-2 text-sm text-slate-200">
            <p className="text-slate-300">Colour: {product.colour || '—'}</p>
            <p className="text-slate-300">Size: {product.size || '—'}</p>
            <p className="text-slate-300">
              Description: {product.description || 'No description provided.'}
            </p>
            <div className="flex items-center gap-2 text-amber-400">
              <span>★★★★☆</span>
              <span className="text-slate-400 text-xs">4.0 (placeholder)</span>
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
              <Link href="/login" className="block text-center text-sm text-blue-300 hover:text-blue-200">
                Sign in to checkout faster
              </Link>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="font-semibold mb-2">Sizing</h3>
            <p className="text-sm text-slate-300">
              Size listed: {product.size || '—'}. For best fit, compare with your favorite similar garment.
            </p>
          </div>

          <TryOnUploader productId={product.product_id} aiEnabled={aiEnabled} authed={authed} />
        </div>
      </div>

      {/* Feedback */}
      <div className="max-w-6xl mx-auto mt-12">
        <h2 className="text-xl font-semibold mb-3">Customer Photos & Feedback</h2>
        {feedback.length === 0 ? (
          <p className="text-slate-400 text-sm">No feedback yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {feedback.map((f) => (
              <div key={f.photo_id} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <img src={f.image_url} alt="Customer upload" className="w-full h-48 object-cover" />
                <div className="p-3 text-xs text-slate-400">
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
