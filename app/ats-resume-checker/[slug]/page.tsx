// app/ats-resume-checker/[slug]/page.tsx
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  FileSearch,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Wrench,
  Award,
  BookOpen,
} from "lucide-react";

import rawRoles from "@/data/ats-roles.json";
import type { Role } from "@/types/role";
import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { AuthCTAButton, NavAuthLink } from "@/components/auth/AuthTriggers";
import { SiteFooter } from "@/components/SiteFooter";

const rolesData = rawRoles as Role[];
const BASE_PATH = "/ats-resume-checker";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ---------- Helpers ----------

function getRole(slug: string): Role | undefined {
  return rolesData.find((r) => r.slug === slug);
}

function getPlural(role: Role): string {
  return role.pluralTitle ?? `${role.title}s`;
}

function hasItems<T>(list?: T[]): list is T[] {
  return Array.isArray(list) && list.length > 0;
}

// Prevents "</script>" inside data from breaking out of the JSON-LD tag
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// ---------- Static generation ----------

// Only the slugs in the JSON exist; anything else returns 404
export const dynamicParams = false;

export async function generateStaticParams() {
  return rolesData.map((role) => ({ slug: role.slug }));
}

// ---------- SEO metadata ----------

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) return {};

  const plural = getPlural(role);
  const title =
    role.seo?.metaTitle ??
    `Free ATS Resume Checker for ${plural} | Get Resume AI`;
  const description =
    role.seo?.metaDescription ??
    `Optimize your ${role.title} resume for ATS parsers. Discover required hard skills, missing keywords, and formatting fixes to pass screening.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_PATH}/${role.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${BASE_PATH}/${role.slug}`,
    },
  };
}

