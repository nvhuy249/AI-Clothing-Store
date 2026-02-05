import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET() {
  const cookieStore = await cookies();
  const email = cookieStore.get('userEmail')?.value;
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const userRows = await sql<{ customer_id: string }[]>`
    SELECT customer_id FROM customers WHERE email = ${email} LIMIT 1
  `;
  if (userRows.length === 0) return NextResponse.json({ items: [] });

  const customerId = userRows[0].customer_id;

  const rows = await sql`
    SELECT w.product_id, p.name, p.photos, p.price, p.brand_id, p.category_id
    FROM wishlist w
    JOIN products p ON p.product_id = w.product_id
    WHERE w.customer_id = ${customerId}
    ORDER BY w.created_at DESC
  `;

  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const email = cookieStore.get('userEmail')?.value;
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';
  let productId: string | undefined;
  if (contentType.includes('application/json')) {
    productId = (await req.json()).productId;
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await req.formData();
    productId = form.get('productId')?.toString();
  }

  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  const userRows = await sql<{ customer_id: string }[]>`
    SELECT customer_id FROM customers WHERE email = ${email} LIMIT 1
  `;
  if (userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const customerId = userRows[0].customer_id;

  await sql`
    INSERT INTO wishlist (customer_id, product_id)
    VALUES (${customerId}, ${productId})
    ON CONFLICT (customer_id, product_id) DO NOTHING
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const cookieStore = await cookies();
  const email = cookieStore.get('userEmail')?.value;
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';
  let productId: string | undefined;
  if (contentType.includes('application/json')) {
    productId = (await req.json()).productId;
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await req.formData();
    productId = form.get('productId')?.toString();
  }

  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  const userRows = await sql<{ customer_id: string }[]>`
    SELECT customer_id FROM customers WHERE email = ${email} LIMIT 1
  `;
  if (userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const customerId = userRows[0].customer_id;

  await sql`
    DELETE FROM wishlist
    WHERE customer_id = ${customerId} AND product_id = ${productId}
  `;

  return NextResponse.json({ ok: true });
}

