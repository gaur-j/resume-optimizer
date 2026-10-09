import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { grantCreditsForOrder } from "@/lib/payments";

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

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
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

    if (shasum !== razorpay_signature) {
      console.warn("Invalid payment signature:", {
        expected: shasum,
        received: razorpay_signature,
      });
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Get payment record
    // Ownership check: the order must belong to the signed-in user.
    // (Read-only; goes through the "payments_select_own" RLS policy.)
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .select("id")
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

    // Single atomic, idempotent grant shared with the webhook. Replaying
    // this request (or racing the webhook) can never grant twice.
    const result = await grantCreditsForOrder(razorpay_order_id, {
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!result.granted) {
      console.error("Credit grant failed:", result.reason, razorpay_order_id);
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
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