// ---------- Reusable Card Component ----------

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
  className = "",
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-card p-6 shadow-sm transition-all ${className}`}
    >
      <div className="mb-4 flex items-center gap-2">
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

// ---------- Page ----------

export default async function RoleATSCheckerPage({ params }: PageProps) {
  const { slug } = await params;
  const role = getRole(slug);

  if (!role) notFound();

  const plural = getPlural(role);

  const relatedRoles = (role.relatedSlugs ?? [])
    .map((s) => getRole(s))
    .filter((r): r is Role => Boolean(r));

  const faqJsonLd = hasItems(role.faqs)
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: role.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <AuthModalProvider>
      <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
        {faqJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
          />
        )}

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

        {/* Hero Section with Radial Glow & Monospace Heading */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_60%)]" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                backgroundSize: "56px 56px",
              }}
            />
          </div>

          <header className="mx-auto max-w-4xl px-4 pb-12 pt-12 text-center sm:px-6 sm:pb-16 sm:pt-16">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              ATS Optimization Guide &amp; Scanner
            </span>
            <h1 className="mt-3 font-mono text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl text-balance">
              Free ATS Resume Checker for {plural}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {role.title} roles require role-specific ATS keywords. Scan your
              resume against real {role.industry} job descriptions to identify
              gaps before applying.
            </p>
          </header>
        </section>

        {/* Content Body */}
        <main className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6">
          {/* Core Keywords */}
          <div className="grid gap-6 md:grid-cols-2">
            <SectionCard
              icon={Sparkles}
              title="Top Required Hard Skills"
              subtitle="Critical keywords parsed by ATS filters"
            >
              <ul className="space-y-2.5">
                {role.topSkills.map((skill) => (
                  <li
                    key={skill}
                    className="flex items-center gap-2.5 text-sm font-medium text-foreground/90"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              icon={Layers}
              title="Recommended Action Verbs"
              subtitle="High-impact verbs for achievement bullets"
            >
              <div className="flex flex-wrap gap-2">
                {role.actionVerbs.map((verb) => (
                  <span
                    key={verb}
                    className="rounded-lg border border-border bg-secondary/60 px-3 py-1 font-mono text-xs sm:text-sm text-secondary-foreground transition-colors hover:border-primary/40"
                  >
                    {verb}
                  </span>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Optional Keyword Groups */}
          {(hasItems(role.softSkills) ||
            hasItems(role.tools) ||
            hasItems(role.certifications)) && (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {hasItems(role.softSkills) && (
                <SectionCard
                  icon={BookOpen}
                  title="Soft Skills"
                  subtitle="Interpersonal attributes"
                >
                  <div className="flex flex-wrap gap-2">
                    {role.softSkills.map((item) => (
                      <span
                        key={item}
                        className="rounded-lg border border-primary/20 bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}

              {hasItems(role.tools) && (
                <SectionCard
                  icon={Wrench}
                  title="Tools to List"
                  subtitle="Technical software & platforms"
                >
                  <div className="flex flex-wrap gap-2">
                    {role.tools.map((item) => (
                      <span
                        key={item}
                        className="rounded-lg border border-border bg-muted/60 px-2.5 py-1 font-mono text-xs text-foreground/90"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}

              {hasItems(role.certifications) && (
                <SectionCard
                  icon={Award}
                  title="Certifications"
                  subtitle="Recognized credentials"
                >
                  <div className="flex flex-wrap gap-2">
                    {role.certifications.map((item) => (
                      <span
                        key={item}
                        className="rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          )}

          {/* Tips & Common Mistakes */}
          {(hasItems(role.atsTips) || hasItems(role.commonMistakes)) && (
            <div className="grid gap-6 md:grid-cols-2">
              {hasItems(role.atsTips) && (
                <SectionCard
                  icon={CheckCircle2}
                  title={`ATS Tips for ${plural}`}
                  subtitle="Best practices for higher match rates"
                >
                  <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                    {role.atsTips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {hasItems(role.commonMistakes) && (
                <SectionCard
                  icon={AlertCircle}
                  title="Common Mistakes to Avoid"
                  subtitle="Formatting and content errors that hurt parsing"
                >
                  <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                    {role.commonMistakes.map((m) => (
                      <li key={m} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}
            </div>
          )}

          {/* Sample Bullets */}
          {hasItems(role.sampleBullets) && (
            <SectionCard
              icon={Sparkles}
              title={`Sample ${role.title} Resume Bullets`}
              subtitle="Formula: Action Verb + Context + Measurable Outcome"
            >
              <div className="space-y-3">
                {role.sampleBullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="rounded-xl border border-border/80 border-l-4 border-l-primary bg-muted/30 p-4 font-mono text-xs sm:text-sm leading-relaxed text-foreground/90"
                  >
                    {bullet}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Hero-matched CTA Card */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-12 text-center shadow-md">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_70%)]"
            />
            <h2 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Test Your {role.title} Resume Now
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Upload your PDF resume and target job description to get a
              comprehensive ATS score, matched/missing keywords, and instant AI
              bullet rewrites.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/#upload"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                <FileSearch className="mr-2 h-4 w-4" />
                Run Free ATS Scan
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              3 free scans · Instant results · No credit card required
            </p>
          </div>

          {/* FAQs Accordion */}
          {hasItems(role.faqs) && (
            <section className="space-y-4">
              <div>
                <h2 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {role.title} Resume FAQs
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Common questions on getting past ATS screening for{" "}
                  {plural.toLowerCase()}.
                </p>
              </div>

              <div className="space-y-3">
                {role.faqs.map((faq) => (
                  <details
                    key={faq.q}
                    className="group rounded-xl border border-border bg-card p-4 transition-colors"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-foreground">
                      <span className="text-sm sm:text-base">{faq.q}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 border-t border-border/60 pt-3 text-sm leading-relaxed text-muted-foreground">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Related Roles Navigation Grid */}
          {hasItems(relatedRoles) && (
            <nav
              aria-label="Related roles"
              className="space-y-4 border-t border-border pt-6"
            >
              <div>
                <h2 className="font-mono text-lg font-semibold tracking-tight text-foreground">
                  Related ATS Checkers
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Explore keyword optimizations for adjacent job roles.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {relatedRoles.map((r) => (
                  <Link
                    key={r.slug}
                    href={`${BASE_PATH}/${r.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-border bg-card p-3.5 transition-all hover:border-primary/50 hover:bg-secondary/40"
                  >
                    <span className="truncate text-xs sm:text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {r.title}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </main>

        {/* Global Footer */}
        <SiteFooter />
      </div>
    </AuthModalProvider>
  );
}
