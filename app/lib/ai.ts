import { fetchProductById } from './data';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const ENABLED = process.env.AI_IMAGES_ENABLED === 'true';
const DAILY_CAP = Number(process.env.AI_IMAGES_DAILY_CAP || '20');
const ADMIN_TOKEN = process.env.AI_IMAGES_ADMIN_TOKEN;

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
    `- Colour: ${product.colour ?? 'unspecified'} — keep this exact hue.`,
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
  await sql`DELETE FROM ai_generated_photos WHERE product_id = ${productId}`;
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
    LIMIT ${limit}
  `;
  return rows.map((r) => r.product_id);
}
