import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import crypto from "crypto";

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
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .select("*")
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

    // Check if already processed
    if (paymentData.status === "success") {
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
      });
    }

    // Update payment status
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "success",
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentData.id);

    if (updatePaymentError) {
      console.error("Error updating payment:", updatePaymentError);
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      );
    }

    // Add credits to user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("scan_credits, total_spent_inr, total_paid_scans")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("User record not found:", userError);
      return NextResponse.json(
        { error: "User record not found" },
        { status: 404 }
      );
    }

    const { error: creditError } = await supabase
      .from("users")
      .update({
        scan_credits: userData.scan_credits + paymentData.scan_credits_granted,
        total_spent_inr: userData.total_spent_inr + paymentData.amount_inr,
        total_paid_scans:
          userData.total_paid_scans + paymentData.scan_credits_granted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (creditError) {
      console.error("Error updating credits:", creditError);
      return NextResponse.json(
        { error: "Failed to add credits" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        credits_added: paymentData.scan_credits_granted,
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
