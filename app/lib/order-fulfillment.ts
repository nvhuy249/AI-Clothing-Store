import { NextResponse } from "next/server";
import { getDb } from "./db";
import { sendOrderConfirmationEmail } from "./email";

export type CheckoutOrderItem = {
  productId: string;
  qty: number;
};

type CreateOrderInput = {
  customerId: string;
  customerEmail: string;
  customerName: string;
  items: CheckoutOrderItem[];
  shippingAddress: string | null;
  phone: string | null;
  note: string | null;
  status: "pending" | "paid";
};

export async function createOrderFromItems(input: CreateOrderInput) {
  const productIds = input.items.map((item) => item.productId);

  const order = await getDb().begin(async (trx) => {
    const dbProducts = await trx<{ product_id: string; name: string; price: number; stock_quantity: number | null }[]>`
      SELECT product_id, name, price, COALESCE(stock_quantity, 0) AS stock_quantity
      FROM products
      WHERE product_id = ANY(${productIds})
      FOR UPDATE
    `;
    if (dbProducts.length !== productIds.length) {
      return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
    }

    const priceMap = new Map(dbProducts.map((product) => [product.product_id, Number(product.price)]));
    const stockMap = new Map(dbProducts.map((product) => [product.product_id, Number(product.stock_quantity || 0)]));
    const productNameMap = new Map(dbProducts.map((product) => [product.product_id, product.name]));

    for (const item of input.items) {
      const stock = stockMap.get(item.productId) ?? 0;
      if (item.qty > stock) {
        return NextResponse.json({ error: `Insufficient stock for product ${item.productId}` }, { status: 400 });
      }
    }

    const total = input.items.reduce((sum, item) => sum + (priceMap.get(item.productId) || 0) * item.qty, 0);

    const orderRow = await trx<Array<{ order_id: string }>>`
      INSERT INTO orders (customer_id, status, total_amount, address, phone, note)
      VALUES (${input.customerId}, ${input.status}, ${total}, ${input.shippingAddress}, ${input.phone}, ${input.note})
      RETURNING order_id
    `;
    const orderId = orderRow[0].order_id;

    for (const item of input.items) {
      const price = priceMap.get(item.productId) || 0;
      await trx`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (${orderId}, ${item.productId}, ${item.qty}, ${price})
      `;
      await trx`
        UPDATE products
        SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - ${item.qty})
        WHERE product_id = ${item.productId}
      `;
    }

    return {
      orderId,
      total,
      items: input.items.map((item) => ({
        name: productNameMap.get(item.productId) || item.productId,
        quantity: item.qty,
        unitPrice: priceMap.get(item.productId) || 0,
      })),
    };
  });

  if (order instanceof NextResponse) return order;

  try {
    await sendOrderConfirmationEmail({
      to: input.customerEmail,
      customerName: input.customerName,
      orderId: order.orderId,
      total: order.total,
      items: order.items,
      shippingAddress: input.shippingAddress,
    });
  } catch (emailError) {
    console.error("Order email failed", emailError);
  }

  return order;
}
