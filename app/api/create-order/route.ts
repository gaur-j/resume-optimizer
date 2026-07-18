import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

interface OrderRequest {
  amount_inr: number;
  scan_credits: number;
  plan_type: "single" | "pack";
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

    const { amount_inr, scan_credits, plan_type } =
      (await request.json()) as OrderRequest;

    // Validate inputs
    if (!amount_inr || amount_inr <= 0 || !scan_credits || scan_credits <= 0) {
      return NextResponse.json(
        { error: "Invalid amount or credits" },
        { status: 400 }
      );
    }

    // Validate pricing
    const validPlans: Record<string, { price: number; credits: number }> = {
      single: { price: 99, credits: 1 },
      pack: { price: 249, credits: 5 },
    };

    const plan = validPlans[plan_type];
    if (!plan || plan.price !== amount_inr || plan.credits !== scan_credits) {
      return NextResponse.json(
        { error: "Invalid plan configuration" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const razorpayOrder = await new Promise<any>((resolve, reject) => {
      razorpay.orders.create(
        {
          amount: amount_inr * 100,
          currency: "INR",
          receipt: `order_${user.id}_${Date.now()}`,
          payment_capture: true,
        },
        (error: any, order: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(order);
          }
        }
      );
    });

    // Save order to database
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        razorpay_order_id: razorpayOrder.id,
        amount_inr,
        scan_credits_granted: scan_credits,
        status: "pending",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error saving payment:", paymentError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        order_id: razorpayOrder.id,
        amount: amount_inr,
        currency: "INR",
        payment_id: paymentData.id,
      },
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
