import { NextResponse } from 'next/server';
import {
  assertAiEnabled,
  checkDailyCap,
  generateStabilityImageForBase,
  getProductsAny,
  getProductsMissingAi,
  upsertAiPhoto,
} from '../../../../lib/ai';
import { fetchProductById } from '../../../../lib/data';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function POST(req: Request) {
  try {
    const { adminToken, force, maxProducts } = (await req.json().catch(() => ({}))) || {};
    assertAiEnabled(adminToken);

    const baseRow =
      (
        await sql`
          SELECT image_url
          FROM ai_generated_photos
          WHERE product_id IS NULL AND ai_model_version = 'base-model'
          ORDER BY created_at DESC
          LIMIT 1
        `
      )[0] || null;

    if (!baseRow?.image_url) {
      return NextResponse.json(
        { error: 'No base model images found. Generate base models first via /api/ai/base-model.' },
        { status: 400 },
      );
    }

    const baseImageUrl = baseRow.image_url as string;

    const limit = Math.max(1, Math.min(Number(maxProducts) || 3, 20));
    const productIds = force ? await getProductsAny(limit) : await getProductsMissingAi(limit);
    const results: Array<{ productId: string; url?: string; error?: string }> = [];

    for (const productId of productIds) {
      try {
        await checkDailyCap();
        const product = await fetchProductById(productId);
        if (!product) {
          results.push({ productId, error: 'Product not found' });
          continue;
        }
        const url = await generateStabilityImageForBase(product, baseImageUrl);
        await upsertAiPhoto(productId, url);
        results.push({ productId, url });
      } catch (err: any) {
        results.push({ productId, error: err.message || 'failed' });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Stability refresh error', error);
    return NextResponse.json({ error: error.message || 'Refresh failed' }, { status: 500 });
  }
}
