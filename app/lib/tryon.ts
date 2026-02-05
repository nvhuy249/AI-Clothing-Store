import postgres from 'postgres';
import { fetchProductById } from './data';
import {
  fetchImageAsBase64,
  resizeBase64ToPng,
  getLatestBaseModelUrl,
  checkDailyCap,
  upsertAiPhoto,
  generateStabilityBaseModelImages,
  generateStabilityImageForBase,
} from './ai';
import { hasSupabaseStorage, uploadBase64PngToSupabase, uploadBufferToSupabase } from './storage';

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

type VitonInput = {
  humanImage: string; // base64 or URL
  clothImage: string; // base64 or URL
  clothType?: 'upper_body' | 'lower_body' | 'dresses';
  garmentDesc?: string;
  forceDc?: boolean;
};

async function persistProductImage(sourceUrl: string, productId: string): Promise<string> {
  // If Supabase storage configured, upload and return stable URL; else return source.
  if (!hasSupabaseStorage()) return sourceUrl;

  try {
    if (sourceUrl.startsWith('data:image')) {
      const b64 = sourceUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
      const key = `products/${productId}-${Date.now()}.png`;
      return await uploadBase64PngToSupabase(b64, key);
    }
    // fetch binary
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`fetch failed ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get('content-type') || 'image/png';
    const ext = ct.includes('jpeg') ? 'jpg' : ct.includes('jpg') ? 'jpg' : 'png';
    const key = `products/${productId}-${Date.now()}.${ext}`;
    return await uploadBufferToSupabase(buf, key, ct);
  } catch (e) {
    console.warn('Supabase upload failed, using source URL', e);
    return sourceUrl;
  }
}

async function insertUserAiPhoto(productId: string, customerId: string | null, imageUrl: string, model: string) {
  await sql`
    INSERT INTO ai_generated_photos (customer_id, product_id, image_url, ai_model_version)
    VALUES (${customerId}, ${productId}, ${imageUrl}, ${model})
    ON CONFLICT (photo_id) DO NOTHING
  `;
}

async function fetchBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
  const ct = res.headers.get('content-type') || 'image/png';
  const buf = Buffer.from(await res.arrayBuffer());
  return { buffer: buf, contentType: ct };
}

async function persistUserTryonImage(sourceUrl: string, productId: string, customerId: string | null): Promise<string> {
  if (!hasSupabaseStorage()) return sourceUrl;
  try {
    if (sourceUrl.startsWith('data:image')) {
      const b64 = sourceUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
    const key = `user-tryon/${customerId || 'anon'}-${productId}-${Date.now()}.png`;
    return await uploadBase64PngToSupabase(b64, key, { public: false });
  }
  const { buffer, contentType } = await fetchBuffer(sourceUrl);
  const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
  const key = `user-tryon/${customerId || 'anon'}-${productId}-${Date.now()}.${ext}`;
  return await uploadBufferToSupabase(buffer, key, contentType, { public: false, expiresIn: 60 * 60 * 24 * 7 });
} catch (e) {
  console.warn('Supabase upload failed (user tryon), using source URL', e);
  return sourceUrl;
}
}

async function runReplicateViton(input: VitonInput): Promise<string> {
  if (!REPLICATE_TOKEN) throw new Error('REPLICATE_API_TOKEN is required for VITON try-on.');

  const model = 'cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985';

  const resp = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${REPLICATE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: model,
      input: {
        human_img: input.humanImage,
        garm_img: input.clothImage,
        category: input.clothType || 'upper_body',
        garment_des: input.garmentDesc || '',
        seed: 42,
        n_samples: 1,
        force_dc: input.forceDc ?? (input.clothType === 'dresses'),
        crop: input.clothType === 'dresses' ? false : true, // keep dress length; crop others to 3:4 if needed
      },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Replicate VITON request failed: ${err}`);
  }
  const data = await resp.json();
  const predictionUrl = data?.urls?.get;
  if (!predictionUrl) throw new Error('Missing prediction URL from Replicate.');

  // Poll until completed (small delay to avoid throttling)
  await new Promise((res) => setTimeout(res, 1200));
  for (;;) {
    const r = await fetch(predictionUrl, {
      headers: { Authorization: `Token ${REPLICATE_TOKEN}` },
    });
    if (!r.ok) {
      const e = await r.text();
      throw new Error(`Replicate poll failed: ${e}`);
    }
    const state = await r.json();
    if (state.status === 'succeeded') {
      const output = state.output;
      const url = Array.isArray(output) ? output[0] : output;
      if (!url) throw new Error('Replicate returned no output image.');
      return url;
    }
    if (state.status === 'failed' || state.status === 'canceled') {
      throw new Error(`Replicate failed: ${state.error || state.status}`);
    }
    await new Promise((res) => setTimeout(res, 1500));
  }
}

