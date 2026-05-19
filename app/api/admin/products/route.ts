import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { uploadBufferToSupabase, hasSupabaseStorage } from '../../../lib/storage';
import { getDb } from '../../../lib/db';
import { z } from 'zod';
import sharp from 'sharp';
import { isAdminEmail } from '../../../lib/roles';

const MAX_UPLOAD_BYTES = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES || 5 * 1024 * 1024);
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const createSchema = z.object({
  name: z.string().trim().min(2).max(255),
  description: z.string().trim().max(1500).optional().nullable(),
  price: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  colour: z.string().trim().max(50).optional().nullable(),
  size: z.string().trim().max(50).optional().nullable(),
  fit: z.string().trim().max(100).optional().nullable(),
  material: z.string().trim().max(100).optional().nullable(),
});
const deleteSchema = z.object({
  productId: z.string().uuid(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(await isAdminEmail(session?.user?.email))) {
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
  if (!(await isAdminEmail(session?.user?.email))) {
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
  const nextPrice = price ?? null;
  const nextStock = stock ?? null;

  const updated = await getDb()`
    UPDATE products
    SET
      price = COALESCE(${nextPrice}, price),
      stock_quantity = COALESCE(${nextStock}, stock_quantity)
    WHERE product_id = ${productId}
    RETURNING product_id, name, price, stock_quantity, photos
  `;

  if (updated.length === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json({ product: updated[0] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(await isAdminEmail(session?.user?.email))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const contentTypeHeader = req.headers.get('content-type') || '';
  if (contentTypeHeader.includes('application/json')) {
    const parse = createSchema.safeParse(await req.json().catch(() => ({})));
    if (!parse.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parse.error.flatten() }, { status: 400 });
    }
    const product = parse.data;
    const rows = await getDb()`
      INSERT INTO products (
        name,
        description,
        price,
        stock_quantity,
        colour,
        size,
        fit,
        material,
        photos
      )
      VALUES (
        ${product.name},
        ${product.description || null},
        ${product.price},
        ${product.stock},
        ${product.colour || null},
        ${product.size || null},
        ${product.fit || null},
        ${product.material || null},
        '{}'
      )
      RETURNING product_id, name, price, stock_quantity, photos
    `;

    return NextResponse.json({ product: rows[0] }, { status: 201 });
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

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(await isAdminEmail(session?.user?.email))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = deleteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const deleted = await getDb()`
    DELETE FROM products
    WHERE product_id = ${parsed.data.productId}
    RETURNING product_id
  `;

  if (deleted.length === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
