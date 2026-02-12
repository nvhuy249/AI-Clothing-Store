import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { fetchCustomerByEmail, fetchProductById } from '../../../../lib/data';
import { dressUserWithTryon } from '../../../../lib/tryon';
import { uploadBufferToSupabase, hasSupabaseStorage } from '../../../../lib/storage';
import sharp from 'sharp';
import { z } from 'zod';

const AI_ENABLED = process.env.AI_IMAGES_ENABLED === 'true';
const MAX_UPLOAD_BYTES = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES || 5 * 1024 * 1024);
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const formSchema = z.object({
  productId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    if (!AI_ENABLED) return NextResponse.json({ error: 'AI disabled' }, { status: 403 });

    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const customer = await fetchCustomerByEmail(email);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const parsed = formSchema.safeParse({ productId: form.get('productId')?.toString() });
    if (!parsed.success) return NextResponse.json({ error: 'Invalid productId' }, { status: 400 });
    const productId = parsed.data.productId;
    if (!file || !productId) return NextResponse.json({ error: 'file and productId required' }, { status: 400 });
    if (!ALLOWED_MIMES.includes(file.type)) return NextResponse.json({ error: 'Only JPEG/PNG/WebP images allowed' }, { status: 415 });
    const arrayBuf = await file.arrayBuffer();
    if (arrayBuf.byteLength > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'File too large' }, { status: 413 });
    const buf = Buffer.from(arrayBuf);

    // Upload user image to Supabase (or fail if not configured)
    const cleaned = await sharp(buf).rotate().toBuffer();
    const contentType = file.type || 'image/png';
    if (!hasSupabaseStorage()) return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
    const key = `user-uploads/${customer.customer_id}-${Date.now()}.${ext}`;
    const humanUrl = await uploadBufferToSupabase(cleaned, key, contentType);

    const product = await fetchProductById(productId);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const resultUrl = await dressUserWithTryon(product, humanUrl, customer.customer_id);
    return NextResponse.json({ url: resultUrl });
  } catch (err: unknown) {
    console.error('User try-on error', err);
    const message = err instanceof Error ? err.message : 'User try-on failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!AI_ENABLED) return NextResponse.json({ error: 'AI disabled' }, { status: 403 });
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const customer = await fetchCustomerByEmail(email);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get('photoId');
    if (!photoId) return NextResponse.json({ error: 'photoId required' }, { status: 400 });

    const sql = (await import('postgres')).default(process.env.POSTGRES_URL!, { ssl: 'require' });
    const result = await sql`
      DELETE FROM ai_generated_photos
      WHERE photo_id = ${photoId} AND customer_id = ${customer.customer_id}
      RETURNING photo_id
    `;
    await sql.end();
    if (result.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('Delete user try-on error', err);
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
