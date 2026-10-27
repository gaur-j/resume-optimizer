// app/resume-keyword-checker/[industry]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckIcon,
  ChevronDown,
  Sparkles,
  Tag,
  Lightbulb,
  Briefcase,
  Layers,
} from "lucide-react";

import rawIndustries from "@/data/industries-keywords.json";
import rawRoles from "@/data/ats-roles.json";
import type { Industry } from "@/types/industry";
import type { Role } from "@/types/role";
import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { AuthCTAButton, NavAuthLink } from "@/components/auth/AuthTriggers";
import { SiteFooter } from "@/components/SiteFooter";

const industriesData = rawIndustries as Industry[];
const rolesData = rawRoles as Role[];

const BASE_PATH = "/resume-keyword";
const ROLE_PATH = "/ats-resume";

interface PageProps {
  params: Promise<{ industry: string }>;
}

// ---------- Helpers ----------

function getIndustry(slug: string): Industry | undefined {
  return industriesData.find((i) => i.slug === slug);
}

function hasItems<T>(list?: T[]): list is T[] {
  return Array.isArray(list) && list.length > 0;
}

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// ---------- Static generation ----------

export const dynamicParams = false;

export async function generateStaticParams() {
  return industriesData.map((item) => ({ industry: item.slug }));
}

// ---------- SEO metadata ----------

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { industry } = await params;
  const data = getIndustry(industry);
  if (!data) return {};

  const title =
    data.seo?.metaTitle ??
    `Essential Resume Keywords for ${data.name} Jobs | Get Resume AI`;
  const description =
    data.seo?.metaDescription ??
    `Find out what keywords recruiters and ATS scanners look for in ${data.name} resumes. Maximize your match rate instantly.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_PATH}/${data.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${BASE_PATH}/${data.slug}`,
    },
  };
}

// ---------- Page Component ----------

