import { fetchProductById } from './data';
import postgres from 'postgres';
import sharp from 'sharp';
import { hasSupabaseStorage, uploadBase64PngToSupabase } from './storage';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const ENABLED = process.env.AI_IMAGES_ENABLED === 'true';
const DAILY_CAP = Number(process.env.AI_IMAGES_DAILY_CAP || '20');
const ADMIN_TOKEN = process.env.AI_IMAGES_ADMIN_TOKEN;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_IMG_SIZE = 1024;

export function assertAiEnabled(adminToken?: string) {
  if (!ENABLED) {
    throw new Error('AI image generation disabled (set AI_IMAGES_ENABLED=true)');
  }
  if (ADMIN_TOKEN && adminToken !== ADMIN_TOKEN) {
    throw new Error('Unauthorized: invalid admin token');
  }
}

export async function checkDailyCap() {
  if (!DAILY_CAP || DAILY_CAP <= 0) return;
  const today = new Date().toISOString().slice(0, 10);
  const rows = await sql<{ cnt: number }[]>`
    SELECT COUNT(*)::int AS cnt
    FROM ai_generated_photos
    WHERE created_at::date = ${today}::date
  `;
  if (rows[0]?.cnt >= DAILY_CAP) {
    throw new Error(`Daily AI generation cap reached (${DAILY_CAP})`);
  }
}

export async function generateAiOutfitImage(productId: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required to generate AI images.');
  }

  const product = await fetchProductById(productId);
  if (!product) throw new Error('Product not found');

  const desc = (product.description || '').trim();
  const fit = (product.fit || '').trim();
  const material = (product.material || '').trim();
  const prompt = [
    `E-commerce studio photo, must exactly match the real garment silhouette and details.`,
    `Full-body model, neutral pose, facing camera, balanced lighting, clean light-gray background.`,
    `Product facts (follow precisely, no creative changes):`,
    `- Name: "${product.name}"`,
    `- Brand: ${product.brand_name ?? 'Unbranded'}`,
    `- Category: ${product.category_name ?? 'Apparel'}${product.subcategory_name ? ` / ${product.subcategory_name}` : ''}`,
    `- Colour: ${product.colour ?? 'unspecified'} â€” keep this exact hue.`,
    `- Size shown: ${product.size ?? 'standard sample size'}.`,
    fit ? `- Fit / cut: ${fit} (keep leg width/shape consistent; do not slim or taper if marked baggy/loose).` : '',
    material ? `- Material: ${material}.` : '',
    desc ? `- Description notes: ${desc}` : '',
    `Hard constraints: no extra accessories, no pattern or color changes, keep any implied logos only, realistic fabric texture, respect the stated fit and silhouette.`
  ].filter(Boolean).join(' ');

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
      quality: 'high',
      n: 1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI image generation failed: ${err}`);
  }

  const data = await response.json();
  const url = data?.data?.[0]?.url;
  const b64 = data?.data?.[0]?.b64_json;

  if (url) return url;
  if (b64) return `data:image/png;base64,${b64}`;

  throw new Error(`No image URL returned from OpenAI. Raw response: ${JSON.stringify(data)}`);
}

export async function upsertAiPhoto(productId: string, imageUrl: string) {
  // Replace existing AI photos for this product to keep the latest, avoiding gallery clutter
  if (productId) {
    await sql`DELETE FROM ai_generated_photos WHERE product_id = ${productId}`;
  }
  await sql`
    INSERT INTO ai_generated_photos (customer_id, product_id, image_url, ai_model_version)
    VALUES (NULL, ${productId}, ${imageUrl}, 'gpt-image-1')
    ON CONFLICT (photo_id) DO NOTHING;
  `;
}

export async function getProductsMissingAi(limit = 10): Promise<string[]> {
  const rows = await sql<{ product_id: string }[]>`
    SELECT p.product_id
    FROM products p
    LEFT JOIN ai_generated_photos a ON a.product_id = p.product_id
    WHERE a.product_id IS NULL
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => r.product_id);
}

