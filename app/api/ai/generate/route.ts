import { NextResponse } from 'next/server';
import { generateAiOutfitImage, upsertAiPhoto, assertAiEnabled, checkDailyCap } from '../../../lib/ai';

export async function POST(req: Request) {
  try {
    const { productId, adminToken } = await req.json();
    assertAiEnabled(adminToken);
    await checkDailyCap();

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const url = await generateAiOutfitImage(productId);
    await upsertAiPhoto(productId, url);

    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error('AI generate error', error);
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