export default async function IndustryKeywordsPage({ params }: PageProps) {
  const { industry } = await params;
  const data = getIndustry(industry);

  if (!data) notFound();

  const relatedIndustries = (data.relatedIndustrySlugs ?? [])
    .map((s) => getIndustry(s))
    .filter((i): i is Industry => Boolean(i));

  const relatedRoles = (data.relatedRoleSlugs ?? [])
    .map((s) => rolesData.find((r) => r.slug === s))
    .filter((r): r is Role => Boolean(r));

  const pageUrl = `${
    process.env.NEXT_PUBLIC_APP_URL || "https://getresume-ai.vercel.app"
  }${BASE_PATH}/${data.slug}`;
  const hubUrl = `${
    process.env.NEXT_PUBLIC_APP_URL || "https://getresume-ai.vercel.app"
  }${BASE_PATH}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name:
          data.seo?.metaTitle ?? `${data.name} Resume Keywords | Get Resume AI`,
        description: data.description,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item:
              process.env.NEXT_PUBLIC_APP_URL ||
              "https://getresume-ai.vercel.app",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Resume Keyword Checker",
            item: hubUrl,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: data.name,
            item: pageUrl,
          },
        ],
      },
      ...(hasItems(data.faqs)
        ? [
            {
              "@type": "FAQPage",
              mainEntity: data.faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <AuthModalProvider>
      <div className="min-h-screen bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
        />

        {/* Global Navigation matching Home & Landing pages */}
        <nav className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/75">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 lg:px-8">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight sm:text-xl"
            >
              Resume<span className="text-primary">AI</span>
            </Link>
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

        {/* Visible Breadcrumbs Trail */}
        <nav
          aria-label="Breadcrumb"
          className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8"
        >
          <ol className="flex items-center space-x-2 text-xs text-muted-foreground">
            <li>
              <Link
                href="/"
                className="transition-colors hover:text-foreground"
              >
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                href={BASE_PATH}
                className="transition-colors hover:text-foreground"
              >
                Keyword Checker
              </Link>
            </li>
            <li>/</li>
            <li
              className="truncate font-medium text-foreground"
              aria-current="page"
            >
              {data.name}
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <section className="relative overflow-hidden border-b border-border/60 py-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_60%)]" />
          </div>

          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              ATS Keyword Library
            </p>

            <h1 className="font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {data.name} Resume Keywords
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">
              {data.description}
            </p>
          </div>
        </section>

        <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          {/* Keyword Categories */}
          <section className="mb-14">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Keywords by Category
                </h2>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Add these exact terms into your experience and skills sections
                </p>
              </div>
              <Tag className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>

            <div className="space-y-4">
              {data.categories.map((cat) => (
                <div
                  key={cat.categoryName}
                  className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-xs) sm:p-6"
                >
                  <h3 className="mb-3.5 flex items-center gap-2 text-sm font-semibold tracking-wide text-foreground uppercase text-primary sm:text-xs">
                    <span>{cat.categoryName}</span>
                    <span className="text-muted-foreground/60 text-xs font-normal lowercase">
                      ({cat.keywords.length} terms)
                    </span>
                  </h3>
                  <ul className="flex flex-wrap gap-2 sm:gap-2.5">
                    {cat.keywords.map((keyword) => (
                      <li
                        key={keyword}
                        className="rounded-lg border border-border/80 bg-secondary/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-secondary sm:text-sm"
                      >
                        {keyword}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ATS Optimization Tips */}
          {hasItems(data.tips) && (
            <section className="mb-14 rounded-2xl border border-border bg-secondary/30 p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lightbulb className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-mono text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    How to Use These {data.name} Keywords
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Best practices to pass ATS filters without stuffing
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-3">
                {data.tips.map((tip) => (
                  <li
                    key={tip}
                    className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground sm:text-base"
                  >
                    <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-approved" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Hero CTA Box */}
          <section className="relative mb-14 overflow-hidden rounded-3xl bg-primary p-8 text-center text-primary-foreground shadow-(--shadow-md) sm:p-12">
            <div className="mx-auto max-w-xl">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Instant Scan
              </span>
              <h2 className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
                Check Your Resume for {data.name} Keywords
              </h2>
              <p className="mt-3 text-sm text-primary-foreground/80 sm:text-base">
                Upload your resume and paste a job description. We’ll show you
                the exact keywords you are missing with a detailed ATS score.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/#upload"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-background px-7 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-background/90 sm:w-auto"
                >
                  Scan My Resume Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-3 text-[11px] text-primary-foreground/70">
                No credit card required • 3 free scans included
              </p>
            </div>
          </section>

          {/* FAQs */}
          {hasItems(data.faqs) && (
            <section className="mb-14">
              <h2 className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Frequently Asked Questions
              </h2>
              <div className="mt-5 divide-y divide-border rounded-2xl border border-border bg-card px-5 sm:px-6">
                {data.faqs.map((faq, idx) => (
                  <details
                    key={faq.q}
                    open={idx === 0}
                    className="group py-4 sm:py-5 [&::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground focus-visible:outline-none">
                      <span className="text-sm sm:text-base">{faq.q}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Role Checkers Internal Links */}
          {hasItems(relatedRoles) && (
            <nav aria-label="Role-specific ATS checkers" className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <h2 className="font-mono text-lg font-semibold tracking-tight text-foreground">
                  ATS Checkers for {data.name} Roles
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {relatedRoles.map((r) => (
                  <Link
                    key={r.slug}
                    href={`${ROLE_PATH}/${r.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-border bg-card p-3.5 text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:bg-secondary/50 shadow-(--shadow-xs)"
                  >
                    <span>{r.title}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </nav>
          )}

          {/* Related Industries Internal Links */}
          {hasItems(relatedIndustries) && (
            <nav aria-label="Related industries" className="mb-14">
              <div className="mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h2 className="font-mono text-lg font-semibold tracking-tight text-foreground">
                  Keywords for Related Industries
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {relatedIndustries.map((i) => (
                  <Link
                    key={i.slug}
                    href={`${BASE_PATH}/${i.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-border bg-card p-3.5 text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:bg-secondary/50 shadow-(--shadow-xs)"
                  >
                    <span>{i.name}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </main>

        <SiteFooter />
      </div>
    </AuthModalProvider>
  );
}
