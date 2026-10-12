import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimits, CREATE_ORDER_RATE_LIMITS } from "@/lib/rate-limit";
import { PayloadTooLargeError, readLimitedJson } from "@/lib/request-body";
import { sanitizeAttribution } from "@/lib/security";

import Razorpay from "razorpay";
import type { Orders } from "razorpay/dist/types/orders";
import type { INormalizeError } from "razorpay/dist/types/api";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

interface OrderRequest {
  amount_inr: number;
  scan_credits: number;
  plan_type: "single" | "pack";
  attribution?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
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

    // Per-user limit BEFORE anything that costs money or writes rows.
    const rateLimitFailure = await checkRateLimits(
      supabase,
      user.id,
      CREATE_ORDER_RATE_LIMITS
    );

    if (rateLimitFailure) {
      return NextResponse.json(
        { error: "Too many payment attempts. Please wait a moment." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitFailure.retryAfterSeconds),
          },
        }
      );
    }

    // Tiny, fixed-shape body: cap it so it can't be used to send megabytes.
    const { amount_inr, scan_credits, plan_type, attribution } =
      (await readLimitedJson(request, 16 * 1024)) as OrderRequest;

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
    const razorpayOrder = await new Promise<Orders.RazorpayOrder>(
      (resolve, reject) => {
        razorpay.orders.create(
          {
            amount: amount_inr * 100,
            currency: "INR",
            receipt: `order_${user.id.slice(0, 8)}_${Date.now().toString(36)}`,
            payment_capture: true,
          },
          (error: INormalizeError | null, order: Orders.RazorpayOrder) => {
            if (error) {
              reject(error);
            } else {
              resolve(order);
            }
          }
        );
      }
    );

    // Save order to database. Clients have no INSERT rights on payments
    // (see 001_security_hardening.sql), so this uses the service-role
    // client; user_id comes from the verified session above, never the body.
    const { data: paymentData, error: paymentError } = await createAdminClient()
      .from("payments")
      .insert({
        user_id: user.id,
        razorpay_order_id: razorpayOrder.id,
        amount_inr,
        scan_credits_granted: scan_credits,
        status: "pending",
        // Untrusted marketing data: only 3 known keys, short plain strings.
        attribution: sanitizeAttribution(attribution),
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
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