export async function getProductsAny(limit = 10): Promise<string[]> {
  const rows = await sql<{ product_id: string }[]>`
    SELECT product_id
    FROM products
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => r.product_id);
}

export async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch init image: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString('base64');
}

export async function resizeBase64ToPng(
  base64: string,
  width = 1024,
  height = 1024,
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' = 'cover',
  background: { r: number; g: number; b: number; alpha?: number } = { r: 255, g: 255, b: 255, alpha: 255 },
): Promise<string> {
  const input = Buffer.from(base64, 'base64');
  const output = await sharp(input)
    .resize(width, height, { fit, background })
    .png()
    .toBuffer();
  return output.toString('base64');
}

export function pngBlobFromBase64(base64: string): Blob {
  const buf = Buffer.from(base64, 'base64');
  const uint8 = new Uint8Array(buf);
  return new Blob([uint8], { type: 'image/png' });
}

export function pngBlobFromBuffer(buf: Buffer): Blob {
  const uint8 = new Uint8Array(buf);
  return new Blob([uint8], { type: 'image/png' });
}

function inferMaskMode(product: Awaited<ReturnType<typeof fetchProductById>>): 'upper' | 'lower' | 'full' | 'belt' {
  const name = `${product?.name || ''} ${product?.category_name || ''} ${product?.subcategory_name || ''}`.toLowerCase();
  const lower = ['jean', 'pant', 'trouser', 'short', 'skirt', 'bottom'];
  const upper = ['shirt', 'top', 'tee', 't-shirt', 'hoodie', 'sweater', 'jacket', 'coat', 'outerwear', 'blazer', 'sweatshirt'];
  if (name.includes('belt')) return 'belt';
  if (lower.some((k) => name.includes(k))) return 'lower';
  if (upper.some((k) => name.includes(k))) return 'upper';
  return 'full';
}

async function buildMaskPng(mode: 'upper' | 'lower' | 'full' | 'belt', size = DEFAULT_IMG_SIZE): Promise<Buffer> {
  // Black keep area, white replace area (Stability inpaint expects white to modify)
  const base = {
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  } as const;

  // Default rectangle placements (rough, but consistent)
  const rects: Record<'upper' | 'lower' | 'full' | 'belt', { left: number; top: number; width: number; height: number }> = {
    upper: { left: size * 0.18, top: size * 0.16, width: size * 0.64, height: size * 0.44 },
    // widen lower mask to preserve baggy/loose silhouettes
    lower: { left: size * 0.18, top: size * 0.42, width: size * 0.64, height: size * 0.55 },
    belt: { left: size * 0.18, top: size * 0.45, width: size * 0.64, height: size * 0.18 },
    full: { left: size * 0.2, top: size * 0.14, width: size * 0.62, height: size * 0.75 },
  };

  const rect = rects[mode];
  const whiteRect = await sharp({
    create: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer();

  return sharp(base)
    .composite([{ input: whiteRect, left: Math.round(rect.left), top: Math.round(rect.top) }])
    .png()
    .toBuffer();
}

export async function generateBaseModelImages(count = 4): Promise<string[]> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required to generate base models.');

  const prompt =
    'Photorealistic full-body fashion model, head-to-toe fully visible (no cropping), neutral standing pose, plain light-gray studio background, soft even lighting, wearing a tight neutral bodysuit with no logos or accessories, realistic skin and proportions. Gender-ambiguous, neutral look.';

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
      n: Math.min(Math.max(count, 1), 8),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI base model generation failed: ${err}`);
  }

  const data = await response.json();
  const urls: string[] =
    (data?.data as Array<{ url?: string; b64_json?: string }> | undefined)
      ?.map((d) => d.url || (d.b64_json && `data:image/png;base64,${d.b64_json}`))
      ?.filter((u): u is string => Boolean(u)) || [];
  if (!urls.length) throw new Error('No base model images returned.');

  for (const url of urls) {
    await sql`
      INSERT INTO ai_generated_photos (customer_id, product_id, image_url, ai_model_version)
      VALUES (NULL, NULL, ${url}, 'base-model')
      ON CONFLICT (photo_id) DO NOTHING;
    `;
  }
  return urls;
}

export async function generateStabilityBaseModelImages(count = 4): Promise<string[]> {
  if (!STABILITY_API_KEY) throw new Error('STABILITY_API_KEY is required to generate base models via Stability.');

  const urls: string[] = [];
  const total = Math.min(Math.max(count, 1), 8);

  for (let i = 0; i < total; i++) {
    const gender = i % 2 === 0 ? 'female' : 'male';
    const prompt = `Photorealistic full-body ${gender} fashion model, head-to-toe fully visible (include feet), centered, no cropping, neutral standing pose, plain light-gray studio background, soft even lighting, fully clothed in a simple long-sleeve top and full-length pants (no skin-tight clothing), no logos or accessories, professional studio look, realistic proportions.`;

    const form = new FormData();
    form.append('prompt', prompt);
    form.append('output_format', 'png');
    // Let API choose size; we'll pad to portrait after
    const resp = await fetch('https://api.stability.ai/v2beta/stable-image/generate/ultra', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STABILITY_API_KEY}`,
        Accept: 'application/json',
      },
      body: form,
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Stability base model generation failed: ${err}`);
    }
    const data = await resp.json();
    const b64 = data?.image || data?.artifacts?.[0]?.base64;
    if (!b64) throw new Error('No image returned from Stability.');
    // Post-pad to portrait with contain to avoid crops
    const padded = await resizeBase64ToPng(b64, 768, 1024, 'contain');

    let finalUrl = `data:image/png;base64,${padded}`;
    if (hasSupabaseStorage()) {
      const key = `base-models/${gender}-${Date.now()}-${i}.png`;
      try {
        finalUrl = await uploadBase64PngToSupabase(padded, key);
      } catch (e) {
        console.warn('Supabase upload failed, keeping data URL', e);
      }
    }

    urls.push(finalUrl);
    await sql`
      INSERT INTO ai_generated_photos (customer_id, product_id, image_url, ai_model_version)
      VALUES (NULL, NULL, ${finalUrl}, ${'base-model-stability-' + gender})
      ON CONFLICT (photo_id) DO NOTHING;
    `;
  }
  return urls;
}

