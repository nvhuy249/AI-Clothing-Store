import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { fetchCustomerByEmail } from '../../../lib/data';
import { getDb } from '../../../lib/db';
import { z } from 'zod';

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      qty: z.number().int().positive(),
    })
  ).min(1),
  shippingAddress: z.string().max(500).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const customer = await fetchCustomerByEmail(email);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const parse = orderSchema.safeParse(await req.json().catch(() => ({})));
    if (!parse.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parse.error.flatten() }, { status: 400 });
    }
    const { items, shippingAddress, address, phone, note } = parse.data;
    const shipAddress = shippingAddress || address || null;

    const productIds = items.map((i) => i.productId);

    return await getDb().begin(async (trx) => {
      const dbProducts = await trx<{ product_id: string; price: number; stock_quantity: number | null }[]>`
        SELECT product_id, price, COALESCE(stock_quantity, 0) AS stock_quantity
        FROM products
        WHERE product_id = ANY(${productIds})
        FOR UPDATE
      `;
      if (dbProducts.length !== productIds.length) {
        return NextResponse.json({ error: 'One or more products not found' }, { status: 400 });
      }

      const priceMap = new Map(dbProducts.map((p) => [p.product_id, Number(p.price)]));
      const stockMap = new Map(dbProducts.map((p) => [p.product_id, Number(p.stock_quantity || 0)]));

      for (const item of items) {
        const stock = stockMap.get(item.productId) ?? 0;
        if (item.qty > stock) {
          return NextResponse.json(
            { error: `Insufficient stock for product ${item.productId}` },
            { status: 400 },
          );
        }
      }

      const total = items.reduce((sum, i) => {
        const price = priceMap.get(i.productId) || 0;
        return sum + price * i.qty;
      }, 0);

      const orderRow = await trx<{ order_id: string }[]>`
        INSERT INTO orders (customer_id, status, total_amount, address, phone, note)
        VALUES (${customer.customer_id}, 'pending', ${total}, ${shipAddress}, ${phone}, ${note})
        RETURNING order_id
      `;
      const orderId = orderRow[0].order_id;

      for (const i of items) {
        const price = priceMap.get(i.productId) || 0;
        await trx`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price)
          VALUES (${orderId}, ${i.productId}, ${i.qty}, ${price})
        `;
        await trx`
          UPDATE products
          SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - ${i.qty})
          WHERE product_id = ${i.productId}
        `;
      }

      return NextResponse.json({ ok: true, orderId });
    });
  } catch (err: unknown) {
    console.error('Local checkout error', err);
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