function inferClothType(product: Awaited<ReturnType<typeof fetchProductById>>): VitonInput['clothType'] {
  const name = `${product?.name || ''} ${product?.category_name || ''} ${product?.subcategory_name || ''}`.toLowerCase();
  if (name.includes('dress')) return 'dresses';
  const lower = ['jean', 'pant', 'trouser', 'short', 'skirt', 'bottom'];
  if (lower.some((k) => name.includes(k))) return 'lower_body';
  return 'upper_body';
}

function inferGender(product: Awaited<ReturnType<typeof fetchProductById>>): 'male' | 'female' | 'unisex' {
  const name = `${product?.name || ''} ${product?.category_name || ''} ${product?.subcategory_name || ''}`.toLowerCase();
  if (name.includes('women')) return 'female';
  if (name.includes('men')) return 'male';
  return 'unisex';
}

function isBelt(product: Awaited<ReturnType<typeof fetchProductById>>): boolean {
  const name = `${product?.name || ''} ${product?.category_name || ''} ${product?.subcategory_name || ''}`.toLowerCase();
  return name.includes('belt');
}

export async function dressProductWithViton(productId: string, baseModelUrl?: string): Promise<string> {
  if (!REPLICATE_TOKEN) throw new Error('REPLICATE_API_TOKEN is required.');
  await checkDailyCap();

  const product = await fetchProductById(productId);
  if (!product) throw new Error('Product not found');

  const clothUrl = (product.photos && product.photos[0]) || '';
  if (!clothUrl) throw new Error('Product has no photo to use as garment.');

  const gender = inferGender(product);
  const humanUrlPrimary = baseModelUrl || (await getLatestBaseModelUrl(gender === 'unisex' ? undefined : gender));
  const humanUrlFallback = gender === 'male' ? await getLatestBaseModelUrl('female') : await getLatestBaseModelUrl('male');
  const humanUrl = humanUrlPrimary || humanUrlFallback;
  if (!humanUrl) throw new Error('No base model available. Generate base models first.');

  // Belts: use Stability inpaint instead of VITON
  if (isBelt(product)) {
    const url = await generateStabilityImageForBase(product, humanUrl);
    const finalUrl = await persistProductImage(url, productId);
    await upsertAiPhoto(productId, finalUrl);
    return finalUrl;
  }

  // VITON accepts URLs; only convert to data URI if needed.
  const clothInput = clothUrl.startsWith('http') ? clothUrl : `data:image/png;base64,${await resizeBase64ToPng(await fetchImageAsBase64(clothUrl), 768, 1024, 'contain')}`;
  let humanInput = humanUrl.startsWith('http') ? humanUrl : `data:image/png;base64,${await resizeBase64ToPng(await fetchImageAsBase64(humanUrl), 768, 1024, 'contain')}`;

  const clothType = inferClothType(product);
  const fitNote =
    product.fit && product.fit.toLowerCase().match(/baggy|loose|relaxed/)
      ? 'baggy/loose fit: wide leg, roomy silhouette, no taper'
      : product.fit && product.fit.toLowerCase().match(/slim|skinny/)
      ? 'slim fit'
      : '';

  const lengthNote =
    clothType === 'dresses'
      ? (product.description || product.name || '').toLowerCase().includes('midi')
        ? 'midi length dress'
        : (product.description || product.name || '').toLowerCase().includes('maxi')
        ? 'maxi length dress'
        : (product.description || product.name || '').toLowerCase().includes('mini')
        ? 'mini length dress'
        : 'knee-length dress'
      : '';

  const garmentDesc = [
    product.name,
    product.colour ? `color ${product.colour}` : '',
    fitNote || (product.fit ? `fit ${product.fit}` : ''),
    product.material ? `material ${product.material}` : '',
    lengthNote,
    product.description || '',
    'avoid changing silhouette; keep stated fit and length; no turning belt into jacket; do not slim wide legs',
  ]
    .filter(Boolean)
    .join(', ');

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const outputUrl = await runReplicateViton({
        humanImage: humanInput,
        clothImage: clothInput,
        clothType,
        garmentDesc,
      });
      const finalUrl = await persistProductImage(outputUrl, productId);
      await upsertAiPhoto(productId, finalUrl);
      return finalUrl;
    } catch (err) {
      lastError = err;
      // If first attempt with primary base model fails, retry once with fallback (if different)
      if (attempt === 0 && humanUrlFallback && humanUrlFallback !== humanUrlPrimary) {
        // swap to fallback for next loop
        const altHuman = humanUrlFallback;
        const altHumanInput = altHuman.startsWith('http')
          ? altHuman
          : `data:image/png;base64,${await resizeBase64ToPng(await fetchImageAsBase64(altHuman), 768, 1024, 'contain')}`;
        // mutate for next attempt
        humanInput = altHumanInput;
        continue;
      }
      break;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error('VITON try-on failed');
}

