import { StorageClient } from '@supabase/storage-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'ai-images';

export function hasSupabaseStorage() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

export async function uploadBase64PngToSupabase(base64: string, path: string, options?: { public?: boolean }): Promise<string> {
  if (!hasSupabaseStorage()) throw new Error('Supabase storage env vars missing');
  const client = new StorageClient(`${SUPABASE_URL!}/storage/v1`, {
    apikey: SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`,
  });
  const buf = Buffer.from(base64, 'base64');
  const { data, error } = await client.from(SUPABASE_BUCKET).upload(path, buf, {
    contentType: 'image/png',
    upsert: true,
  });
  if (error) throw error;
  if (options?.public) {
    const { data: pub } = client.from(SUPABASE_BUCKET).getPublicUrl(data.path);
    return pub.publicUrl;
  }
  // signed URL for private buckets
  const { data: signed, error: signErr } = await client.from(SUPABASE_BUCKET).createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7 days
  if (signErr) throw signErr;
  return signed.signedUrl;
}

export async function uploadBufferToSupabase(
  buf: Buffer,
  path: string,
  contentType = 'image/png',
  options?: { public?: boolean; expiresIn?: number },
): Promise<string> {
  if (!hasSupabaseStorage()) throw new Error('Supabase storage env vars missing');
  const client = new StorageClient(`${SUPABASE_URL!}/storage/v1`, {
    apikey: SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`,
  });
  const { data, error } = await client.from(SUPABASE_BUCKET).upload(path, buf, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  if (options?.public) {
    const { data: pub } = client.from(SUPABASE_BUCKET).getPublicUrl(data.path);
    return pub.publicUrl;
  }
  const expiresIn = options?.expiresIn ?? 60 * 60 * 24 * 7;
  const { data: signed, error: signErr } = await client.from(SUPABASE_BUCKET).createSignedUrl(data.path, expiresIn);
  if (signErr) throw signErr;
  return signed.signedUrl;
}

