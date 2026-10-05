import type { Metadata } from "next";
import {
  CheckIcon,
  ChevronDown,
  FileSearch,
  Gauge,
  LayoutTemplate,
  Target,
  Wrench,
} from "lucide-react";

import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { AuthCTAButton, NavAuthLink } from "@/components/auth/AuthTriggers";
import { SiteFooter } from "@/components/SiteFooter";
import { ATSPreview } from "@/components/marketing/ATSPreview";

const FAQS = [
  {
    q: "Is my resume data safe?",
    a: "Your resume text is stored only in your account and is never shared, sold, or used to train models beyond generating your own analysis.",
  },
  {
    q: "What ATS systems does this work for?",
    a: "We test against patterns used by the most common platforms Indian companies use, including Workday, Greenhouse, and Naukri's internal parsing.",
  },
  {
    q: "Is there really no score cap or hidden fee?",
    a: "Your 3 free scans are genuinely free — no card required. After that, you pay only for the scans you use, with no recurring subscription.",
  },
  {
    q: "How is this different from just using ChatGPT?",
    a: "We combine ATS-specific scoring logic with AI rewriting, so you get a structured score and gap analysis, not just a generic opinion.",
  },
];

const CATEGORIES = [
  {
    icon: Target,
    title: "Keywords",
    desc: "Do you have the exact terms this job description is scanning for?",
  },
  {
    icon: Gauge,
    title: "Experience",
    desc: "Are your achievements quantified and relevant to the role?",
  },
  {
    icon: LayoutTemplate,
    title: "Formatting",
    desc: "Will ATS software actually be able to parse your resume?",
  },
  {
    icon: Wrench,
    title: "Skills",
    desc: "Do your listed skills match what recruiters are filtering for?",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Upload your resume",
    desc: "Drop your PDF and paste the job description you are targeting.",
  },
  {
    step: "02",
    title: "Get your ATS score",
    desc: "See how ATS software reads your resume — with a clear breakdown.",
  },
  {
    step: "03",
    title: "Apply AI rewrites",
    desc: "Copy stronger bullets and export a tailored resume in minutes.",
  },
];

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://getresume-ai.vercel.app/#organization",
      name: "Get Resume AI",
      url: "https://getresume-ai.vercel.app/",
      logo: "https://getresume-ai.vercel.app/site.svg",
    },
    {
      "@type": "WebSite",
      "@id": "https://getresume-ai.vercel.app/#website",
      name: "Get Resume AI",
      alternateName: "Resume AI Optimizer",
      url: "https://getresume-ai.vercel.app/",
      publisher: { "@id": "https://getresume-ai.vercel.app/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "WebApplication",
      isPartOf: { "@id": "https://getresume-ai.vercel.app/#website" },
      name: "Get Resume AI",
      url: "https://getresume-ai.vercel.app/",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "AI-powered ATS resume checker: get an ATS score, keyword gap analysis, and AI resume rewrites.",
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "INR",
          description: "3 resume scans with full ATS score breakdown.",
        },
        {
          "@type": "Offer",
          name: "1 Scan",
          price: "99",
          priceCurrency: "INR",
          description: "1 resume scan with AI bullet point rewrites.",
        },
        {
          "@type": "Offer",
          name: "5 Scans",
          price: "249",
          priceCurrency: "INR",
          description: "5 resume scans with AI bullet point rewrites.",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ],
};

