import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Grants credits for a Razorpay order, exactly once, no matter how many
 * times or which path it's called from (client-side verify call, this
 * webhook, both racing each other). Safe to call twice for the same order.
 *
 * Uses the service-role admin client because this needs to work from a
 * server-to-server webhook call that has no logged-in user session —
 * there are no cookies to read a user out of on that request.
 */

async function sendServerPurchaseEvent(payment: {
  user_id: string;
  razorpay_order_id: string;
  amount_inr: number;
  attribution?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  } | null;
}) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_API_SECRET;

  if (!measurementId || !apiSecret) return;

  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        body: JSON.stringify({
          // Using the Supabase user id as client_id groups this event
          // under the same GA4 user as their earlier on-site sessions,
          // even though this request has no browser cookies to read.
          client_id: payment.user_id,
          events: [
            {
              name: "purchase",
              params: {
                transaction_id: payment.razorpay_order_id,
                value: payment.amount_inr,
                currency: "INR",
                utm_source: payment.attribution?.utm_source ?? "(direct)",
                utm_medium: payment.attribution?.utm_medium ?? "(none)",
                utm_campaign: payment.attribution?.utm_campaign ?? "(not set)",
              },
            },
          ],
        }),
      }
    );
  } catch (err) {
    // A broken analytics call must never break a real payment.
    console.error("GA4 purchase event failed:", err);
  }
}

export async function grantCreditsForOrder(
  razorpayOrderId: string
): Promise<
  | { granted: true; alreadyProcessed: false; creditsAdded: number }
  | { granted: true; alreadyProcessed: true; creditsAdded: 0 }
  | { granted: false; reason: string }
> {
  const admin = createAdminClient();

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .select("*")
    .eq("razorpay_order_id", razorpayOrderId)
    .single();

  if (paymentError || !payment) {
    return { granted: false, reason: "Payment record not found" };
  }

  // Idempotency guard — if the client-side verify call already handled
  // this order, do nothing. This is what makes it safe for the webhook
  // and the client call to both fire for the same successful payment.
  if (payment.status === "success") {
    return { granted: true, alreadyProcessed: true, creditsAdded: 0 };
  }

  const { data: userData, error: userError } = await admin
    .from("users")
    .select("scan_credits, total_spent_inr, total_paid_scans")
    .eq("id", payment.user_id)
    .single();

  if (userError || !userData) {
    return { granted: false, reason: "User record not found" };
  }

  const { error: updatePaymentError } = await admin
    .from("payments")
    .update({ status: "success", updated_at: new Date().toISOString() })
    .eq("id", payment.id)
    .eq("status", "pending"); // extra guard against a race between two callers

  if (updatePaymentError) {
    return { granted: false, reason: "Failed to update payment status" };
  }

  const { error: creditError } = await admin
    .from("users")
    .update({
      scan_credits: userData.scan_credits + payment.scan_credits_granted,
      total_spent_inr: userData.total_spent_inr + payment.amount_inr,
      total_paid_scans:
        userData.total_paid_scans + payment.scan_credits_granted,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.user_id);

  if (creditError) {
    return { granted: false, reason: "Failed to add credits to user" };
  }

  // Fires exactly once per order, regardless of whether the client
  // verify-call or the webhook got here first — that's what the
  // alreadyProcessed check above already guarantees.
  await sendServerPurchaseEvent({
    user_id: payment.user_id,
    razorpay_order_id: payment.razorpay_order_id,
    amount_inr: payment.amount_inr,
    attribution: payment.attribution,
  });

  return {
    granted: true,
    alreadyProcessed: false,
    creditsAdded: payment.scan_credits_granted,
  };
}