export { generateStabilityBaseModelImages };

export async function dressUserWithTryon(
  product: Awaited<ReturnType<typeof fetchProductById>>,
  humanUrl: string,
  customerId: string | null,
): Promise<string> {
  if (!product) throw new Error('Product not found');
  // Belts: Stability inpaint
  if (isBelt(product)) {
    const url = await generateStabilityImageForBase(product, humanUrl);
    const finalUrl = await persistUserTryonImage(url, product.product_id, customerId);
    await insertUserAiPhoto(product.product_id, customerId, finalUrl, 'stability-user');
    return finalUrl;
  }

  const clothUrl = (product.photos && product.photos[0]) || '';
  if (!clothUrl) throw new Error('Product has no photo to use as garment.');

  const clothType = inferClothType(product);
  const fitNote =
    product.fit && product.fit.toLowerCase().match(/baggy|loose|relaxed/)
      ? 'baggy/loose fit: wide leg, roomy silhouette, no taper'
      : product.fit && product.fit.toLowerCase().match(/slim|skinny/)
      ? 'slim fit'
      : '';

  const lengthNote =
    clothType === 'dresses'
      ? (product.description || product.name || '').toLowerCase().includes('midi')
        ? 'midi length dress'
        : (product.description || product.name || '').toLowerCase().includes('maxi')
        ? 'maxi length dress'
        : (product.description || product.name || '').toLowerCase().includes('mini')
        ? 'mini length dress'
        : 'knee-length dress'
      : '';

  const garmentDesc = [
    product.name,
    product.colour ? `color ${product.colour}` : '',
    fitNote || (product.fit ? `fit ${product.fit}` : ''),
    product.material ? `material ${product.material}` : '',
    lengthNote,
    product.description || '',
    'avoid changing silhouette; keep stated fit and length; no turning belt into jacket; do not slim wide legs',
  ]
    .filter(Boolean)
    .join(', ');

  const clothInput = clothUrl.startsWith('http')
    ? clothUrl
    : `data:image/png;base64,${await resizeBase64ToPng(await fetchImageAsBase64(clothUrl), 768, 1024, 'contain')}`;
  const humanInput = humanUrl;

  const outputUrl = await runReplicateViton({
    humanImage: humanInput,
    clothImage: clothInput,
    clothType,
    garmentDesc,
  });
  const finalUrl = await persistUserTryonImage(outputUrl, product.product_id, customerId);
    await insertUserAiPhoto(product.product_id, customerId, finalUrl, 'viton-user');
    return finalUrl;
  }




