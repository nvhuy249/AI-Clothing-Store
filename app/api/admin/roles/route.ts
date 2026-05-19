import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "../../../lib/auth";
import { grantRoleByEmail, isAdminEmail, listAdminUsers, revokeRole } from "../../../lib/roles";

const grantSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "moderator"]),
});

const revokeSchema = z.object({
  customerId: z.string().uuid(),
  role: z.enum(["admin", "moderator", "customer"]),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(await isAdminEmail(session?.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ users: await listAdminUsers() });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(await isAdminEmail(session?.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = grantSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const customerId = await grantRoleByEmail(parsed.data.email, parsed.data.role);
  if (!customerId) {
    return NextResponse.json({ error: "Customer not found. The user must sign up first." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, customerId });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(await isAdminEmail(session?.user?.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = revokeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  await revokeRole(parsed.data.customerId, parsed.data.role);
  return NextResponse.json({ ok: true });
}
