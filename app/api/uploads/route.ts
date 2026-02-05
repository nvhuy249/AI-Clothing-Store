import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { cookies } from 'next/headers';
import { fetchCustomerByEmail } from '../../lib/data';
import { uploadBufferToSupabase, hasSupabaseStorage } from '../../lib/storage';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
const AI_ENABLED = process.env.AI_IMAGES_ENABLED === 'true';

export async function POST(req: Request) {
  try {
    if (!AI_ENABLED) return NextResponse.json({ error: 'AI uploads disabled' }, { status: 403 });

    const cookieStore = await cookies();
    const email = cookieStore.get('userEmail')?.value;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const customer = await fetchCustomerByEmail(email);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const productId = (form.get('productId') as string | null) || null;
    if (!file) return NextResponse.json({ error: 'File missing' }, { status: 400 });

    const arrayBuf = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const contentType = file.type || 'image/png';

    let url = '';
    if (hasSupabaseStorage()) {
      const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
      const key = `user-uploads/${customer.customer_id}-${Date.now()}.${ext}`;
      url = await uploadBufferToSupabase(buf, key, contentType);
    } else {
      const b64 = buf.toString('base64');
      url = `data:${contentType};base64,${b64}`;
    }

    await sql`
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


