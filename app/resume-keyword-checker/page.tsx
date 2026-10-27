// app/resume-keyword-checker/page.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Tag,
  FileText,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

import rawIndustries from "@/data/industries-keywords.json";
import type { Industry } from "@/types/industry";
import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { AuthCTAButton, NavAuthLink } from "@/components/auth/AuthTriggers";
import { SiteFooter } from "@/components/SiteFooter";
import { ATSPreview } from "@/components/marketing/ATSPreview";

const industriesData = rawIndustries as Industry[];
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://getresume-ai.vercel.app";
const BASE_PATH = "/resume-keyword-checker";

// The 23 major broad industry sectors from your dataset
const CORE_SECTOR_SLUGS = new Set([
  "technology",
  "data-ai",
  "design",
  "product-management",
  "marketing",
  "sales",
  "finance",
  "accounting",
  "healthcare",
  "nursing",
  "pharma-biotech",
  "education",
  "legal",
  "human-resources",
  "operations-supply-chain",
  "manufacturing-engineering",
  "construction",
  "hospitality",
  "retail-e-commerce",
  "government-public-sector",
  "media-entertainment",
  "energy-utilities",
  "customer-support",
]);

export default function ResumeKeywordCheckerHubPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "core" | "specialized"
  >("all");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Filter industries based on query and filter tab
  const filteredIndustries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return industriesData.filter((item) => {
      const isCore = CORE_SECTOR_SLUGS.has(item.slug);
      if (activeFilter === "core" && !isCore) return false;
      if (activeFilter === "specialized" && isCore) return false;

      if (!q) return true;
      if (item.name.toLowerCase().includes(q)) return true;
      if (item.description.toLowerCase().includes(q)) return true;

      return item.categories.some((cat) =>
        cat.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, activeFilter]);

  // Group filtered industries alphabetically for structured scanning
  const groupedByLetter = useMemo(() => {
    const groups: Record<string, Industry[]> = {};
    for (const item of filteredIndustries) {
      const firstChar = item.name.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : "#";
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(item);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredIndustries]);

  // Complete Schema.org Graph for Google: CollectionPage + BreadcrumbList + FAQPage
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Resume Keyword Checker by Industry & Job Title",
        description:
          "Find high-impact resume keywords for 280+ industries and roles. Scan your resume against job postings to identify missing hard skills and boost your ATS score.",
        url: `${APP_URL}${BASE_PATH}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${APP_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Resume Keyword Checker",
            item: `${APP_URL}${BASE_PATH}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Why do resume keywords matter for ATS screening?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Applicant Tracking Systems (ATS) scan resumes for specific skills, certifications, and tools requested in the job description. Resumes with higher contextual keyword overlap rank higher in recruiter searches.",
            },
          },
          {
            "@type": "Question",
            name: "Should I use exact-match keywords or synonyms?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Whenever natural, include both the acronym and full term (e.g., 'Search Engine Optimization (SEO)' or 'Certified Public Accountant (CPA)'). Modern ATS search engines index both variations.",
            },
          },
          {
            "@type": "Question",
            name: "Is keyword stuffing penalized by ATS?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. ATS parsers detect unnatural repetition, and human recruiters quickly reject resumes with disconnected keyword lists. Always integrate keywords into achievement-driven bullet points.",
            },
          },
          {
            "@type": "Question",
            name: "How often should I tailor my keywords?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You should tailor your resume keywords for every single job application, matching the specific tools and responsibilities highlighted in that job posting.",
            },
          },
        ],
      },
    ],
  };

  const educationalSections = [
    {
      title: "Why ATS Keywords Matter",
      body: "Recruiters frequently filter hundreds of resumes using keyword queries in tools like Workday, Taleo, and Greenhouse. If your resume lacks the exact hard skills and tools from the job posting, your application may never reach human eyes.",
    },
    {
      title: "Where to Place Keywords on Your Resume",
      body: "The strongest resume format places high-priority technical skills in a dedicated Skills section, and then reinforces them with metrics in your Work Experience bullets (e.g. 'Engineered scalable REST APIs using Python & PostgreSQL, cutting response latency by 35%').",
    },
    {
      title: "Exact Match vs. Acronyms & Synonyms",
      body: "Some legacy ATS systems only match literal strings, while modern parsers use semantic matching. To be safe, write out the full term alongside its standard acronym on first reference (e.g. 'Amazon Web Services (AWS)', 'Kubernetes (K8s)').",
    },
  ];

  const faqs = [
    {
      q: "How many keywords should my resume include?",
      a: "There is no fixed quota. Aim to naturally reflect the top 60–80% of required hard skills and tools from the target job posting without cluttering your narrative.",
    },
    {
      q: "Does this keyword checker support specialized industries?",
      a: "Yes. Our database covers over 280 specialized fields, from Cloud Engineering and Data Science to Clinical Nursing, Construction Management, and Corporate Law.",
    },
    {
      q: "Can I use white text or hidden keywords?",
      a: "Never use invisible text or white font. Modern ATS parsers extract raw text into plain text strings where hidden blocks become immediately apparent, resulting in automatic disqualification.",
    },
    {
      q: "What is the difference between hard skills and soft skills in ATS?",
      a: "ATS search filters focus primarily on hard skills (programming languages, certifications, ERP tools, methodologies). Soft skills (leadership, teamwork) are best demonstrated through accomplishments in your bullet points.",
    },
  ];

  return (
    <AuthModalProvider>
      <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
        {/* Unified Schema: CollectionPage + BreadcrumbList + FAQPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        {/* Global Navigation */}
        <nav className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 lg:px-8">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight sm:text-xl"
            >
              Resume<span className="text-primary">AI</span>
            </Link>
            <div className="flex items-center gap-2">
              <NavAuthLink
                mode="login"
                className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground sm:text-sm"
              >
                Log in
              </NavAuthLink>
              <AuthCTAButton
                mode="signup"
                className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold shadow-sm hover:bg-primary/90 sm:h-10 sm:px-4 sm:text-sm"
              >
                Get Started Free
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
            <li
              className="truncate font-medium text-foreground"
              aria-current="page"
            >
              Resume Keyword Checker
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <header className="relative mx-auto max-w-5xl px-4 pt-10 pb-8 text-center sm:px-6 sm:pt-14">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />

          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur-sm">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <span>282 Industry & Role Guides • High-Impact Keywords</span>
          </div>

          <h1 className="mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Resume Keyword Checker for Any Industry
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Discover the high-priority skills, technical tools, and action verbs
            recruiters search for in your field. Select your industry or test
            your resume below.
          </p>
        </header>

        {/* Interactive Quick Scan Card */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ATSPreview />
        </div>

        {/* Industry Directory Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="border-t border-border pt-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
                  Browse Keywords by Industry & Field
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing {filteredIndustries.length} guides across 280+ career
                  sectors
                </p>
              </div>

              {/* Real-time Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search industry, role, or tool..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Filter buttons */}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                  activeFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                All Industries ({industriesData.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("core")}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                  activeFilter === "core"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                Major Sectors ({CORE_SECTOR_SLUGS.size})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("specialized")}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                  activeFilter === "specialized"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                Specialized Roles & Niches (
                {industriesData.length - CORE_SECTOR_SLUGS.size})
              </button>
            </div>

            {/* Categorized A–Z Grid */}
            <div className="mt-10 space-y-12">
              {groupedByLetter.map(([letter, items]) => (
                <div key={letter} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary font-mono text-sm font-semibold text-primary">
                      {letter}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {items.length}{" "}
                      {items.length === 1 ? "industry" : "industries"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {items.map((item) => {
                      const totalKeywords = item.categories.reduce(
                        (sum, c) => sum + c.keywords.length,
                        0
                      );
                      const previewKeywords =
                        item.categories[0]?.keywords.slice(0, 3) || [];

                      return (
                        <Link
                          key={item.slug}
                          href={`${BASE_PATH}/${item.slug}`}
                          className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-secondary/40 hover:shadow-sm"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-semibold text-foreground group-hover:text-primary">
                                {item.name}
                              </span>
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-primary" />
                            </div>

                            {previewKeywords.length > 0 && (
                              <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                                {previewKeywords.join(" • ")}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-primary/80">
                              <CheckCircle2 className="h-3 w-3" />
                              {totalKeywords} Keywords
                            </span>
                            <span className="text-[11px] text-muted-foreground group-hover:text-foreground">
                              View Guide →
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredIndustries.length === 0 && (
                <div className="rounded-xl border border-dashed border-border py-12 text-center">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-2 text-sm font-medium text-foreground">
                    No matching industries or keywords found
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try searching for another skill, tool, or reset your search
                    query.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Educational Guide Cards */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 font-mono text-xs text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5 text-primary" />
                <span>ATS Optimization Guide</span>
              </div>
              <h2 className="mt-3 font-mono text-2xl font-bold tracking-tight sm:text-3xl">
                How to Master Keyword Optimization
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Follow proven best practices to pass algorithmic screening and
                impress human hiring managers.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {educationalSections.map((sec, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
                >
                  <h3 className="font-mono text-base font-semibold text-foreground">
                    {sec.title}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {sec.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need to know about ATS resume keyword matching.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border border-border bg-card transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-foreground hover:bg-secondary/40 sm:p-5"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-border/60 bg-muted/20 px-4 py-3.5 text-xs leading-relaxed text-muted-foreground sm:px-5 sm:py-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Cross-Link Callout to Role Checkers */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:p-8">
            <div>
              <h3 className="font-mono text-lg font-bold text-foreground">
                Looking for specific job role screening rules?
              </h3>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Explore our ATS Resume Checker with 250+ role-tailored guides,
                parser breakdowns, and formatting checklists.
              </p>
            </div>
            <Link
              href="/ats-resume-checker"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Browse Role Checkers
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Global Footer */}
        <SiteFooter />
      </div>
    </AuthModalProvider>
  );
}
