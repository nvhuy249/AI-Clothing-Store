import { getDb } from "./db";

export type ProductImportRow = {
  rowNumber: number;
  name: string;
  description: string | null;
  price: number | null;
  stock: number;
  colour: string | null;
  size: string | null;
  fit: string | null;
  material: string | null;
  photos: string[] | null;
  errors: string[];
};

export type ProductImportJob = {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  total_rows: number;
  processed_rows: number;
  inserted_rows: number;
  failed_rows: number;
  error: string | null;
  created_at: string;
  updated_at: string;
};

let importTableReady: Promise<void> | null = null;

export async function ensureProductImportTable() {
  importTableReady ??= getDb()`
    CREATE TABLE IF NOT EXISTS product_import_jobs (
      job_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      status VARCHAR(20) NOT NULL DEFAULT 'queued',
      payload JSONB NOT NULL,
      total_rows INTEGER NOT NULL DEFAULT 0,
      processed_rows INTEGER NOT NULL DEFAULT 0,
      inserted_rows INTEGER NOT NULL DEFAULT 0,
      failed_rows INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `.then(() => undefined);
  return importTableReady;
}

export function parseProductCsv(csv: string): ProductImportRow[] {
  const rows = parseCsv(csv);
  if (rows.length === 0) return [];

  const headers = rows[0].map((header) => normalizeHeader(header));
  return rows.slice(1).flatMap((rawRow, index) => {
    if (rawRow.every((cell) => !cell.trim())) return [];
    const record = new Map<string, string>();
    headers.forEach((header, cellIndex) => record.set(header, rawRow[cellIndex]?.trim() ?? ""));
    return validateProductImportRow(record, index + 2);
  });
}

function validateProductImportRow(record: Map<string, string>, rowNumber: number): ProductImportRow {
  const errors: string[] = [];
  const name = field(record, "name");
  const rawPrice = field(record, "price");
  const rawStock = field(record, "stock") || field(record, "stock_quantity") || "0";

  if (!name || name.length < 2) errors.push("Name is required.");

  const price = rawPrice ? Number(rawPrice) : null;
  if (price === null || !Number.isFinite(price) || price <= 0) errors.push("Price must be a positive number.");

  const stock = Number(rawStock);
  if (!Number.isInteger(stock) || stock < 0) errors.push("Stock must be a whole number of 0 or more.");

  const photos = splitPhotos(field(record, "photos") || field(record, "photo_urls"));
  if (photos?.some((url) => !/^https?:\/\//i.test(url))) {
    errors.push("Photo URLs must start with http:// or https://.");
  }

  return {
    rowNumber,
    name,
    description: nullable(field(record, "description")),
    price,
    stock: Number.isInteger(stock) && stock >= 0 ? stock : 0,
    colour: nullable(field(record, "colour") || field(record, "color")),
    size: nullable(field(record, "size")),
    fit: nullable(field(record, "fit")),
    material: nullable(field(record, "material")),
    photos,
    errors,
  };
}

export async function createProductImportJob(rows: ProductImportRow[]) {
  await ensureProductImportTable();
  const validRows = rows.filter((row) => row.errors.length === 0);
  const inserted = await getDb()<Array<{ job_id: string }>>`
    INSERT INTO product_import_jobs (payload, total_rows)
    VALUES (${JSON.stringify(validRows)}::jsonb, ${validRows.length})
    RETURNING job_id
  `;
  return inserted[0].job_id;
}

export async function fetchProductImportJob(jobId: string): Promise<ProductImportJob | null> {
  await ensureProductImportTable();
  const rows = await getDb()<ProductImportJob[]>`
    SELECT job_id, status, total_rows, processed_rows, inserted_rows, failed_rows, error, created_at, updated_at
    FROM product_import_jobs
    WHERE job_id = ${jobId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function processProductImportJob(jobId: string) {
  await ensureProductImportTable();
  const jobs = await getDb()<Array<{ payload: ProductImportRow[]; status: ProductImportJob["status"] }>>`
    SELECT payload, status
    FROM product_import_jobs
    WHERE job_id = ${jobId}
    LIMIT 1
  `;
  const job = jobs[0];
  if (!job || job.status !== "queued") return;

  await getDb()`
    UPDATE product_import_jobs
    SET status = 'processing', updated_at = CURRENT_TIMESTAMP
    WHERE job_id = ${jobId}
  `;

  let insertedRows = 0;
  let failedRows = 0;
  let processedRows = 0;

  try {
    for (const row of job.payload) {
      try {
        await getDb()`
          INSERT INTO products (name, description, price, stock_quantity, colour, size, fit, material, photos)
          VALUES (
            ${row.name},
            ${row.description},
            ${row.price},
            ${row.stock},
            ${row.colour},
            ${row.size},
            ${row.fit},
            ${row.material},
            ${row.photos ?? []}
          )
        `;
        insertedRows += 1;
      } catch {
        failedRows += 1;
      } finally {
        processedRows += 1;
        await getDb()`
          UPDATE product_import_jobs
          SET processed_rows = ${processedRows}, inserted_rows = ${insertedRows}, failed_rows = ${failedRows}, updated_at = CURRENT_TIMESTAMP
          WHERE job_id = ${jobId}
        `;
      }
    }

    await getDb()`
      UPDATE product_import_jobs
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE job_id = ${jobId}
    `;
  } catch (error) {
    await getDb()`
      UPDATE product_import_jobs
      SET status = 'failed', error = ${error instanceof Error ? error.message : "Import failed"}, updated_at = CURRENT_TIMESTAMP
      WHERE job_id = ${jobId}
    `;
  }
}

function field(record: Map<string, string>, key: string) {
  return record.get(key)?.trim() ?? "";
}

function nullable(value: string) {
  return value ? value : null;
}

function splitPhotos(value: string) {
  const photos = value
    .split(/[|;]/)
    .map((url) => url.trim())
    .filter(Boolean);
  return photos.length > 0 ? photos : null;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((csvRow) => csvRow.some((value) => value.trim()));
}
