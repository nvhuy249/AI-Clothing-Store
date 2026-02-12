import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { uploadBufferToSupabase, hasSupabaseStorage } from '../../../lib/storage';
import { getDb } from '../../../lib/db';
import { z } from 'zod';
import sharp from 'sharp';

const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
const MAX_UPLOAD_BYTES = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES || 5 * 1024 * 1024);
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

function requireAdmin(email?: string) {
  return email && adminEmails.includes(email.toLowerCase());
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await getDb()`
    SELECT product_id, name, price, COALESCE(stock_quantity, 0) AS stock_quantity, photos
    FROM products
    ORDER BY created_at DESC
    LIMIT 50
  `;
  return NextResponse.json({ products: rows });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const schema = z.object({
    productId: z.string().uuid(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
  });
  const parse = schema.safeParse(await req.json().catch(() => ({})));
  if (!parse.success) return NextResponse.json({ error: 'Invalid payload', details: parse.error.flatten() }, { status: 400 });
  const { productId, price, stock } = parse.data;

  const updated = await getDb()`
    UPDATE products
    SET
      price = COALESCE(${price}, price),
      stock_quantity = COALESCE(${stock}, stock_quantity)
    WHERE product_id = ${productId}
    RETURNING product_id, name, price, stock_quantity, photos
  `;

  if (updated.length === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json({ product: updated[0] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const productId = form.get('productId')?.toString();
  if (!file || !productId) return NextResponse.json({ error: 'file and productId required' }, { status: 400 });
  if (!ALLOWED_MIMES.includes(file.type)) return NextResponse.json({ error: 'Only JPEG/PNG/WebP allowed' }, { status: 415 });
  const arrayBuf = await file.arrayBuffer();
  if (arrayBuf.byteLength > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'File too large' }, { status: 413 });
  const buf = Buffer.from(arrayBuf);
  const contentType = file.type || 'image/png';
  const cleaned = await sharp(buf).rotate().toBuffer();

  let url = '';
  if (hasSupabaseStorage()) {
    const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
    const key = `products/${productId}-${Date.now()}.${ext}`;
    url = await uploadBufferToSupabase(cleaned, key, contentType, { public: true });
  } else {
    url = `data:${contentType};base64,${cleaned.toString('base64')}`;
  }

  const updated = await getDb()`
    UPDATE products
    SET photos = array_append(COALESCE(photos, '{}'), ${url})
    WHERE product_id = ${productId}
    RETURNING product_id, name, price, stock_quantity, photos
  `;

  if (updated.length === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json({ product: updated[0] });
}
