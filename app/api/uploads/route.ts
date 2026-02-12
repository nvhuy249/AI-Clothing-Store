import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';
import { fetchCustomerByEmail } from '../../lib/data';
import { uploadBufferToSupabase, hasSupabaseStorage } from '../../lib/storage';
import sharp from 'sharp';
import { getDb } from '../../lib/db';
import { z } from 'zod';

const AI_ENABLED = process.env.AI_IMAGES_ENABLED === 'true';
const MAX_UPLOAD_BYTES = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES || 5 * 1024 * 1024); // 5MB default
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const formSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    if (!AI_ENABLED) return NextResponse.json({ error: 'AI uploads disabled' }, { status: 403 });

    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const customer = await fetchCustomerByEmail(email);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const parsed = formSchema.safeParse({ productId: form.get('productId')?.toString() });
    if (!parsed.success) return NextResponse.json({ error: 'Invalid productId' }, { status: 400 });
    const productId = parsed.data.productId || null;
    if (!file) return NextResponse.json({ error: 'File missing' }, { status: 400 });
    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG/PNG/WebP images allowed' }, { status: 415 });
    }
    const arrayBuf = await file.arrayBuffer();
    if (arrayBuf.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }
    const buf = Buffer.from(arrayBuf);

    // Strip metadata + normalize orientation via sharp
    const cleaned = await sharp(buf).rotate().toBuffer();
    const contentType = file.type || 'image/png';


    let url = '';
    if (hasSupabaseStorage()) {
      const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
      const key = `user-uploads/${customer.customer_id}-${Date.now()}.${ext}`;
      url = await uploadBufferToSupabase(cleaned, key, contentType);
    } else {
      const b64 = cleaned.toString('base64');
      url = `data:${contentType};base64,${b64}`;
    }

    await getDb()`
      INSERT INTO uploaded_photos (customer_id, product_id, image_url)
      VALUES (${customer.customer_id}, ${productId}, ${url})
    `;

    return NextResponse.json({ url });
  } catch (err: unknown) {
    console.error('Upload error', err);
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
