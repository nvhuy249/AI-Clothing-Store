import { NextResponse } from 'next/server';
import { generateAiOutfitImage, upsertAiPhoto, getProductsMissingAi, assertAiEnabled, checkDailyCap } from '../../../lib/ai';

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
      } catch (err: any) {
        results.push({ productId, error: err.message || 'failed' });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('AI refresh error', error);
    return NextResponse.json({ error: error.message || 'Refresh failed' }, { status: 500 });
  }
}
