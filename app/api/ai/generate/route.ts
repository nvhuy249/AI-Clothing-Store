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
  } catch (error: any) {
    console.error('AI generate error', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
