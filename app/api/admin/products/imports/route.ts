import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "../../../../lib/auth";
import {
  createProductImportJob,
  fetchProductImportJob,
  parseProductCsv,
  processProductImportJob,
} from "../../../../lib/product-imports";
import { isAdminEmail } from "../../../../lib/roles";

const startSchema = z.object({
  rows: z.array(
    z.object({
      rowNumber: z.number(),
      name: z.string(),
      description: z.string().nullable(),
      price: z.number(),
      stock: z.number(),
      colour: z.string().nullable(),
      size: z.string().nullable(),
      fit: z.string().nullable(),
      material: z.string().nullable(),
      photos: z.array(z.string()).nullable(),
      errors: z.array(z.string()),
    }),
  ),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(await isAdminEmail(session?.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const job = await fetchProductImportJob(jobId);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({ job });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(await isAdminEmail(session?.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "CSV file required" }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "Upload a .csv file" }, { status: 415 });
    }
    const csv = await file.text();
    const rows = parseProductCsv(csv);
    const validCount = rows.filter((row) => row.errors.length === 0).length;
    return NextResponse.json({
      rows,
      summary: {
        total: rows.length,
        valid: validCount,
        invalid: rows.length - validCount,
      },
    });
  }

  const parsed = startSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const validRows = parsed.data.rows.filter((row) => row.errors.length === 0);
  if (validRows.length === 0) {
    return NextResponse.json({ error: "No valid rows to import" }, { status: 400 });
  }

  const jobId = await createProductImportJob(validRows);
  setTimeout(() => {
    processProductImportJob(jobId).catch((error) => console.error("Product import job failed", error));
  }, 0);

  return NextResponse.json({ jobId }, { status: 202 });
}
