import { NextResponse } from 'next/server';
import { generateAiOutfitImage, upsertAiPhoto, getProductsMissingAi, assertAiEnabled, checkDailyCap, getProductsAny } from '../../../lib/ai';

export async function POST(req: Request) {
  try {
    const { adminToken, force } = (await req.json().catch(() => ({}))) || {};
    assertAiEnabled(adminToken);

    const productIds = force ? await getProductsAny(20) : await getProductsMissingAi(20);
    const results: Array<{ productId: string; url?: string; error?: string }> = [];

    for (const productId of productIds) {
      try {
        await checkDailyCap();
        const url = await generateAiOutfitImage(productId);
        await upsertAiPhoto(productId, url);
        results.push({ productId, url });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'failed';
        results.push({ productId, error: message });
      }
    }

    return NextResponse.json({ results });
  } catch (error: unknown) {
    console.error('AI refresh error', error);
    const message = error instanceof Error ? error.message : 'Refresh failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

