type OrderEmailItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

type OrderEmailInput = {
  to: string;
  customerName: string;
  orderId: string;
  total: number;
  items: OrderEmailItem[];
  shippingAddress: string | null;
};

const resendApiKey = cleanEnv(process.env.RESEND_API_KEY);
const sendgridApiKey = cleanEnv(process.env.SENDGRID_API_KEY);
const fromEmail = cleanEnv(process.env.ORDER_EMAIL_FROM) || "NeuroFit <orders@neurofit.test>";

export async function sendOrderConfirmationEmail(input: OrderEmailInput) {
  if (!resendApiKey && !sendgridApiKey) {
    console.info("Order email skipped: configure RESEND_API_KEY or SENDGRID_API_KEY.");
    return { skipped: true };
  }

  const subject = `NeuroFit order ${input.orderId.slice(0, 8)} confirmation`;
  const text = renderOrderText(input);
  const html = renderOrderHtml(input);

  if (resendApiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [input.to],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend email failed: ${await response.text()}`);
    }
    console.info(`Order email sent via Resend to ${input.to}.`);
    return response.json();
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sendgridApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: input.to }] }],
      from: parseFromEmail(fromEmail),
      subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`SendGrid email failed: ${await response.text()}`);
  }
  console.info(`Order email sent via SendGrid to ${input.to}.`);
  return { ok: true };
}

function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === '""' || trimmed === "''") return undefined;
  return trimmed.replace(/^["']|["']$/g, "");
}

function renderOrderText(input: OrderEmailInput) {
  const items = input.items
    .map((item) => `- ${item.name} x ${item.quantity}: ${formatMoney(item.unitPrice * item.quantity)}`)
    .join("\n");

  return [
    `Hi ${input.customerName},`,
    "",
    "Thanks for your NeuroFit order. We have received it and will start preparing it shortly.",
    "",
    `Order ID: ${input.orderId}`,
    `Total: ${formatMoney(input.total)}`,
    input.shippingAddress ? `Shipping address: ${input.shippingAddress}` : "",
    "",
    "Items:",
    items,
  ]
    .filter(Boolean)
    .join("\n");
}

function renderOrderHtml(input: OrderEmailInput) {
  const rows = input.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.name)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(item.unitPrice * item.quantity)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
      <h1 style="font-size:24px;margin:0 0 16px;">Order confirmed</h1>
      <p>Hi ${escapeHtml(input.customerName)},</p>
      <p>Thanks for your NeuroFit order. We have received it and will start preparing it shortly.</p>
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Order ID:</strong> ${input.orderId}</p>
        <p style="margin:0 0 8px;"><strong>Total:</strong> ${formatMoney(input.total)}</p>
        ${
          input.shippingAddress
            ? `<p style="margin:0;"><strong>Shipping:</strong> ${escapeHtml(input.shippingAddress)}</p>`
            : ""
        }
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:8px;">Item</th>
            <th style="text-align:center;padding-bottom:8px;">Qty</th>
            <th style="text-align:right;padding-bottom:8px;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseFromEmail(value: string) {
  const match = value.match(/^(.*)<(.+)>$/);
  if (!match) return { email: value };
  return { name: match[1].trim(), email: match[2].trim() };
}
