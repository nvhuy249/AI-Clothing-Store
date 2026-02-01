import { NextResponse } from 'next/server';
import { assertAiEnabled, checkDailyCap, generateBaseModelImages } from '../../../lib/ai';

export async function POST(req: Request) {
  try {
    const { adminToken, count = 4 } = (await req.json().catch(() => ({}))) || {};
    assertAiEnabled(adminToken);
    await checkDailyCap();
    const urls = await generateBaseModelImages(count);
    return NextResponse.json({ urls });
  } catch (error: any) {
    console.error('Base model generation error', error);
    return NextResponse.json({ error: error.message || 'Failed to generate base models' }, { status: 500 });
  }
}
