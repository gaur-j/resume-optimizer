import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Resume AI Optimizer",
  description:
    "How Resume AI Optimizer collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-semibold text-foreground mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: 26 July 2026
        </p>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        This Privacy Policy explains what data Resume AI Optimizer
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;, the &ldquo;Service&rdquo;) collects
        when you use our website and dashboard, why we collect it, and how it is
        stored and processed. By using the Service you agree to the practices
        described below.
      </p>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          1. What we collect
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
          <li>
            <span className="text-foreground font-medium">Account data:</span>{" "}
            your email address, and if you sign in with Google, LinkedIn, or
            Facebook, the basic profile information those providers share with
            us (typically name and email).
          </li>
          <li>
            <span className="text-foreground font-medium">
              Resume and job description text:
            </span>{" "}
            the content you paste or upload for analysis, including any PDF
            files you upload. We extract plain text from PDFs on our server to
            run the analysis.
          </li>
          <li>
            <span className="text-foreground font-medium">
              Usage and scan data:
            </span>{" "}
            your ATS scores, scan history, and remaining scan credits, so your
            dashboard can show past results.
          </li>
          <li>
            <span className="text-foreground font-medium">Payment data:</span>{" "}
            order and payment status (amount, credits purchased, success or
            failure) for scans you purchase. We do not collect or store your
            card, UPI, or bank details — these are handled entirely by Razorpay,
            our payment processor.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          2. How we use third-party AI providers
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          To generate your ATS score, keyword analysis, and rewritten bullet
          points, your resume text and the job description you provide are sent
          to third-party AI providers (currently Groq and Google Gemini) for
          processing. These providers process the text to generate a response
          and do not use your submissions to train their general-purpose models
          under their standard API terms. We recommend removing personal
          identifiers you consider sensitive (such as a home address) from your
          resume text if you'd prefer not to share them, since only your name
          and contact details relevant to job applications are typically needed
          for accurate analysis.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          3. How we use your data
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
          <li>To run the ATS analysis and bullet rewriting you request</li>
          <li>To maintain your scan history and credit balance</li>
          <li>To process payments and grant credits after purchase</li>
          <li>To send essential account or payment-related communications</li>
          <li>To detect abuse, prevent fraud, and keep the Service secure</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          We do not sell your personal data or resume content to advertisers or
          data brokers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          4. Where your data is stored
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Account and scan data is stored with Supabase, our database and
          authentication provider, secured with row-level security so that only
          you can access your own records through the app. Payment records are
          stored to reconcile transactions with Razorpay.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          5. Data retention and deletion
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We retain your scan history so you can revisit past results from your
          dashboard. You may request deletion of your account and associated
          resume data at any time by contacting us at the email below. We will
          delete your personal data within a reasonable period, except where we
          are required to retain payment records for legal or accounting
          purposes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          6. Your rights
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Subject to applicable law, including the Digital Personal Data
          Protection Act, 2023, you may request access to, correction of, or
          deletion of your personal data, and may withdraw consent for
          processing where consent is the basis for that processing. To exercise
          these rights, contact us using the details below.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          7. Cookies and sessions
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We use essential cookies to keep you signed in and to maintain your
          session securely. We do not use third-party advertising or tracking
          cookies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          8. Changes to this policy
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          We may update this Privacy Policy from time to time. Material changes
          will be reflected by updating the &ldquo;Last updated&rdquo; date
          above.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xl font-semibold text-foreground">
          9. Contact us
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Questions about this policy or your data can be sent to{" "}
          <a
            href="mailto:support@yourdomain.com"
            className="text-primary underline underline-offset-4"
          >
            support gjain7524@gmail.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