export async function getLatestBaseModelUrl(gender?: 'male' | 'female'): Promise<string | null> {
  if (gender) {
    const g = await sql<{ image_url: string }[]>`
      SELECT image_url
      FROM ai_generated_photos
      WHERE product_id IS NULL AND ai_model_version = ${'base-model-stability-' + gender}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (g[0]?.image_url) return g[0].image_url;
  }
  const rows = await sql<{ image_url: string }[]>`
    SELECT image_url
    FROM ai_generated_photos
    WHERE product_id IS NULL AND ai_model_version IN ('base-model', 'base-model-stability', 'base-model-stability-male', 'base-model-stability-female')
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return rows[0]?.image_url || null;
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function generateStabilityImage(productId: string): Promise<string> {
  if (!STABILITY_API_KEY) throw new Error('STABILITY_API_KEY is required for Stability AI generation.');

  const product = await fetchProductById(productId);
  if (!product) throw new Error('Product not found');

  const desc = (product.description || '').trim();
  const fit = (product.fit || '').trim();
  const material = (product.material || '').trim();
  const refPhoto = (product.photos && product.photos[0]) || '';
  const gender =
    (product.category_name || '').toLowerCase().includes('women') ||
    (product.subcategory_name || '').toLowerCase().includes('women')
      ? 'female'
      : (product.category_name || '').toLowerCase().includes('men') ||
        (product.subcategory_name || '').toLowerCase().includes('men')
      ? 'male'
      : 'unisex';
  const prompt = [
    `Full-body photo of a ${gender} fashion model wearing the garment. Include head, torso, arms, legs; neutral standing pose; clean light-gray background; balanced studio lighting.`,
    `Match the real garment exactly (silhouette, colour, fabric).`,
    `Facts:`,
    `- Name: "${product.name}"`,
    `- Brand: ${product.brand_name ?? 'Unbranded'}`,
    `- Category: ${product.category_name ?? 'Apparel'}${product.subcategory_name ? ` / ${product.subcategory_name}` : ''}`,
    `- Colour: ${product.colour ?? 'unspecified'} (keep exact hue).`,
    `- Size shown: ${product.size ?? 'sample size'}.`,
    fit ? `- Fit/cut: ${fit} (preserve silhouette; do not slim/taper if loose/baggy).` : '',
    material ? `- Material: ${material}.` : '',
    desc ? `- Notes: ${desc}` : '',
    refPhoto ? `- Reference image URL (match this garment): ${refPhoto}` : '',
    `Keep logos minimal as implied; no design changes; no extra accessories.`
  ].filter(Boolean).join(' ');

  const negativePrompt = [
    'deformed, low-res, extra limbs, text, watermark',
    'flat lay, isolated product, product-only, no-human, ghost mannequin, mannequin, dress form, floating garment',
    'color shifts, pattern changes, logo changes'
  ].join(', ');

  const initImageUrl = (product.photos && product.photos[0]) || '';
  if (!initImageUrl) throw new Error('No source product image available for img2img.');

  const base64Orig = await fetchImageAsBase64(initImageUrl);
  const base64 = await resizeBase64ToPng(base64Orig, 1024, 1024); // ensure valid SDXL size
  const form = new FormData();
  const imageBlob = pngBlobFromBase64(base64);

  form.append('image', imageBlob as Blob, 'init.png');
  form.append('prompt', prompt);
  form.append('negative_prompt', negativePrompt);
  form.append('strength', '0.7'); // higher strength to allow adding the model
  form.append('output_format', 'png');

  const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/ultra', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STABILITY_API_KEY}`,
      Accept: 'application/json',
    },
    body: form,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(
      `Stability generation failed (${response.status} ${response.statusText}): ${err || 'no response text'}`,
    );
  }

  const data = await response.json();
  const b64 = data?.image || data?.artifacts?.[0]?.base64;
  if (!b64) throw new Error(`No image returned from Stability. Raw: ${JSON.stringify(data)}`);
  return `data:image/png;base64,${b64}`;
}

