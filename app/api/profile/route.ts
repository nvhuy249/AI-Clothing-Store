import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET() {
  const cookieStore = await cookies();
  const email = cookieStore.get('userEmail')?.value;
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const rows = await sql`
    SELECT customer_id, name, email, phone, address, profile_photo_url, created_at
    FROM customers
    WHERE email = ${email}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: rows[0] });
}

export async function PUT(req: Request) {
  const cookieStore = await cookies();
  const email = cookieStore.get('userEmail')?.value;
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await req.json();
  const { name, phone, address, profile_photo_url } = body || {};

  const updated = await sql`
    UPDATE customers
    SET
      name = COALESCE(${name}, name),
      phone = COALESCE(${phone}, phone),
      address = COALESCE(${address}, address),
      profile_photo_url = COALESCE(${profile_photo_url}, profile_photo_url)
    WHERE email = ${email}
    RETURNING customer_id, name, email, phone, address, profile_photo_url, created_at
  `;

  if (updated.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: updated[0] });
}

