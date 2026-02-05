import { NextResponse } from 'next/server';
import postgres from 'postgres';
import {
  assertAiEnabled,
  checkDailyCap,
  upsertAiPhoto,
  generateStabilityImageForBase,
} from '../../../lib/ai';
import { fetchProductById } from '../../../lib/data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function POST(req: Request) {
  try {
    const { adminToken, productId, basePhotoId } = (await req.json().catch(() => ({}))) || {};
    assertAiEnabled(adminToken);
    await checkDailyCap();

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const product = await fetchProductById(productId);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const basePhoto = basePhotoId
      ? (
          await sql`
            SELECT image_url
            FROM ai_generated_photos
            WHERE photo_id = ${basePhotoId}
            LIMIT 1
          `
        )[0]
      : (
          await sql`
            SELECT image_url
            FROM ai_generated_photos
            WHERE product_id IS NULL AND ai_model_version = 'base-model'
            ORDER BY created_at DESC
            LIMIT 1
          `
        )[0];

    if (!basePhoto?.image_url) {
      return NextResponse.json(
        { error: 'No base model image found. Generate base models first.' },
        { status: 400 },
      );
    }

    // dress product onto base model
    const dressedUrl = await generateStabilityImageForBase(product, basePhoto.image_url);
    await upsertAiPhoto(product.product_id, dressedUrl);

    return NextResponse.json({ url: dressedUrl });
  } catch (error: unknown) {
    console.error('Dress error', error);
    const message = error instanceof Error ? error.message : 'Dress failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

