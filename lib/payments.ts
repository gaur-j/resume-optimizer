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
  razorpayOrderId: string,
  proof?: { paymentId?: string; signature?: string }
): Promise<
  | { granted: true; alreadyProcessed: false; creditsAdded: number }
  | { granted: true; alreadyProcessed: true; creditsAdded: 0 }
  | { granted: false; reason: string }
> {
  const admin = createAdminClient();

  // The status flip (pending -> success) and the credit increment happen
  // inside ONE Postgres function / transaction (grant_credits_for_order in
  // lib/supabase/migrations/001_security_hardening.sql). Concurrent callers
  // are serialized on the payment row, so exactly one of them grants.
  const { data, error } = await admin
    .rpc("grant_credits_for_order", {
      p_order_id: razorpayOrderId,
      p_payment_id: proof?.paymentId ?? null,
      p_signature: proof?.signature ?? null,
    })
    .single<{
      outcome: "granted" | "already_processed" | "not_payable" | "not_found";
      payment: {
        user_id: string;
        razorpay_order_id: string;
        amount_inr: number;
        scan_credits_granted: number;
        attribution?: {
          utm_source?: string;
          utm_medium?: string;
          utm_campaign?: string;
        } | null;
      } | null;
    }>();

  if (error || !data) {
    console.error("grant_credits_for_order failed:", error);
    return { granted: false, reason: "Failed to add credits to user" };
  }

  switch (data.outcome) {
    case "granted": {
      const payment = data.payment!;

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
    case "already_processed":
      return { granted: true, alreadyProcessed: true, creditsAdded: 0 };
    case "not_found":
      return { granted: false, reason: "Payment record not found" };
    default:
      return { granted: false, reason: "Payment is not in a payable state" };
  }
}
