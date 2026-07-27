import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { grantCreditsForOrder } from "@/lib/payments";

/**
 * Razorpay webhook — the safety net behind /api/verify-payment.
 *
 * Why this exists: the current flow grants credits when the BROWSER
 * calls /api/verify-payment after checkout succeeds. If the user closes
 * the tab, loses signal, or the app crashes in that split second, the
 * payment goes through on Razorpay's side but the credits never land.
 * This webhook is Razorpay telling your SERVER directly that a payment
 * was captured, so credits get granted even if the browser never checks
 * back in. It's safe to have both paths active — grantCreditsForOrder()
 * is idempotent, so whichever one runs first "wins" and the other is a
 * no-op.
 *
 * Setup required (see the setup guide for full steps):
 * 1. Razorpay Dashboard → Settings → Webhooks → Add new webhook
 *    URL: https://yourdomain.com/api/webhooks/razorpay
 *    Active events: payment.captured
 * 2. Copy the "Webhook Secret" Razorpay generates and set it as
 *    RAZORPAY_WEBHOOK_SECRET in your environment variables.
 *    This is a DIFFERENT secret from RAZORPAY_SECRET (your API key
 *    secret) — don't reuse one for the other.
 */
export async function POST(request: NextRequest) {
  // Must read the raw text body — NOT request.json() — because the
  // signature is computed over the exact raw bytes Razorpay sent.
  // Parsing to JSON first and re-stringifying can produce different
  // bytes (key order, spacing) and make a valid signature look invalid.
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.warn("Razorpay webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event: string;
    payload?: { payment?: { entity?: { order_id?: string } } };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only payment.captured actually means "money received" — ignore
  // everything else (order.paid, payment.authorized, etc.) for now.
  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true, skipped: event.event });
  }

  const orderId = event.payload?.payment?.entity?.order_id;
  if (!orderId) {
    console.error("Webhook payload missing order_id:", event);
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

  const result = await grantCreditsForOrder(orderId);

  if (!result.granted) {
    // Log for your own visibility, but still return 200 — a 4xx/5xx
    // here makes Razorpay retry the webhook repeatedly, which won't
    // help if the underlying issue is "payment row doesn't exist yet."
    console.error("Webhook could not grant credits:", result.reason, orderId);
    return NextResponse.json({ received: true, error: result.reason });
  }

  return NextResponse.json({
    received: true,
    alreadyProcessed: result.alreadyProcessed,
    creditsAdded: result.creditsAdded,
  });
}
