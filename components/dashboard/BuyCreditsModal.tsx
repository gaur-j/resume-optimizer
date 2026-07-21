"use client";

import { useState } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const PLANS = [
  { type: "single" as const, price: 99, credits: 1, label: "1 Scan" },
  {
    type: "pack" as const,
    price: 249,
    credits: 5,
    label: "5 Scans",
    popular: true,
  },
];

interface BuyCreditsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function BuyCreditsModal({ onClose, onSuccess }: BuyCreditsModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleBuy(plan: (typeof PLANS)[number]) {
    setLoadingPlan(plan.type);
    setError("");

    const paymentPromise = new Promise<void>(async (resolve, reject) => {
      try {
        // Create order
        const orderRes = await fetch("/api/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount_inr: plan.price,
            scan_credits: plan.credits,
            plan_type: plan.type,
          }),
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          return reject(new Error(orderData.error || "Failed to create order"));
        }

        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: plan.price * 100,
          currency: "INR",
          name: "Resume AI Optimizer",
          description: plan.label,
          order_id: orderData.data.order_id,

          handler: async (response: RazorpaySuccessResponse) => {
            try {
              const verifyRes = await fetch("/api/verify-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();

              if (!verifyRes.ok) {
                return reject(
                  new Error(verifyData.error || "Payment verification failed")
                );
              }

              onSuccess();
              resolve();
            } catch {
              reject(new Error("Payment succeeded but verification failed."));
            }
          },

          modal: {
            ondismiss() {
              reject(new Error("Payment cancelled"));
              setLoadingPlan(null);
            },
          },

          theme: {
            color: "#2563eb",
          },
        });

        rzp.open();
      } catch (err) {
        reject(err);
      }
    });

    await toast.promise(paymentPromise, {
      loading: "Processing payment...",
      success: "Payment successful! Credits added.",
      error: (err) => err.message,
    });

    setLoadingPlan(null);
  }

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Get more scans
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {PLANS.map((plan) => (
            <button
              key={plan.type}
              onClick={() => handleBuy(plan)}
              disabled={loadingPlan !== null}
              className="w-full flex justify-between items-center border-2 border-border rounded-lg p-4 hover:border-primary transition-colors disabled:opacity-50 text-left"
            >
              <div>
                <div className="font-medium text-foreground">{plan.label}</div>
                {plan.popular && (
                  <div className="text-xs text-primary font-medium">
                    Best value
                  </div>
                )}
              </div>
              <div className="font-semibold text-foreground">
                {loadingPlan === plan.type ? "Loading..." : `₹${plan.price}`}
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Secure payment powered by Razorpay
        </p>
      </div>
    </div>
  );
}
