import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { getDb } from '../../../lib/db';

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const parse = schema.safeParse(await req.json().catch(() => ({})));
    if (!parse.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parse.error.flatten() }, { status: 400 });
    }
    const { name, email, password, phone, address } = parse.data;

    const existing = await getDb()<{ email: string }[]>`
      SELECT email FROM customers WHERE email = ${email} LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const inserted = await getDb()<{ customer_id: string; name: string; email: string }[]>`
      INSERT INTO customers (name, email, password, phone, address)
      VALUES (${name}, ${email}, ${hashed}, ${phone ?? null}, ${address ?? null})
      RETURNING customer_id, name, email
    `;

    const user = inserted[0];
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Signup error', error);
    return NextResponse.json({ error: 'Unable to sign up right now.' }, { status: 500 });
  }
}
