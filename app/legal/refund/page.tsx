import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Resume AI Optimizer",
  description: "Our policy on refunds and cancellations for scan credits.",
};

export default function RefundPolicyPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-semibold text-foreground mb-2">
          Refund &amp; Cancellation Policy
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: 26 July 2026
        </p>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        Resume AI Optimizer sells scan credits as a one-time, pay-as-you-go
        purchase — there is no recurring subscription to cancel. This policy
        explains when a refund is and isn&rsquo;t available.
      </p>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          1. Nature of the service
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Each credit you purchase unlocks one AI-generated resume analysis,
          which is delivered to your dashboard immediately and consumes
          third-party AI processing as soon as it runs. Because the service is
          delivered digitally and instantly, purchases are generally
          non-refundable once a credit has been used to generate a result.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          2. When a refund is available
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
          <li>
            You were charged but did not receive the credits you paid for, due
            to a technical error on our end.
          </li>
          <li>
            You were charged more than once for the same order due to a payment
            processing error.
          </li>
          <li>
            A scan you paid for failed to generate a result and the credit was
            not automatically restored to your account.
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          In these cases, contact us within 7 days of the transaction with your
          registered email and the payment ID shown in your Razorpay receipt,
          and we will investigate and issue a refund or restore your credits,
          whichever is appropriate.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          3. When a refund is not available
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
          <li>
            You are unsatisfied with the quality or wording of an AI-generated
            result that was successfully delivered.
          </li>
          <li>
            You purchased credits and simply changed your mind after they were
            used.
          </li>
          <li>
            You purchased credits and did not use them within a reasonable time.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          4. How refunds are processed
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Approved refunds are issued to the original payment method through
          Razorpay. Depending on your bank or payment provider, refunds may take
          5–7 business days to reflect in your account after we initiate them.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          5. Cancellations
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Since there is no recurring subscription, there is nothing to cancel
          after a one-time credit purchase. If we introduce a subscription plan
          in the future, this section will be updated to describe how to cancel
          it.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          6. Contact us
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          For refund requests or payment issues, email{" "}
          <a
            href="mailto:support@yourdomain.com"
            className="text-primary underline underline-offset-4"
          >
            support gjain7524@gmail.com
          </a>{" "}
          with your registered email and payment ID.
        </p>
      </section>
    </article>
  );
}
