import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { fetchCustomerByEmail } from '../../../lib/data';
import { createOrderFromItems } from '../../../lib/order-fulfillment';
import { z } from 'zod';

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      qty: z.number().int().positive(),
    })
  ).min(1),
  shippingAddress: z.string().max(500).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const customer = await fetchCustomerByEmail(email);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const parse = orderSchema.safeParse(await req.json().catch(() => ({})));
    if (!parse.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parse.error.flatten() }, { status: 400 });
    }
    const { items, shippingAddress, address, phone, note } = parse.data;
    const shipAddress = shippingAddress || address || null;
    const orderPhone = phone || null;
    const orderNote = note || null;

    const order = await createOrderFromItems({
      customerId: customer.customer_id,
      customerEmail: customer.email,
      customerName: customer.name,
      items,
      shippingAddress: shipAddress,
      phone: orderPhone,
      note: orderNote,
      status: "pending",
    });

    if (order instanceof NextResponse) {
      return order;
    }

    return NextResponse.json({ ok: true, orderId: order.orderId });
  } catch (err: unknown) {
    console.error('Local checkout error', err);
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
