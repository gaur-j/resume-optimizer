// app/ats-resume-checker/page.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Layers,
  FileText,
  CheckCircle2,
} from "lucide-react";

import rawRoles from "@/data/ats-roles.json";
import type { Role } from "@/types/role";
import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { AuthCTAButton, NavAuthLink } from "@/components/auth/AuthTriggers";
import { SiteFooter } from "@/components/SiteFooter";
import { ATSPreview } from "@/components/marketing/ATSPreview";

const rolesData = rawRoles as Role[];

const CATEGORY_NAMES: Record<string, string> = {
  engineering: "Engineering & Tech",
  data: "Data & Analytics",
  design: "Product & UI/UX Design",
  product: "Product Management",
  marketing: "Marketing & Growth",
  sales: "Sales & Account Management",
  finance: "Finance & Banking",
  accounting: "Accounting & Audit",
  healthcare: "Healthcare & Medicine",
  nursing: "Nursing & Clinical",
  "life-sciences": "Life Sciences & Biotech",
  education: "Education & Academia",
  legal: "Legal & Compliance",
  hr: "Human Resources & Recruiting",
  operations: "Operations & Logistics",
  construction: "Construction & Real Estate",
  hospitality: "Hospitality & Tourism",
  retail: "Retail & E-commerce",
  "public-sector": "Public Sector & Non-profit",
  media: "Media & Communications",
  energy: "Energy & Utilities",
  support: "Customer Success & Support",
};

export default function AtsResumeCheckerHubPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Group roles by category
  const categories = useMemo(() => {
    const map = new Map<string, Role[]>();
    for (const role of rolesData) {
      const cat = role.category || "other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(role);
    }
    return map;
  }, []);

  const allCategoryKeys = useMemo(
    () => Array.from(categories.keys()),
    [categories]
  );

  // Filter roles by category and search
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result: { key: string; label: string; roles: Role[] }[] = [];

    for (const [key, roles] of categories.entries()) {
      if (selectedCategory !== "all" && selectedCategory !== key) continue;

      const matching = roles.filter(
        (r) =>
          !q ||
          r.title.toLowerCase().includes(q) ||
          (r.topSkills ?? []).some((s) => s.toLowerCase().includes(q))
      );

      if (matching.length > 0) {
        result.push({
          key,
          label:
            CATEGORY_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1),
          roles: matching,
        });
      }
    }

    return result;
  }, [categories, searchQuery, selectedCategory]);

  const totalMatches = useMemo(
    () => filteredCategories.reduce((acc, c) => acc + c.roles.length, 0),
    [filteredCategories]
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "ATS Resume Checker by Job Role",
        description:
          "Free ATS resume checker tailored for 250+ specific job roles. Review missing keywords and formatting standards.",
        url: "https://getresume-ai.vercel.app/ats-resume-checker",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://getresume-ai.vercel.app/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "ATS Resume Checker",
            item: "https://getresume-ai.vercel.app/ats-resume-checker",
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is the ATS resume checker free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, you can run a free ATS scan without entering credit card details.",
            },
          },
          {
            "@type": "Question",
            name: "Does an ATS reject resumes automatically?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Most ATS platforms parse and score resumes for recruiters to search. Low keyword alignment means you rank lower in search filters.",
            },
          },
        ],
      },
    ],
  };

  return (
    <AuthModalProvider>
      <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        {/* Navigation */}
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

        {/* Hero Section */}
        <header className="relative mx-auto max-w-5xl px-4 pt-12 pb-8 text-center sm:px-6 sm:pt-16">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />

          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur-sm">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>259 Role Guides • Verified ATS Screening Rules</span>
          </div>

          <h1 className="mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Free ATS Resume Checker for Your Role
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Check your resume against ATS algorithms like Workday and
            Greenhouse. Select your exact role below for tailored keyword
            breakdowns and parser rules.
          </p>
        </header>

        {/* Interactive Quick Scan Card */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ATSPreview />
        </div>

        {/* Role Directory Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="border-t border-border pt-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
                  Browse ATS Checkers by Role
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing {totalMatches} role guides across{" "}
                  {filteredCategories.length} categories
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search role or skill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Category filter pills */}
            <div className="mt-6 flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                All Categories ({rolesData.length})
              </button>
              {allCategoryKeys.map((catKey) => {
                const count = categories.get(catKey)?.length || 0;
                const label = CATEGORY_NAMES[catKey] || catKey;
                return (
                  <button
                    key={catKey}
                    onClick={() => setSelectedCategory(catKey)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedCategory === catKey
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Categorized Grid */}
            <div className="mt-10 space-y-12">
              {filteredCategories.map((group) => (
                <div key={group.key} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <h3 className="font-mono text-lg font-semibold tracking-wide text-foreground">
                      {group.label}
                    </h3>
                    <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {group.roles.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {group.roles.map((role) => (
                      <Link
                        key={role.slug}
                        href={`/ats-resume-checker/${role.slug}`}
                        className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-secondary/40 hover:shadow-sm"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary">
                              {role.title}
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-primary" />
                          </div>
                          {role.topSkills && role.topSkills.length > 0 && (
                            <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                              {role.topSkills.slice(0, 3).join(" • ")}
                            </p>
                          )}
                        </div>
                        <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] text-primary/80">
                          <CheckCircle2 className="h-3 w-3" />
                          ATS Keywords & Score
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {filteredCategories.length === 0 && (
                <div className="rounded-xl border border-dashed border-border py-12 text-center">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-2 text-sm font-medium text-foreground">
                    No matching roles found
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try adjusting your search query or reset the category
                    filter.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </AuthModalProvider>
  );
}
