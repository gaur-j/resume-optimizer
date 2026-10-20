import Link from "next/link";

const GUIDE_LINKS = [
  { href: "/ats-resume-checker", label: "ATS resume checker" },
  { href: "/ats-friendly-resume-format", label: "ATS-friendly resume format" },
  { href: "/resume-keyword-checker", label: "Resume keyword checker" },
] as const;

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/refund", label: "Refunds" },
] as const;

const CONNECT_LINKS = [
  {
    href: "https://www.linkedin.com/in/gaur-j",
    label: "LinkedIn",
    ariaLabel: "Gaur Jain on LinkedIn",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    href: "https://www.linkedin.com/company/get-resume-ai/",
    label: "Company",
    ariaLabel: "Get Resume AI on LinkedIn",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    href: "https://dev.to/gaur-j",
    label: "Dev.to",
    ariaLabel: "Gaur Jain on Dev.to",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M7.42 10.05c-.28-.14-.55-.22-.68-.22h-.73v4.34h.73c.13 0 .4-.08.68-.22.28-.14.52-.4.52-.89v-2.11c0-.49-.24-.75-.52-.9zm15.33-4.8v13.5c0 1.27-1.03 2.3-2.3 2.3H3.55c-1.27 0-2.3-1.03-2.3-2.3V5.25c0-1.27 1.03-2.3 2.3-2.3h16.9c1.27 0 2.3 1.03 2.3 2.3zM10.56 13c0 1.3-.87 2.38-2.87 2.38H5.13c-.28 0-.49-.22-.49-.49V9.12c0-.28.22-.49.49-.49h2.64c1.96 0 2.79 1.05 2.79 2.3V13zm4.77-3.7h-1.75c-.28 0-.49.22-.49.49v5.1c0 .28.22.49.49.49h1.68c.28 0 .49-.22.49-.49v-.35c.91.66 1.71.35 1.71-.6v-2.52c0-1.08-.9-1.52-1.63-1.12v-.01zm4.86-.17h-2.58c-.28 0-.49.22-.49.49v5.1c0 .28.22.49.49.49h.76c.28 0 .49-.22.49-.49v-1.63h1.09c1.35 0 1.68-1.07 1.68-1.98 0-.92-.41-1.98-1.44-1.98z" />
      </svg>
    ),
  },
  {
    href: "https://x.com/gaur_jain21",
    label: "X",
    ariaLabel: "Gaur Jain on X",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
  },
  {
    href: "https://www.reddit.com/user/g-jain/",
    label: "Reddit",
    ariaLabel: "Gaur Jain on Reddit",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.61C18.25 13.96 16.57 14.7 12 14.7s-6.25-.74-7.49-1.944a1.752 1.752 0 01-1.01-1.61c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.068l2.812.617a1.25 1.25 0 011.18-.78zM9.25 12.5c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm5.5 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm-5.407 3.56a.25.25 0 00-.177.427c.86.86 2.249 1.014 3.334 1.014s2.474-.155 3.334-1.014a.25.25 0 10-.354-.353c-.698.698-1.923.85-2.98.85s-2.282-.152-2.98-.85a.25.25 0 00-.177-.074z" />
      </svg>
    ),
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <p className="text-base font-bold tracking-tight text-foreground">
              Resume<span className="text-primary">AI</span>
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              ATS-focused resume analysis and AI rewrites for job seekers.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              © 2026 Get Resume AI
            </p>
          </div>

          {/* Guides */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Guides
            </p>
            <nav className="mt-3 flex flex-col gap-2">
              {GUIDE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal
            </p>
            <nav className="mt-3 flex flex-col gap-2">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Connect */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Connect
            </p>
            <nav
              aria-label="Social links"
              className="mt-3 flex flex-wrap gap-2"
            >
              {CONNECT_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.ariaLabel}
                  title={link.ariaLabel}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                >
                  {link.icon}
                  <span>{link.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
