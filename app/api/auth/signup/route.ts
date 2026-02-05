import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone, address } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 });
    }

    const existing = await sql<{ email: string }[]>`
      SELECT email FROM customers WHERE email = ${email} LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const inserted = await sql<{ customer_id: string; name: string; email: string }[]>`
      INSERT INTO customers (name, email, password, phone, address)
      VALUES (${name}, ${email}, ${hashed}, ${phone ?? null}, ${address ?? null})
      RETURNING customer_id, name, email
    `;

    const user = inserted[0];
    const res = NextResponse.json({ user });
    res.cookies.set('userEmail', user.email, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error) {
    console.error('Signup error', error);
    return NextResponse.json({ error: 'Unable to sign up right now.' }, { status: 500 });
  }
}

