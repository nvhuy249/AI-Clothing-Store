import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchCustomerByEmail } from '../lib/data';
import WishlistCard from '../components/WishlistCard';

export const dynamic = 'force-dynamic';

type WishlistItem = {
  product_id: string;
  name: string;
  photos: string[] | null;
  price: number;
};


async function fetchWishlist(email: string): Promise<WishlistItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/wishlist`, {
    next: { revalidate: 0 },
    headers: {
      cookie: `userEmail=${email}`,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items ?? [];
}

export default async function WishlistPage() {
  const cookieStore = await cookies();
  const email = cookieStore.get('userEmail')?.value;
  if (!email) {
    redirect('/login');
  }

  const user = await fetchCustomerByEmail(email!);
  if (!user) {
    redirect('/login');
  }

  const items = await fetchWishlist(email!);

  return (
    <div className="pt-18 min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[color:var(--text-muted)]">Wishlist</p>
            <h1 className="text-3xl font-semibold">{user.name}</h1>
          </div>
        </header>

        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-[color:var(--text-muted)]">
            Your wishlist is empty. Browse the <Link href="/shop" className="text-blue-300 hover:text-blue-200">shop</Link> to add items.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((item) => (
              <WishlistCard
                key={item.product_id}
                productId={item.product_id}
                name={item.name}
                price={item.price}
                photos={item.photos}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



