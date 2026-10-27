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
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://getresume-ai.vercel.app";

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
  id,
  icon: Icon,
  title,
  subtitle,
  children,
  className = "",
}: {
  id?: string;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-border bg-card p-6 shadow-sm transition-all ${className}`}
    >
      <div className="mb-4 flex items-center gap-2">
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <h2 className="font-mono text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
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

  const pageUrl = `${APP_URL}${BASE_PATH}/${role.slug}`;
  const hubUrl = `${APP_URL}${BASE_PATH}`;

  // Complete Graph Schema: WebPage + BreadcrumbList + FAQPage
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `Free ATS Resume Checker for ${plural}`,
        description:
          role.seo?.metaDescription ??
          `Optimize your ${role.title} resume for ATS parsers. Discover required hard skills, missing keywords, and formatting fixes.`,
        isPartOf: {
          "@type": "WebSite",
          "@id": `${APP_URL}/#website`,
          url: APP_URL,
          name: "Get ResumeAI",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: APP_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "ATS Resume Checker",
            item: hubUrl,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${role.title} Resume Checker`,
            item: pageUrl,
          },
        ],
      },
      ...(hasItems(role.faqs)
        ? [
            {
              "@type": "FAQPage",
              "@id": `${pageUrl}#faq`,
              mainEntity: role.faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: f.a,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <AuthModalProvider>
      <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
        {/* Unified JSON-LD: WebPage + BreadcrumbList + FAQPage */}
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
                ATS Checker
              </Link>
            </li>
            <li>/</li>
            <li
              className="truncate font-medium text-foreground"
              aria-current="page"
            >
              {role.title}
            </li>
          </ol>
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

          <header className="mx-auto max-w-4xl px-4 pb-12 pt-8 text-center sm:px-6 sm:pb-16 sm:pt-12">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              ATS Optimization Guide &amp; Scanner
            </span>
            <h1 className="mt-3 text-balance font-mono text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Free ATS Resume Checker for {plural}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {role.title} roles require role-specific ATS keywords. Scan your
              resume against recruiter benchmarks for {plural.toLowerCase()} and
              fix missing terms before applying.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/#upload"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                <FileSearch className="mr-2 h-4 w-4" />
                Scan My Resume Now
              </Link>
              <Link
                href="#skills"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                View Keyword Checklist
              </Link>
            </div>
          </header>
        </section>

        {/* Content Container */}
        <main className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 sm:py-16">
          {/* Top Skills Pill Grid */}
          {hasItems(role.topSkills) && (
            <SectionCard
              id="skills"
              icon={Sparkles}
              title={`Critical ATS Keywords for ${plural}`}
              subtitle="Parsers scan specifically for these skills in your work experience and skills sections."
            >
              <div className="flex flex-wrap gap-2">
                {role.topSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary sm:text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Action Verbs */}
          {hasItems(role.actionVerbs) && (
            <SectionCard
              icon={BookOpen}
              title="Recommended Action Verbs"
              subtitle="Begin bullet points with these verbs to improve ATS readability and recruiter impact."
            >
              <div className="flex flex-wrap gap-2">
                {role.actionVerbs.map((verb) => (
                  <span
                    key={verb}
                    className="inline-flex items-center rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {verb}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Tools & Technologies */}
          {hasItems(role.tools) && (
            <SectionCard
              icon={Wrench}
              title="Standard Tools &amp; Technologies"
              subtitle="Ensure relevant software appears verbatim in your technical skills block."
            >
              <div className="flex flex-wrap gap-2">
                {role.tools.map((tool) => (
                  <span
                    key={tool}
                    className="inline-flex items-center rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Soft Skills & Certifications Side-by-Side */}
          {(hasItems(role.softSkills) || hasItems(role.certifications)) && (
            <div className="grid gap-6 md:grid-cols-2">
              {hasItems(role.softSkills) && (
                <SectionCard
                  icon={Layers}
                  title="Valued Soft Skills"
                  subtitle="Contextualize these in your achievement bullets."
                >
                  <ul className="space-y-2">
                    {role.softSkills.map((skill) => (
                      <li
                        key={skill}
                        className="flex items-center text-xs text-muted-foreground sm:text-sm"
                      >
                        <CheckCircle2 className="mr-2 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              {hasItems(role.certifications) && (
                <SectionCard
                  icon={Award}
                  title="Target Certifications"
                  subtitle="Commonly filtered certifications for this role."
                >
                  <ul className="space-y-2">
                    {role.certifications.map((cert) => (
                      <li
                        key={cert}
                        className="flex items-center text-xs text-muted-foreground sm:text-sm"
                      >
                        <Award className="mr-2 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}
            </div>
          )}

          {/* ATS Tips & Common Pitfalls Side-by-Side */}
          <div className="grid gap-6 md:grid-cols-2">
            {hasItems(role.atsTips) && (
              <SectionCard
                icon={CheckCircle2}
                title="Formatting &amp; Optimization Tips"
                subtitle="Guidelines to clear ATS parsing algorithms."
                className="border-primary/20 bg-primary/[0.02]"
              >
                <ul className="space-y-2.5">
                  {role.atsTips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start text-xs text-muted-foreground sm:text-sm"
                    >
                      <span className="mr-2 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
                        ✓
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {hasItems(role.commonMistakes) && (
              <SectionCard
                icon={AlertCircle}
                title="Common ATS Mistakes to Avoid"
                subtitle="Errors that cause automatic applicant rejections."
                className="border-destructive/20 bg-destructive/[0.02]"
              >
                <ul className="space-y-2.5">
                  {role.commonMistakes.map((mistake, i) => (
                    <li
                      key={i}
                      className="flex items-start text-xs text-muted-foreground sm:text-sm"
                    >
                      <span className="mr-2 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive/20 text-[10px] font-semibold text-destructive">
                        ✕
                      </span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}
          </div>

          {/* Sample High-Scoring Bullets */}
          {hasItems(role.sampleBullets) && (
            <SectionCard
              icon={Sparkles}
              title={`High-Scoring Resume Bullets for ${plural}`}
              subtitle="Use these battle-tested phrasing examples as inspiration for your work history."
            >
              <div className="space-y-3">
                {role.sampleBullets.map((bullet, i) => (
                  <div
                    key={i}
                    className="rounded-xl border-l-4 border-l-primary bg-secondary/30 p-4 text-xs leading-relaxed text-foreground sm:text-sm"
                  >
                    &ldquo;{bullet}&rdquo;
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Mid-Page Scan CTA Banner */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center sm:p-10">
            <h2 className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Ready to Test Your {role.title} Resume?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
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
                <h2 className="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">
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
                    <span className="truncate text-xs font-medium text-foreground transition-colors group-hover:text-primary sm:text-sm">
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
