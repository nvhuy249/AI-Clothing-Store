import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "../../../lib/auth";
import { fetchCustomerByEmail } from "../../../lib/data";
import { getDb } from "../../../lib/db";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        qty: z.number().int().positive(),
      }),
    )
    .min(1),
  shippingName: z.string().trim().max(255).optional().nullable(),
  shippingAddress: z.string().trim().max(500).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY is not configured" }, { status: 500 });
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const customer = await fetchCustomerByEmail(email);
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const parse = checkoutSchema.safeParse(await req.json().catch(() => ({})));
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid payload", details: parse.error.flatten() }, { status: 400 });
    }

    const { items, shippingName, shippingAddress, phone, note } = parse.data;
    const productIds = items.map((item) => item.productId);
    const products = await getDb()<Array<{ product_id: string; name: string; price: number; stock_quantity: number }>>`
      SELECT product_id, name, price, COALESCE(stock_quantity, 0) AS stock_quantity
      FROM products
      WHERE product_id = ANY(${productIds})
    `;

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "One or more products were not found" }, { status: 400 });
    }

    const productMap = new Map(products.map((product) => [product.product_id, product]));
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || item.qty > Number(product.stock_quantity)) {
        return NextResponse.json({ error: `Insufficient stock for product ${item.productId}` }, { status: 400 });
      }
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || new URL(req.url).origin;
    const body = new URLSearchParams();
    body.set("mode", "payment");
    body.set("customer_email", email);
    body.set("success_url", `${origin}/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
    body.set("cancel_url", `${origin}/checkout?checkout=cancelled`);
    body.set("billing_address_collection", "auto");
    body.set("shipping_address_collection[allowed_countries][0]", "AU");
    body.set("shipping_address_collection[allowed_countries][1]", "US");
    body.set("metadata[customer_id]", customer.customer_id);
    body.set("metadata[shipping_name]", shippingName || customer.name || "");
    body.set("metadata[shipping_address]", shippingAddress || customer.address || "");
    body.set("metadata[phone]", phone || customer.phone || "");
    body.set("metadata[note]", note || "");

    items.forEach((item, index) => {
      const product = productMap.get(item.productId);
      if (!product) return;
      body.set(`line_items[${index}][quantity]`, String(item.qty));
      body.set(`line_items[${index}][price_data][currency]`, "aud");
      body.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(Number(product.price) * 100)));
      body.set(`line_items[${index}][price_data][product_data][name]`, product.name);
      body.set(`line_items[${index}][price_data][product_data][metadata][product_id]`, product.product_id);
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || "Stripe Checkout failed" }, { status: 502 });
    }

    return NextResponse.json({ url: data.url });
  } catch (error: unknown) {
    console.error("Stripe checkout error", error);
    const message = error instanceof Error ? error.message : "Stripe checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
