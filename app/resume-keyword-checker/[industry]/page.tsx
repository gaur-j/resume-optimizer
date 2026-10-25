// app/resume-keywords/[industry]/page.tsx
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import rawIndustries from "@/data/industries-keywords.json";
import rawRoles from "@/data/ats-roles.json";
import type { Industry } from "@/types/industry";
import type { Role } from "@/types/role";

const industriesData = rawIndustries as Industry[];
const rolesData = rawRoles as Role[];

const BASE_PATH = "/resume-keywords";
const ROLE_PATH = "/ats-resume-checker";

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

// Prevents "</script>" inside data from breaking out of the JSON-LD tag
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// ---------- Static generation ----------

// Only slugs present in the JSON exist; anything else returns 404
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

// ---------- Page ----------

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

  const faqJsonLd = hasItems(data.faqs)
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: data.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
        />
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          {data.name} Resume Keywords Guide
        </h1>
        <p className="text-gray-600">{data.description}</p>
      </header>

      {/* Keyword categories */}
      <div className="space-y-4 mb-10">
        {data.categories.map((cat) => (
          <section
            key={cat.categoryName}
            className="bg-white p-5 rounded-lg border"
          >
            <h2 className="font-semibold text-lg text-gray-900 mb-3">
              {cat.categoryName}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {cat.keywords.map((keyword) => (
                <li
                  key={keyword}
                  className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded"
                >
                  {keyword}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Tips */}
      {hasItems(data.tips) && (
        <section className="bg-white p-6 rounded-lg border mb-10">
          <h2 className="text-xl font-semibold mb-3">
            How to Use These {data.name} Keywords
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {data.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-2xl text-center mb-12">
        <h2 className="text-2xl font-bold mb-3">
          Check Your Resume for {data.name} Keywords
        </h2>
        <p className="mb-6 text-blue-100">
          Upload your PDF resume and paste a job description to see which
          keywords you are missing.
        </p>
        <Link
          href="/#upload"
          className="inline-block bg-white text-blue-600 font-bold px-8 py-3 rounded-xl shadow hover:bg-blue-50 transition"
        >
          Run Free ATS Scan
        </Link>
      </div>

      {/* FAQs (visible content must match the JSON-LD above) */}
      {hasItems(data.faqs) && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            {data.name} Resume Keyword FAQs
          </h2>
          <div className="space-y-3">
            {data.faqs.map((faq) => (
              <details
                key={faq.q}
                className="bg-white border rounded-xl p-4 shadow-sm"
              >
                <summary className="font-semibold cursor-pointer">
                  {faq.q}
                </summary>
                <p className="mt-2 text-gray-700">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Internal links: role checkers */}
      {hasItems(relatedRoles) && (
        <nav aria-label="Role-specific ATS checkers" className="mb-8">
          <h2 className="text-xl font-semibold mb-3">
            ATS Checkers for {data.name} Roles
          </h2>
          <ul className="flex flex-wrap gap-3">
            {relatedRoles.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`${ROLE_PATH}/${r.slug}`}
                  className="inline-block border rounded-lg px-4 py-2 text-blue-700 hover:bg-blue-50 transition"
                >
                  {r.title} Resume Checker
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Internal links: other industries */}
      {hasItems(relatedIndustries) && (
        <nav aria-label="Related industries">
          <h2 className="text-xl font-semibold mb-3">
            Keywords for Related Industries
          </h2>
          <ul className="flex flex-wrap gap-3">
            {relatedIndustries.map((i) => (
              <li key={i.slug}>
                <Link
                  href={`${BASE_PATH}/${i.slug}`}
                  className="inline-block border rounded-lg px-4 py-2 text-blue-700 hover:bg-blue-50 transition"
                >
                  {i.name} Resume Keywords
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}
