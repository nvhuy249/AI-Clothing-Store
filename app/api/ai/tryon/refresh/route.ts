import { NextResponse } from 'next/server';
import { assertAiEnabled, getProductsAny, getProductsMissingAi } from '../../../../lib/ai';
import { dressProductWithViton, generateStabilityBaseModelImages } from '../../../../lib/tryon';

export async function POST(req: Request) {
  try {
    const { adminToken, force, maxProducts, generateBaseModels } = (await req.json().catch(() => ({}))) || {};
    assertAiEnabled(adminToken);

    // optional: bootstrap base models via Stability if none exist
    if (generateBaseModels) {
      await generateStabilityBaseModelImages(typeof generateBaseModels === 'number' ? generateBaseModels : 4);
    }

    const limitNum = Number(maxProducts);
    const limit = Number.isFinite(limitNum) ? limitNum : 3;
    if (limit <= 0) {
      return NextResponse.json({ results: [] });
    }

    const bounded = Math.max(1, Math.min(limit, 20));
    const productIds = force ? await getProductsAny(bounded) : await getProductsMissingAi(bounded);

    const results: Array<{ productId: string; url?: string; error?: string }> = [];
    for (const productId of productIds) {
      try {
        const url = await dressProductWithViton(productId);
        results.push({ productId, url });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'failed';
        results.push({ productId, error: message });
      }
    }

    return NextResponse.json({ results });
  } catch (error: unknown) {
    console.error('Try-on refresh error', error);
    const message = error instanceof Error ? error.message : 'Refresh failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

