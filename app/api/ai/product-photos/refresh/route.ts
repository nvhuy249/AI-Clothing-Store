import { NextResponse } from 'next/server';
import {
  assertAiEnabled,
  checkDailyCap,
  generateProductPackshotImage,
  getProductsAny,
  getProductsMissingGeneratedPackshots,
  markGeneratedPackshot,
  replaceProductPrimaryPhoto,
} from '../../../../lib/ai';

export async function POST(req: Request) {
  try {
    const { adminToken, force, maxProducts } = (await req.json().catch(() => ({}))) || {};
    assertAiEnabled(adminToken);

    const limitNum = Number(maxProducts);
    const limit = Number.isFinite(limitNum) ? Math.max(1, Math.min(limitNum, 20)) : 3;
    const productIds = force ? await getProductsAny(limit) : await getProductsMissingGeneratedPackshots(limit);
    const results: Array<{ productId: string; url?: string; error?: string }> = [];

    for (const productId of productIds) {
      try {
        await checkDailyCap();
        const url = await generateProductPackshotImage(productId);
        await replaceProductPrimaryPhoto(productId, url);
        await markGeneratedPackshot(productId);
        results.push({ productId, url });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'failed';
        results.push({ productId, error: message });
      }
    }

    return NextResponse.json({ results });
  } catch (error: unknown) {
    console.error('Product photo refresh error', error);
    const message = error instanceof Error ? error.message : 'Product photo refresh failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
