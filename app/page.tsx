import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { AuthCTAButton, NavAuthLink } from "@/components/auth/AuthTriggers";
import { ChevronDown } from "lucide-react";

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
    icon: "🎯",
    title: "Keywords",
    desc: "Do you have the exact terms this job description is scanning for?",
  },
  {
    icon: "💼",
    title: "Experience",
    desc: "Are your achievements quantified and relevant to the role?",
  },
  {
    icon: "📐",
    title: "Formatting",
    desc: "Will ATS software actually be able to parse your resume?",
  },
  {
    icon: "🛠️",
    title: "Skills",
    desc: "Do your listed skills match what recruiters are filtering for?",
  },
];

export default function Home() {
  return (
    <AuthModalProvider>
      {/* overflow-x-hidden guards against the rotated hero card/stamp
          causing a horizontal scrollbar at narrow mobile widths */}
      <div className="min-h-screen bg-card overflow-x-hidden">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold">
              Resume<span className="text-primary">AI</span>
            </div>
            <div className="flex items-center gap-3">
              <NavAuthLink
                mode="login"
                className="px-4 py-2 text-muted-foreground hover:text-primary/90 text-sm font-medium"
              >
                Log in
              </NavAuthLink>
              <AuthCTAButton
                mode="signup"
                className="bg-primary hover:bg-primary/90 font-medium"
              >
                Get Started Free
              </AuthCTAButton>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Built for Indian job seekers
              </div>
              <h1 className="font-mono text-4xl sm:text-5xl font-semibold text-foreground mb-6 leading-[1.1] tracking-tight">
                Find out why ATS bots are rejecting your resume
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                Upload your resume and a job description. Get a real ATS score,
                missing keywords, and AI-rewritten bullet points — in under 2
                minutes, free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <AuthCTAButton
                  mode="signup"
                  size="lg"
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                >
                  Check My Resume — Free →
                </AuthCTAButton>
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-4">
                No credit card required · 3 free scans · results in under a
                minute
              </p>
            </div>

            {/* Signature: a resume snippet under audit, with a real
                correction and a stamped score — this is what the
                product actually does, shown rather than illustrated.
                Purely illustrative and already described in the prose
                above, so it's hidden from assistive tech to avoid
                announcing an out-of-context "78 ATS score". */}
            <div
              aria-hidden="true"
              className="relative motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700"
            >
              <div className="rounded-xl border border-border bg-card shadow-xl p-6 -rotate-1">
                <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-3">
                  Experience — Software Engineering Intern
                </div>
                <p className="text-muted-foreground/70 line-through decoration-correction decoration-2 mb-4 text-sm leading-relaxed">
                  Worked on React projects for the team
                </p>
                <div className="border-l-2 border-approved bg-approved/10 pl-3 py-2 rounded-r-md">
                  <p className="text-foreground text-sm leading-relaxed">
                    Led React frontend development for 3+ customer-facing apps,
                    cutting page load time by 40%
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-[11px] font-mono bg-secondary text-secondary-foreground px-2 py-1 rounded">
                    +quantified impact
                  </span>
                  <span className="text-[11px] font-mono bg-secondary text-secondary-foreground px-2 py-1 rounded">
                    +action verb
                  </span>
                </div>
              </div>

              {/* Score stamp */}
              <div className="absolute -top-5 -right-3 sm:-top-7 sm:-right-5 rotate-[8deg] motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-700 motion-safe:delay-300 motion-safe:fill-mode-both">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-[3px] border-approved bg-background shadow-lg flex flex-col items-center justify-center">
                  <span className="font-mono text-xl sm:text-2xl font-bold text-approved leading-none">
                    78
                  </span>
                  <span className="font-mono text-[8px] sm:text-[9px] tracking-[0.15em] text-approved mt-1">
                    ATS SCORE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="border-y border-border/50 bg-secondary py-6">
          <div className="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm text-muted-foreground">
            <span>
              ✓ Works with Naukri, LinkedIn &amp; company career pages
            </span>
            <span>✓ No data stored beyond your account</span>
            <span>✓ Built by a student, for students</span>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-mono text-3xl font-semibold tracking-tight text-center text-foreground mb-2">
              How it works
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Three steps, no downloads, no signup wall to see your score
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-mono font-semibold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Upload your resume
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drop in your resume text and the job description you&apos;re
                  targeting.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-mono font-semibold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Get your ATS score
                </h3>
                <p className="text-sm text-muted-foreground">
                  See exactly how ATS software reads your resume — keywords,
                  formatting, and content quality, scored separately.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-mono font-semibold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Fix it in one click
                </h3>
                <p className="text-sm text-muted-foreground">
                  Copy AI-rewritten bullet points that add the metrics and
                  keywords ATS bots are scanning for.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Category breakdown — inspired by how leading checkers present scoring */}
        <section className="bg-secondary py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-mono text-3xl font-semibold tracking-tight text-center text-foreground mb-2">
              One score isn&apos;t enough — so we don&apos;t give you just one
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Your score breaks down into four categories, so you know exactly
              what to fix instead of guessing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.title}
                  className="bg-card rounded-lg border-border p-5 shadow-sm"
                >
                  <div className="text-2xl mb-3" aria-hidden="true">
                    {cat.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{cat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Before / After */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-mono text-3xl font-semibold text-center text-foreground mb-2 tracking-tight">
              See the difference
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Real example of an AI-rewritten bullet point
            </p>
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-5">
                <div className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-widest mb-2">
                  Before
                </div>
                <p className="text-muted-foreground/70 line-through decoration-correction decoration-2">
                  Worked on React projects for the team
                </p>
              </div>
              <div className="flex justify-center" aria-hidden="true">
                <div className="text-border">↓</div>
              </div>
              <div className="border-l-2 border-approved bg-approved/10 rounded-r-lg p-5">
                <div className="text-xs font-mono font-medium text-approved uppercase tracking-widest mb-2">
                  After
                </div>
                <p className="text-foreground">
                  Led React frontend development for 3+ customer-facing web
                  applications, improving page load times by 40%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-secondary py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-mono text-3xl font-semibold tracking-tight text-center text-foreground mb-2">
              Simple, honest pricing
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              No subscriptions. Pay only when you need more scans.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border-border shadow-sm rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-1">Free</h3>
                <div className="font-mono text-3xl font-semibold text-foreground mb-4">
                  ₹0
                </div>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li>✓ 3 resume scans</li>
                  <li>✓ Full ATS score breakdown</li>
                  <li>✓ Keyword gap analysis</li>
                </ul>
                <AuthCTAButton
                  mode="signup"
                  variant="outline"
                  className="w-full"
                >
                  Start free
                </AuthCTAButton>
              </div>
              <div className="bg-card border-2 border-primary shadow-lg rounded-lg p-6 relative mt-4 md:mt-0">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most popular
                </div>
                <h3 className="font-semibold text-foreground mb-1">5 Scans</h3>
                <div className="font-mono text-3xl font-semibold text-foreground mb-4">
                  ₹249
                </div>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li>✓ 5 resume scans</li>
                  <li>✓ AI bullet point rewrites</li>
                  <li>✓ Never expires</li>
                </ul>
                <AuthCTAButton
                  mode="signup"
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Get 5 scans
                </AuthCTAButton>
              </div>
              <div className="bg-card border-border shadow-sm rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-1">1 Scan</h3>
                <div className="font-mono text-3xl font-semibold text-foreground mb-4">
                  ₹99
                </div>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li>✓ 1 resume scan</li>
                  <li>✓ AI bullet point rewrites</li>
                  <li>✓ Great for a single application</li>
                </ul>
                <AuthCTAButton
                  mode="signup"
                  variant="outline"
                  className="w-full"
                >
                  Buy 1 scan
                </AuthCTAButton>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ — native details/summary accordion: shortens the scroll on
            mobile with zero client JS, and stays fully crawlable by
            search engines and readable without JS if it ever fails to load. */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-mono text-3xl font-semibold tracking-tight text-center text-foreground mb-12">
              Frequently asked questions
            </h2>
            <div className="space-y-2">
              {FAQS.map((item, idx) => (
                <details
                  key={item.q}
                  open={idx === 0}
                  className="group border-b border-border py-4 [&::-webkit-details-marker]:hidden"
                >
                  <summary className="font-semibold text-foreground cursor-pointer list-none flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                    {item.q}
                    <ChevronDown
                      aria-hidden="true"
                      className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <p className="text-sm text-muted-foreground mt-3">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-primary">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="font-mono text-3xl font-semibold tracking-tight text-primary-foreground mb-4">
              Get your ATS score now
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              3 free scans included. No credit card required.
            </p>
            <AuthCTAButton
              mode="signup"
              size="lg"
              className="bg-background text-primary hover:bg-background/90"
            >
              Start Free Analysis →
            </AuthCTAButton>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 bg-card">
          <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground text-sm">
            <p>© 2026 Resume AI Optimizer. Made for Indian job seekers.</p>
          </div>
        </footer>
      </div>
    </AuthModalProvider>
  );
}