export async function generateStabilityImageForBase(
  product: Awaited<ReturnType<typeof fetchProductById>>,
  baseImageUrl: string,
): Promise<string> {
  if (!STABILITY_API_KEY) throw new Error('STABILITY_API_KEY is required for Stability AI generation.');
  if (!product) throw new Error('Product not found');

  const desc = (product.description || '').trim();
  const fit = (product.fit || '').trim();
  const material = (product.material || '').trim();
  const gender =
    (product.category_name || '').toLowerCase().includes('women') ||
    (product.subcategory_name || '').toLowerCase().includes('women')
      ? 'female'
      : (product.category_name || '').toLowerCase().includes('men') ||
        (product.subcategory_name || '').toLowerCase().includes('men')
      ? 'male'
      : 'unisex';
  // Extract dominant colour from product photo for tighter color guidance
  const refPhoto = (product.photos && product.photos[0]) || '';
  let hexColor = product.colour || '';
  if (!hexColor && refPhoto) {
    try {
      const refBuf = await fetchImageBuffer(refPhoto);
      const stats = await sharp(refBuf).stats();
      const c = stats.dominant;
      hexColor = `#${c.r.toString(16).padStart(2, '0')}${c.g
        .toString(16)
        .padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`;
    } catch {
      // ignore if color extraction fails
    }
  }
  const prompt = [
    `Full-body photo of a ${gender} fashion model wearing the garment. Include head, torso, arms, legs; neutral standing pose; clean light-gray background; balanced studio lighting.`,
    `Match the real garment exactly (silhouette, colour, fabric). Preserve garment width and shape; do not change fit.`,
    `Facts:`,
    `- Name: "${product.name}"`,
    `- Brand: ${product.brand_name ?? 'Unbranded'}`,
    `- Category: ${product.category_name ?? 'Apparel'}${product.subcategory_name ? ` / ${product.subcategory_name}` : ''}`,
    `- Colour: ${product.colour ?? 'unspecified'}${hexColor ? ` (exact hex ${hexColor}, no hue shift)` : ' (keep exact hue)'}.`,
    `- Size shown: ${product.size ?? 'sample size'}.`,
    fit
      ? `- Fit/cut: ${fit}. If baggy/loose/relaxed: keep wide leg and roomy silhouette, no tapering or slimming. If oversized: keep volume. If slim: follow slim.`
      : '',
    material ? `- Material: ${material}.` : '',
    desc ? `- Notes: ${desc}` : '',
    refPhoto ? `- Reference image URL (match this garment): ${refPhoto}` : '',
    `Keep logos minimal as implied; no design changes; no extra accessories.`
  ].filter(Boolean).join(' ');

  const negativePrompt = [
    'deformed, low-res, extra limbs, text, watermark',
    'flat lay, isolated product, product-only, no-human, ghost mannequin, mannequin, dress form, floating garment',
    'color shifts, pattern changes, logo changes, beige, tan',
    'skinny fit, slim fit, tapered leg, tight pants, leggings'
  ].join(', ');

  const base64Orig = baseImageUrl.startsWith('data:image')
    ? baseImageUrl.replace(/^data:image\/png;base64,/, '')
    : await fetchImageAsBase64(baseImageUrl);
  const base64 = await resizeBase64ToPng(base64Orig, DEFAULT_IMG_SIZE, DEFAULT_IMG_SIZE);

  const maskMode = inferMaskMode(product);
  const maskBuf = await buildMaskPng(maskMode, DEFAULT_IMG_SIZE);

  const form = new FormData();
  const imgFile = pngBlobFromBase64(base64);
  const maskFile = pngBlobFromBuffer(maskBuf);

  form.append('image', imgFile as Blob, 'base.png');
  form.append('mask', maskFile as Blob, 'mask.png');
  form.append('prompt', prompt);
  form.append('negative_prompt', negativePrompt);
  form.append('strength', '0.35'); // allow garment width changes while keeping body/pose
  form.append('output_format', 'png');

  const response = await fetch('https://api.stability.ai/v2beta/stable-image/edit/inpaint', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STABILITY_API_KEY}`,
      Accept: 'application/json',
    },
    body: form,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(
      `Stability generation failed (${response.status} ${response.statusText}): ${err || 'no response text'}`,
    );
  }

  const data = await response.json();
  const b64 = data?.image || data?.artifacts?.[0]?.base64;
  if (!b64) throw new Error(`No image returned from Stability. Raw: ${JSON.stringify(data)}`);
  return `data:image/png;base64,${b64}`;
}





