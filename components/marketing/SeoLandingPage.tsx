import Link from "next/link";

import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { AuthCTAButton } from "@/components/auth/AuthTriggers";
import { SiteFooter } from "@/components/SiteFooter";
import { ATSPreview } from "@/components/marketing/ATSPreview";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://getresume-ai.vercel.app";

export type LandingSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LandingFaq = { q: string; a: string };

export type RelatedLink = { href: string; label: string };

type Props = {
  path: string;
  title: string;
  h1: string;
  intro: string;
  sections: LandingSection[];
  faqs: LandingFaq[];
  related: RelatedLink[];
};

export function SeoLandingPage({
  path,
  title,
  h1,
  intro,
  sections,
  faqs,
  related,
}: Props) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
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
            name: title,
            item: `${APP_URL}${path}`,
          },
        ],
      },
    ],
  };

  return (
    <AuthModalProvider>
      <div className="min-h-screen overflow-x-hidden bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <nav className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/75">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 lg:px-8">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight sm:text-xl"
            >
              Resume<span className="text-primary">AI</span>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <AuthCTAButton
                mode="signup"
                className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold shadow-sm transition-colors hover:bg-primary/90 sm:h-10 sm:px-4 sm:text-sm"
              >
                Get Started Free
              </AuthCTAButton>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <header className="mx-auto max-w-3xl px-4 pb-8 pt-12 text-center sm:px-6 sm:pt-16">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {h1}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {intro}
          </p>
        </header>

        <ATSPreview />

        <main className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {section.heading}
              </h2>
              {section.paragraphs?.map((p) => (
                <p
                  key={p}
                  className="mt-3 leading-relaxed text-muted-foreground"
                >
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Frequently asked questions
            </h2>
            <div className="mt-4 space-y-5">
              {faqs.map((faq) => (
                <div key={faq.q}>
                  <h3 className="font-medium text-foreground">{faq.q}</h3>
                  <p className="mt-1 leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-border pt-8">
            <h2 className="text-lg font-semibold text-foreground">
              Related guides
            </h2>
            <ul className="mt-3 space-y-2">
              {related.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <SiteFooter />
      </div>
    </AuthModalProvider>
  );
}
