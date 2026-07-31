import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { AuthCTAButton, NavAuthLink } from "@/components/auth/AuthTriggers";
import { SiteFooter } from "@/components/SiteFooter";
import { ChevronDown } from "lucide-react";
import { CheckIcon } from "lucide-react";
import { FileSearch } from "lucide-react";

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
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 overflow-x-hidden">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
            <div className="font-bold text-lg sm:text-2xl tracking-tight">
              Resume<span className="text-primary">AI</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <NavAuthLink
                mode="login"
                className="px-3 sm:px-6 lg:px-8 py-2 text-muted-foreground hover:text-primary/90 text-xs sm:text-sm font-medium font-mono"
              >
                Log in
              </NavAuthLink>
              <AuthCTAButton
                mode="signup"
                className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300 font-medium font-mono text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
              >
                <span className="hidden sm:inline">Get Started Free</span>
                <span className="sm:hidden">Start Free</span>
              </AuthCTAButton>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-16 sm:pb-20">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-72 w-72 rounded-full bg-primary/20 blur-[90px]" />
          </div>
          {/* Background Grid */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />

          {/* Background Glow */}
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-[120px] -z-10" />
          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center sm:text-left mt-4 sm:mt-0">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-[10px] sm:text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Built for Indian job seekers
              </div>
              <h1 className="font-mono text-[28px] sm:text-5xl lg:text-6xl text-pretty font-semibold text-foreground mb-4 sm:mb-6 leading-tight tracking-tight">
                Find out why ATS bots are rejecting your resume
              </h1>
              <p className="text-sm sm:text-lg leading-relaxed text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto sm:mx-0">
                Upload your resume and a job description. Get a real ATS score,
                missing keywords, and AI-rewritten bullet points — in under 2
                minutes, free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                <AuthCTAButton
                  mode="signup"
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300 hover:scale-[1.02] shadow-lg"
                >
                  <FileSearch className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Check My Resume — Free →
                </AuthCTAButton>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-[10px] sm:text-xs font-mono text-muted-foreground mt-4 leading-relaxed">
                  Free ATS Scan • 2 min report • No Card required
                </p>
              </div>
            </div>

            {/* Signature: a resume snippet under audit, with a real
                correction and a stamped score — this is what the
                product actually does, shown rather than illustrated.
                Purely illustrative and already described in the prose
                above, so it's hidden from assistive tech to avoid
                announcing an out-of-context "78 ATS score". */}
            <div
              aria-hidden="true"
              className="relative motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 scale-95 sm:scale-100 mt-6 sm:mt-0"
            >
              <div className="rounded-3xl p-[1px] bg-gradient-to-br from-primary/40 via-border to-primary/20">
                <div className="relative rounded-3xl bg-card shadow-sm transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl p-5 sm:p-6 -rotate-1">
                  <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-3 sm:mb-4 border-b divide-y pb-2 sm:pb-3">
                    Eudaction —
                  </div>
                  <p className="text-muted-foreground/70 line-through decoration-correction decoration-2 mb-4 text-xs sm:text-sm leading-relaxed">
                    Worked on React projects for the team
                  </p>
                  <div className="border-l-2 border-approved bg-approved/10 pl-3 py-2 rounded-r-md">
                    <p className="text-foreground text-xs sm:text-sm leading-relaxed">
                      Led React frontend development for 3+ customer-facing
                      apps, cutting page load time by 40%
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-[10px] sm:text-[11px] font-mono bg-secondary text-secondary-foreground px-2 py-1 rounded">
                      +quantified impact
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-mono bg-secondary text-secondary-foreground px-2 py-1 rounded">
                      +action verb
                    </span>
                  </div>
                </div>
              </div>

              {/* Score stamp */}
              <div className="absolute -top-4 -right-2 sm:-top-7 sm:-right-5 rotate-[8deg] motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-700 motion-safe:delay-300 motion-safe:fill-mode-both">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-background border-[3px] border-approved shadow-xl flex flex-col items-center justify-center animate-pulse">
                  <span className="font-mono text-xl sm:text-2xl font-bold text-approved leading-none">
                    78
                  </span>
                  <span className="font-mono text-[7px] sm:text-[10px] tracking-widest text-approved mt-1">
                    ATS SCORE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="border-y border-border/50 bg-secondary py-4 sm:py-6">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-x-6 lg:gap-x-10 gap-y-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span>LinkedIn, Naukri, Indeed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span>No data stored beyond your account</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span>Built by a student, for students</span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-10 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
            <h2 className="font-mono text-2xl font-semibold tracking-tight text-center text-foreground mb-2 text-pretty">
              How it works
            </h2>
            <p className="text-center text-sm sm:text-base text-muted-foreground mb-8 sm:mb-12 leading-relaxed">
              Three steps, no downloads to see your score
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  step: "1",
                  title: "Upload your resume",
                  desc: "Drop your resume and the job description.",
                },
                {
                  step: "2",
                  title: "Get your ATS score",
                  desc: "See exactly how ATS software reads your resume.",
                },
                {
                  step: "3",
                  title: "Fix it in one click",
                  desc: "Copy AI-rewritten bullets that add missing metrics.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="text-center flex flex-col items-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-base sm:text-lg font-mono font-semibold mb-3 sm:mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 sm:mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[250px] sm:max-w-none">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Category breakdown — inspired by how leading CheckIconers present scoring */}
        <section className="bg-secondary py-10 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
            <h2 className="font-mono text-xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-center text-foreground mb-2 text-pretty">
              One score isn&apos;t enough — so we don&apos;t give you just one
            </h2>
            <p className="text-center text-xs sm:text-base text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Your score breaks down into four categories, so you know exactly
              what to fix instead of guessing.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.title}
                  className="bg-card rounded-2xl sm:rounded-3xl border-border p-3 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className="text-xl sm:text-2xl mb-2 sm:mb-4 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/10"
                    aria-hidden="true"
                  >
                    {cat.icon}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 text-pretty">
                    {cat.title}
                  </h3>
                  <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Before / After */}
        <section className="py-10 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-8">
            <h2 className="font-mono text-2xl sm:text-3xl lg:text-4xl font-semibold text-center text-foreground mb-2 tracking-tight text-pretty">
              See the difference
            </h2>
            <p className="text-center text-muted-foreground mb-12 leading-relaxed">
              Real example of an AI-rewritten bullet point
            </p>
            <div className="space-y-4">
              <div className="border border-border rounded-3xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-widest mb-2 ">
                  Before
                </div>
                <p className="text-muted-foreground/70 line-through decoration-correction decoration-2 leading-relaxed">
                  Worked on React projects for the team
                </p>
              </div>
              <div className="flex justify-center" aria-hidden="true">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                  ↓
                </div>
              </div>
              <div className="border-l-2 border-approved bg-approved/10 rounded-r-3xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="text-xs font-mono font-medium text-approved uppercase tracking-widest mb-2">
                  After
                </div>
                <p className="text-foreground leading-relaxed">
                  Led React frontend development for 3+ customer-facing web
                  applications, improving page load times by 40%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-secondary py-10 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
            <h2 className="font-mono text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-center text-pretty text-foreground mb-2">
              Simple, honest pricing
            </h2>
            <p className="text-center text-sm sm:text-base text-muted-foreground mb-8 sm:mb-12 leading-relaxed">
              No subscriptions. Pay only when you need more scans.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-card border-border shadow-sm rounded-3xl p-5 sm:p-6">
                <h3 className="font-semibold text-foreground mb-1">Free</h3>
                <div className="font-mono text-2xl sm:text-4xl font-semibold text-foreground mb-4">
                  ₹0
                </div>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-2 sm:space-y-3 mb-6">
                  <li>✓ 3 resume scans</li>
                  <li>✓ Full ATS score breakdown</li>
                </ul>
                <AuthCTAButton
                  mode="signup"
                  variant="outline"
                  className="w-full"
                >
                  Start free
                </AuthCTAButton>
              </div>
              <div className="bg-card scale-105 ring-2 ring-primary/40 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl rounded-3xl p-5 sm:p-6 relative mt-4 md:mt-0">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary shadow-md hover:shadow-lg transition-all text-primary-foreground text-[10px] sm:text-xs font-medium px-3 py-1 rounded-full">
                  Most popular
                </div>
                <h3 className="font-semibold text-foreground mb-1">5 Scans</h3>
                <div className="font-mono text-2xl sm:text-4xl font-semibold text-foreground mb-4">
                  ₹249
                </div>
                <div className="bg-card rounded-3xl md:scale-105 transition-transform">
                  <ul className="text-xs sm:text-sm text-muted-foreground space-y-2 sm:space-y-3 mb-6">
                    <li>✓ 5 resume scans</li>
                    <li>✓ AI bullet point rewrites</li>
                  </ul>
                </div>
                <AuthCTAButton
                  mode="signup"
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Get 5 scans
                </AuthCTAButton>
              </div>
              <div className="bg-card border-border shadow-sm rounded-3xl p-5 sm:p-6 mt-2 sm:mt-0">
                <h3 className="font-semibold text-foreground mb-1">1 Scan</h3>
                <div className="font-mono text-2xl sm:text-4xl font-semibold text-foreground mb-4">
                  ₹99
                </div>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-2 sm:space-y-3 mb-6">
                  <li>✓ 1 resume scan</li>
                  <li>✓ AI bullet point rewrites</li>
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
        <section className="py-10 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-mono text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-center text-foreground mb-12 text-pretty">
              Frequently asked questions
            </h2>
            <div className="space-y-2">
              {FAQS.map((item, idx) => (
                <details
                  key={item.q}
                  open={idx === 0}
                  className="group overflow-hidden border-b border-border py-3 sm:py-5 [&::-webkit-details-marker]:hidden"
                >
                  <summary className="font-semibold text-foreground cursor-pointer list-none flex items-center justify-between gap-3 sm:gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                    {item.q}
                    <ChevronDown
                      aria-hidden="true"
                      className="h-4 w-4 flex-shrink-0 text-muted-foreground group-open:rotate-180"
                    />
                  </summary>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-10 sm:py-20 bg-primary">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="font-mono text-xl sm:text-3xl font-semibold tracking-tight text-primary-foreground mb-3 sm:mb-4 text-pretty">
              Get your ATS score now
            </h2>
            <p className="text-xs sm:text-base text-primary-foreground/80 mb-6 sm:mb-8 leading-relaxed">
              3 free scans included. No credit card required.
            </p>
            <AuthCTAButton
              mode="signup"
              size="lg"
              className="bg-background text-primary hover:bg-background/90 shadow-md text-sm sm:text-base w-full sm:w-auto"
            >
              Start Free Analysis →
            </AuthCTAButton>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-border">
          <SiteFooter />
        </div>
      </div>
    </AuthModalProvider>
  );
}
