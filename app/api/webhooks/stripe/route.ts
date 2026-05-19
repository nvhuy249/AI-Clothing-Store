import crypto from "crypto";
import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";
import { createOrderFromItems, type CheckoutOrderItem } from "../../../lib/order-fulfillment";

export const runtime = "nodejs";

type StripeCheckoutSession = {
  id: string;
  payment_status?: string;
  metadata?: {
    pending_checkout_id?: string;
  };
};

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature || !verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as { id: string; type: string; data: { object: unknown } };
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as StripeCheckoutSession;
  if (session.payment_status && session.payment_status !== "paid") {
    return NextResponse.json({ received: true, skipped: "not paid" });
  }

  const pendingCheckoutId = session.metadata?.pending_checkout_id;
  if (!pendingCheckoutId) {
    return NextResponse.json({ error: "Missing pending checkout metadata" }, { status: 400 });
  }

  const pendingRows = await getDb()<
    Array<{
      pending_checkout_id: string;
      customer_id: string;
      customer_email: string;
      customer_name: string;
      items: CheckoutOrderItem[];
      shipping_address: string | null;
      phone: string | null;
      note: string | null;
      status: string;
      order_id: string | null;
    }>
  >`
    SELECT
      pending_checkout_id,
      customer_id,
      customer_email,
      customer_name,
      items,
      shipping_address,
      phone,
      note,
      status,
      order_id
    FROM pending_checkouts
    WHERE pending_checkout_id = ${pendingCheckoutId}
    LIMIT 1
  `;

  const pending = pendingRows[0];
  if (!pending) {
    return NextResponse.json({ error: "Pending checkout not found" }, { status: 404 });
  }
  if (pending.status === "completed" && pending.order_id) {
    return NextResponse.json({ received: true, orderId: pending.order_id, duplicate: true });
  }

  const order = await createOrderFromItems({
    customerId: pending.customer_id,
    customerEmail: pending.customer_email,
    customerName: pending.customer_name,
    items: pending.items,
    shippingAddress: pending.shipping_address,
    phone: pending.phone,
    note: pending.note,
    status: "paid",
  });

  if (order instanceof NextResponse) {
    return order;
  }

  await getDb()`
    UPDATE pending_checkouts
    SET status = 'completed',
        order_id = ${order.orderId},
        stripe_session_id = ${session.id},
        completed_at = CURRENT_TIMESTAMP
    WHERE pending_checkout_id = ${pending.pending_checkout_id}
  `;

  return NextResponse.json({ received: true, orderId: order.orderId });
}

function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string) {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=", 2);
      return [key, value];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== signatureBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}
