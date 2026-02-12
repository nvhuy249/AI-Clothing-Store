import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { getDb } from '../../lib/db';
import { z } from 'zod';

const productSchema = z.object({
  productId: z.string().uuid(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const userRows = await getDb()<{ customer_id: string }[]>`
    SELECT customer_id FROM customers WHERE email = ${email} LIMIT 1
  `;
  if (userRows.length === 0) return NextResponse.json({ items: [] });

  const customerId = userRows[0].customer_id;

  const rows = await getDb()`
    SELECT w.product_id, p.name, p.photos, p.price, p.brand_id, p.category_id
    FROM wishlist w
    JOIN products p ON p.product_id = w.product_id
    WHERE w.customer_id = ${customerId}
    ORDER BY w.created_at DESC
  `;

  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';
  let productIdRaw: unknown;
  if (contentType.includes('application/json')) {
    productIdRaw = (await req.json()).productId;
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await req.formData();
    productIdRaw = form.get('productId')?.toString();
  }
  const parsed = productSchema.safeParse({ productId: productIdRaw });
  if (!parsed.success) return NextResponse.json({ error: 'productId required' }, { status: 400 });
  const productId = parsed.data.productId;

  const userRows = await getDb()<{ customer_id: string }[]>`
    SELECT customer_id FROM customers WHERE email = ${email} LIMIT 1
  `;
  if (userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const customerId = userRows[0].customer_id;

  await getDb()`
    INSERT INTO wishlist (customer_id, product_id)
    VALUES (${customerId}, ${productId})
    ON CONFLICT (customer_id, product_id) DO NOTHING
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';
  let productIdRaw: unknown;
  if (contentType.includes('application/json')) {
    productIdRaw = (await req.json()).productId;
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await req.formData();
    productIdRaw = form.get('productId')?.toString();
  }
  const parsed = productSchema.safeParse({ productId: productIdRaw });
  if (!parsed.success) return NextResponse.json({ error: 'productId required' }, { status: 400 });
  const productId = parsed.data.productId;

  const userRows = await getDb()<{ customer_id: string }[]>`
    SELECT customer_id FROM customers WHERE email = ${email} LIMIT 1
  `;
  if (userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const customerId = userRows[0].customer_id;

  await getDb()`
    DELETE FROM wishlist
    WHERE customer_id = ${customerId} AND product_id = ${productId}
  `;

  return NextResponse.json({ ok: true });
}
