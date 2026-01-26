import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Settings } from 'lucide-react';
import { fetchCustomerByEmail, fetchOrdersForCustomer } from '../lib/data';

export const dynamic = 'force-dynamic';

const formatDate = (d: string) => new Date(d).toLocaleDateString();
const formatMoney = (n: number) => `$${Number(n).toFixed(2)}`;

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const email = cookieStore.get('userEmail')?.value;
  if (!email) {
    redirect('/login');
  }

  const customer = await fetchCustomerByEmail(email);

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-red-400 text-sm">
          No customer found for this session. Please sign in again.
        </div>
      </div>
    );
  }

  const orders = await fetchOrdersForCustomer(customer.customer_id);

  return (
    <div className="pt-18 min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Welcome back</p>
            <h1 className="text-3xl font-semibold">{customer.name}</h1>
          </div>
          <button className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-400 text-sm flex items-center gap-2">
            <Settings size={16} />
            Settings
          </button>
        </header>

        <section className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-lg font-semibold mb-3">Account Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-400">Name</dt>
                <dd className="text-slate-100">{customer.name}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Email</dt>
                <dd className="text-slate-100">{customer.email}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Phone</dt>
                <dd className="text-slate-100">{customer.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Member since</dt>
                <dd className="text-slate-100">{formatDate(customer.created_at)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-400">Address</dt>
                <dd className="text-slate-100 whitespace-pre-wrap">{customer.address || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <button className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold">
              Update Profile
            </button>
            <button className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold">
              Change Password
            </button>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="w-full px-4 py-2 rounded-lg border border-red-600 text-red-300 hover:bg-red-900/30 text-sm font-semibold"
              >
                Sign Out
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Order History</h2>
            <span className="text-sm text-slate-400">{orders.length} orders</span>
          </div>
          {orders.length === 0 ? (
            <div className="text-slate-400 text-sm">No orders yet.</div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.order_id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Order #{order.order_id.slice(0, 8)}</p>
                      <p className="text-sm text-slate-300">{formatDate(order.order_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-300">Status</p>
                      <p className="font-semibold capitalize">{order.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-300">Total</p>
                      <p className="font-semibold">{formatMoney(order.total_amount)}</p>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-slate-800 pt-3 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.order_item_id} className="flex justify-between text-sm text-slate-200">
                        <div className="flex gap-2">
                          <span className="text-slate-400">x{item.quantity}</span>
                          <span>{item.product_name || 'Product'}</span>
                        </div>
                        <span className="text-slate-300">
                          {formatMoney(item.unit_price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
