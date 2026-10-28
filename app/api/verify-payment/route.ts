import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { grantCreditsForOrder } from "@/lib/payments";
import { safeEqual } from "@/lib/security";
import { reportError } from "@/lib/monitoring";

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      (await request.json()) as VerifyPaymentRequest;

    // Must all be non-empty STRINGS of sane length (the body is untrusted JSON).
    const isId = (value: unknown): value is string =>
      typeof value === "string" && value.length > 0 && value.length <= 200;

    if (
      !isId(razorpay_order_id) ||
      !isId(razorpay_payment_id) ||
      !isId(razorpay_signature)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify signature
    const secret = process.env.RAZORPAY_SECRET!;
    const shasum = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!safeEqual(shasum, razorpay_signature)) {
      // Never log the expected HMAC: it is exactly the value an attacker
      // would need to forge for this order/payment pair.
      console.warn("Invalid payment signature for order:", razorpay_order_id);

      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Ownership check: the order must belong to the signed-in user.
    // (Read-only; goes through the "payments_select_own" RLS policy.)
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .select("id, amount_inr")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", user.id)
      .single();

    if (paymentError || !paymentData) {
      console.error("Payment record not found:", paymentError);
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    // The signature only proves checkout completed. Confirm with Razorpay
    // that the money was actually captured for THIS order and amount.
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_SECRET!,
    });
    const rzPayment = await razorpay.payments.fetch(razorpay_payment_id);
    const expectedPaise = Math.round(Number(paymentData.amount_inr) * 100);
    if (
      rzPayment.order_id !== razorpay_order_id ||
      rzPayment.currency !== "INR" ||
      Number(rzPayment.amount) !== expectedPaise
    ) {
      console.warn("Payment does not match order:", razorpay_order_id);
      return NextResponse.json({ error: "Payment mismatch" }, { status: 400 });
    }
    if (rzPayment.status !== "captured") {
      // Authorized but not captured yet: the payment.captured webhook
      // grants the credits once Razorpay captures it.
      return NextResponse.json(
        { success: false, pending: true, message: "Payment is processing. Credits will appear shortly." },
        { status: 202 }
      );
    }

    // Single atomic, idempotent grant shared with the webhook. Replaying
    // this request (or racing the webhook) can never grant twice.
    const result = await grantCreditsForOrder(razorpay_order_id, {
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!result.granted) {
      console.error("Credit grant failed:", result.reason, razorpay_order_id);
      await reportError(
        "payment.verify.grant_failed",
        new Error(result.reason),
        {
          orderId: razorpay_order_id,
        }
      );

      return NextResponse.json(
        { error: "Failed to add credits" },
        { status: 500 }
      );
    }

    if (result.alreadyProcessed) {
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        credits_added: result.creditsAdded,
        message: "Payment verified and credits added",
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    await reportError("payment.verify.error", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
