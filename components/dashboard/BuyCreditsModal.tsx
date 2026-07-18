"use client";

import { useState } from "react";

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

    try {
      // Step 1: create a Razorpay order on our server
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_inr: plan.price,
          scan_credits: plan.credits,
          plan_type: plan.type,
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // Step 2: open Razorpay's hosted checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: plan.price * 100,
        currency: "INR",
        name: "Resume AI Optimizer",
        description: plan.label,
        order_id: orderData.data.order_id,
        handler: async function (response: RazorpaySuccessResponse) {
          // Step 3: verify the payment signature on our server
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              onSuccess();
            } else {
              setError(verifyData.error || "Payment verification failed");
            }
          } catch {
            setError(
              "Payment succeeded but verification failed. Contact support."
            );
          }
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
          },
        },
        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoadingPlan(null);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Get more scans
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {PLANS.map((plan) => (
            <button
              key={plan.type}
              onClick={() => handleBuy(plan)}
              disabled={loadingPlan !== null}
              className="w-full flex justify-between items-center border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors disabled:opacity-50 text-left"
            >
              <div>
                <div className="font-medium text-gray-900">{plan.label}</div>
                {plan.popular && (
                  <div className="text-xs text-blue-600 font-medium">
                    Best value
                  </div>
                )}
              </div>
              <div className="font-semibold text-gray-900">
                {loadingPlan === plan.type ? "Loading..." : `₹${plan.price}`}
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Secure payment powered by Razorpay
        </p>
      </div>
    </div>
  );
}