export default function Home() {
  return (
    <AuthModalProvider>
      <div className="min-h-screen overflow-x-hidden bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Navigation */}
        <nav className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/75">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 lg:px-8">
            <div className="text-lg font-bold tracking-tight sm:text-xl">
              Resume<span className="text-primary">AI</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <NavAuthLink
                mode="login"
                className="px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-4 sm:text-sm"
              >
                Log in
              </NavAuthLink>
              <AuthCTAButton
                mode="signup"
                className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold shadow-sm transition-colors hover:bg-primary/90 sm:h-10 sm:px-4 sm:text-sm"
              >
                <span className="hidden sm:inline">Get Started Free</span>
                <span className="sm:hidden">Start Free</span>
              </AuthCTAButton>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_55%)]" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                backgroundSize: "56px 56px",
              }}
            />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:gap-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-20">
            <div className="text-center sm:text-left">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] font-medium text-primary sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Built for Indian job seekers
              </p>

              <h1 className="text-balance font-mono text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
                Find out why ATS bots are rejecting your resume
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mx-0 sm:mt-5 sm:text-lg sm:leading-7">
                Upload your resume and a job description. Get a real ATS score,
                missing keywords, and AI-rewritten bullets — in under 2 minutes.
              </p>

              <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-start">
                <a
                  href="#free-ats-check"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
                >
                  <FileSearch className="mr-2 h-4 w-4" aria-hidden="true" />
                  Check My Resume — Free
                </a>
              </div>

              <p className="mt-4 text-xs text-muted-foreground sm:text-sm">
                3 free scans · No card required · Results in ~2 minutes
              </p>
            </div>

            {/* Product preview */}
            <div
              aria-hidden="true"
              className="relative mx-auto w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 lg:max-w-none"
            >
              <div className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-md) sm:p-6">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Resume audit
                  </span>
                  <span className="rounded-md bg-approved/10 px-2 py-0.5 text-[11px] font-medium text-approved">
                    Live preview
                  </span>
                </div>

                <p className="mb-3 text-sm text-muted-foreground/70 line-through decoration-correction decoration-2">
                  Worked on React projects for the team
                </p>

                <div className="rounded-xl border border-approved/25 bg-approved/8 p-3">
                  <p className="text-sm leading-relaxed text-foreground">
                    Led React frontend development for 3 customer-facing apps,
                    cutting page load time by 40%
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
                    quantified impact
                  </span>
                  <span className="rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
                    action verb
                  </span>
                  <span className="rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
                    ATS keywords
                  </span>
                </div>
              </div>

              <div className="absolute -right-2 -top-4 sm:-right-4 sm:-top-5">
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-approved bg-background shadow-(--shadow-md) sm:h-20 sm:w-20">
                  <span className="font-mono text-xl font-bold leading-none text-approved sm:text-2xl">
                    78
                  </span>
                  <span className="mt-0.5 text-[8px] font-medium uppercase tracking-wider text-approved sm:text-[9px]">
                    ATS score
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="border-y border-border bg-secondary/50">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-3 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2 sm:py-5 sm:text-sm">
            {[
              "Works with LinkedIn, Naukri, Indeed",
              "No data sold or shared",
              "Built by a student, for students",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckIcon
                  className="h-3.5 w-3.5 shrink-0 text-approved"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <ATSPreview />

        {/* How it works */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                How it works
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Three steps from upload to a tailored resume
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:mt-12 md:grid-cols-3 md:gap-8">
              {STEPS.map((item) => (
                <div key={item.step} className="text-center md:text-left">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-mono text-sm font-semibold text-primary md:mx-0">
                    {item.step}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Score categories */}
        <section className="border-y border-border bg-secondary/40 py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                One score isn&apos;t enough
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Your result breaks into four categories so you know exactly what
                to fix.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-4">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.title}
                    className="rounded-2xl border border-border bg-card p-4 shadow-(--shadow-xs) sm:p-5"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground sm:text-base">
                      {cat.title}
                    </h3>
                    <p className="mt-1 hidden text-xs leading-relaxed text-muted-foreground sm:block sm:text-sm">
                      {cat.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Before / After */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                See the difference
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Real example of an AI-rewritten bullet point
              </p>
            </div>

            <div className="mt-8 space-y-3 sm:mt-10">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-xs)">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Before
                </p>
                <p className="text-sm text-muted-foreground/70 line-through decoration-correction decoration-2 sm:text-base">
                  Worked on React projects for the team
                </p>
              </div>

              <div className="flex justify-center" aria-hidden="true">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  ↓
                </div>
              </div>

              <div className="rounded-2xl border border-approved/30 bg-approved/8 p-5">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-approved">
                  After
                </p>
                <p className="text-sm leading-relaxed text-foreground sm:text-base">
                  Led React frontend development for 3 customer-facing web
                  applications, improving page load times by 40%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-y border-border bg-secondary/40 py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Simple, honest pricing
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                No subscriptions. Pay only when you need more scans.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-3 md:gap-5">
              {/* Free */}
              <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-(--shadow-xs)">
                <h3 className="text-sm font-semibold text-foreground">Free</h3>
                <div className="mt-2 font-mono text-3xl font-semibold text-foreground sm:text-4xl">
                  ₹0
                </div>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-approved" />
                    3 resume scans
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-approved" />
                    Full ATS score breakdown
                  </li>
                </ul>
                <AuthCTAButton
                  mode="signup"
                  variant="outline"
                  className="mt-6 w-full rounded-xl"
                >
                  Start free
                </AuthCTAButton>
              </div>

              {/* Popular */}
              <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-card p-6 shadow-(--shadow-md)">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  Most popular
                </span>
                <h3 className="text-sm font-semibold text-foreground">5 Scans</h3>
                <div className="mt-2 font-mono text-3xl font-semibold text-foreground sm:text-4xl">
                  ₹249
                </div>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-approved" />
                    5 resume scans
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-approved" />
                    AI bullet point rewrites
                  </li>
                </ul>
                <AuthCTAButton
                  mode="signup"
                  className="mt-6 w-full rounded-xl bg-primary hover:bg-primary/90"
                >
                  Get 5 scans
                </AuthCTAButton>
              </div>

              {/* Single */}
              <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-(--shadow-xs)">
                <h3 className="text-sm font-semibold text-foreground">1 Scan</h3>
                <div className="mt-2 font-mono text-3xl font-semibold text-foreground sm:text-4xl">
                  ₹99
                </div>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-approved" />
                    1 resume scan
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-approved" />
                    AI bullet point rewrites
                  </li>
                </ul>
                <AuthCTAButton
                  mode="signup"
                  variant="outline"
                  className="mt-6 w-full rounded-xl"
                >
                  Buy 1 scan
                </AuthCTAButton>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Frequently asked questions
            </h2>

            <div className="mt-8 space-y-1 sm:mt-10">
              {FAQS.map((item, idx) => (
                <details
                  key={item.q}
                  open={idx === 0}
                  className="group border-b border-border py-4 sm:py-5 [&::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {item.q}
                    <ChevronDown
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-primary py-14 sm:py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="font-mono text-xl font-semibold tracking-tight text-primary-foreground sm:text-3xl">
              Get your ATS score now
            </h2>
            <p className="mt-2 text-sm text-primary-foreground/80 sm:text-base">
              3 free scans included. No credit card required.
            </p>
            <AuthCTAButton
              mode="signup"
              size="lg"
              className="mt-6 h-12 w-full rounded-xl bg-background text-sm font-semibold text-primary shadow-sm hover:bg-background/90 sm:w-auto sm:px-8"
            >
              Start Free Analysis →
            </AuthCTAButton>
          </div>
        </section>

        <SiteFooter />
      </div>
    </AuthModalProvider>
  );
}
