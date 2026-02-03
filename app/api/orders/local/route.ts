import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import postgres from 'postgres';
import { fetchCustomerByEmail } from '../../../lib/data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('userEmail')?.value;
    if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const customer = await fetchCustomerByEmail(email);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const items = body.items as Array<{ productId: string; qty: number }>;
    const shippingName = body.shippingName || null;
    const shippingAddress = body.shippingAddress || null;
    const phone = body.phone || null;
    const note = body.note || null;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items' }, { status: 400 });
    }

    const productIds = items.map((i) => i.productId);
    const dbProducts = await sql<{ product_id: string; price: number }[]>`
      SELECT product_id, price FROM products WHERE product_id = ANY(${productIds})
    `;
    if (dbProducts.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products not found' }, { status: 400 });
    }

    const priceMap = new Map(dbProducts.map((p) => [p.product_id, Number(p.price)]));
    const total = items.reduce((sum, i) => {
      const price = priceMap.get(i.productId) || 0;
      return sum + price * i.qty;
    }, 0);

    const orderRow = await sql<{ order_id: string }[]>`
      INSERT INTO orders (customer_id, status, total_amount, address, phone, note)
      VALUES (${customer.customer_id}, 'pending', ${total}, ${shippingAddress}, ${phone}, ${note})
      RETURNING order_id
    `;
    const orderId = orderRow[0].order_id;

    for (const i of items) {
      const price = priceMap.get(i.productId) || 0;
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (${orderId}, ${i.productId}, ${i.qty}, ${price})
      `;
    }

    await sql.end();
    return NextResponse.json({ ok: true, orderId });
  } catch (err: any) {
    console.error('Local checkout error', err);
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 500 });
  }
}
