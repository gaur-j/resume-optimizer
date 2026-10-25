// app/ats-resume-checker/[slug]/page.tsx
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import rawRoles from "@/data/ats-roles.json";
import type { Role } from "@/types/role";

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

// ---------- Small presentational pieces ----------

function Card({
  title,
  titleClassName = "text-primary text-xs sm:text-sm text-foreground",
  children,
}: {
  title: string;
  titleClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-secondary-foreground p-6 rounded-2xl border border-border shadow-sm">
      <h2 className={`text-xl font-semibold mb-3 uppercase ${titleClassName}`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Pills({ items, className }: { items: string[]; className: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`text-sm px-3 py-1 rounded ${className}`}>
          {item}
        </span>
      ))}
    </div>
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
    <main className="max-w-4xl mx-auto px-4 py-12">
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
        />
      )}

      {/* Hero */}
      <header className="text-center mb-10">
        <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
          ATS Optimization Guide &amp; Checker
        </span>
        <h1 className="text-4xl font-bold mt-4 mb-2">
          Free ATS Resume Checker for {plural}
        </h1>
        <p className="text-gray-600 text-lg">
          {role.title} roles require specific keywords. Our AI scans your resume
          against real {role.industry} job descriptions.
        </p>
      </header>

      {/* Core keyword data */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card title="Top Required Hard Skills" titleClassName="text-correction">
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            {role.topSkills.map((skill) => (
              <li key={skill}>
                <strong>{skill}</strong>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Recommended Action Verbs" titleClassName="text-green-600">
          <Pills
            items={role.actionVerbs}
            className="bg-gray-100 text-gray-800"
          />
        </Card>
      </div>

      {/* Optional keyword groups */}
      {(hasItems(role.softSkills) ||
        hasItems(role.tools) ||
        hasItems(role.certifications)) && (
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {hasItems(role.softSkills) && (
            <Card title="Soft Skills">
              <Pills
                items={role.softSkills}
                className="bg-purple-50 text-purple-800"
              />
            </Card>
          )}
          {hasItems(role.tools) && (
            <Card title="Tools to List">
              <Pills items={role.tools} className="bg-blue-50 text-blue-800" />
            </Card>
          )}
          {hasItems(role.certifications) && (
            <Card title="Certifications">
              <Pills
                items={role.certifications}
                className="bg-amber-50 text-amber-800"
              />
            </Card>
          )}
        </div>
      )}

      {/* Tips and mistakes */}
      {(hasItems(role.atsTips) || hasItems(role.commonMistakes)) && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {hasItems(role.atsTips) && (
            <Card title={`ATS Tips for ${plural}`}>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {role.atsTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </Card>
          )}
          {hasItems(role.commonMistakes) && (
            <Card title="Common Mistakes to Avoid">
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {role.commonMistakes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Sample bullets */}
      {hasItems(role.sampleBullets) && (
        <div className="mb-6">
          <Card title={`Sample ${role.title} Resume Bullets`}>
            <ul className="space-y-3">
              {role.sampleBullets.map((bullet) => (
                <li
                  key={bullet}
                  className="border-l-4 border-blue-200 pl-4 text-gray-700"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-2xl text-center my-12">
        <h2 className="text-2xl font-bold mb-3">
          Test Your {role.title} Resume Now
        </h2>
        <p className="mb-6 text-blue-100">
          Upload your PDF resume and paste a job description to get an instant
          ATS score.
        </p>
        <Link
          href="/#upload"
          className="inline-block bg-white text-blue-600 font-bold px-8 py-3 rounded-xl shadow hover:bg-blue-50 transition"
        >
          Run Free ATS Scan
        </Link>
      </div>

      {/* FAQs (visible content must match the JSON-LD above) */}
      {hasItems(role.faqs) && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{role.title} Resume FAQs</h2>
          <div className="space-y-3">
            {role.faqs.map((faq) => (
              <details
                key={faq.q}
                className="bg-white border rounded-xl p-4 shadow-sm group"
              >
                <summary className="font-semibold cursor-pointer text-gray-500">
                  {faq.q}
                </summary>
                <p className="mt-2 text-gray-700">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Internal links to related roles */}
      {hasItems(relatedRoles) && (
        <nav aria-label="Related roles">
          <h2 className="text-xl font-semibold mb-3">Related ATS Checkers</h2>
          <ul className="flex flex-wrap gap-3">
            {relatedRoles.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`${BASE_PATH}/${r.slug}`}
                  className="inline-block border rounded-lg px-4 py-2 text-blue-700 hover:bg-blue-50 transition"
                >
                  {r.title} Resume Checker
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}
