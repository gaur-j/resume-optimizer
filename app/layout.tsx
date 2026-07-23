import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import Script from "next/script";
import { ThemeProvider } from "@/components/Theme/theme-provider";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Resume AI Optimizer | ATS Score Checker | Free ATS Resume Score",
    template:
      "%s | Resume AI Optimizer | ATS Score Checker | Free ATS Resume Score",
  },
  description:
    "Find out why ATS bots are rejecting your resume. Get a free ATS score, keyword analysis, and AI-powered rewrites in under 2 minutes. | Boost your interview chances with AI. Get a free ATS resume score, keyword analysis, resume rewrites, and LinkedIn optimization in under 2 minutes.",
  keywords: [
    "ATS resume checker",
    "AI resume builder",
    "resume optimizer",
    "resume score checker",
    "ATS score",
    "resume keyword checker",
    "resume AI",
    "LinkedIn profile optimizer",
    "CV checker",
    "resume improvement",
    "job application",
    "resume scanner",
    "India jobs",
    "career tools",
  ],
  authors: [{ name: "Resume AI Optimizer" }],
  creator: "Resume AI Optimizer",
  publisher: "Resume AI Optimizer",
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "Resume AI Optimizer",
    title:
      "Resume AI Optimizer | Check Your ATS Score Free | Free ATS Resume Score Checker",
    description:
      "AI-powered resume optimization. Get instant ATS score, find missing keywords, and rewrite weak bullets. | Analyze your resume with AI, discover missing ATS keywords, improve weak bullet points, and increase your chances of landing interviews.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Resume AI Optimizer ATS Score Checker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume AI Optimizer | Free ATS Resume Score Checker",
    description:
      "Get an ATS score, keyword analysis, AI resume rewrites, and LinkedIn optimization for free.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "Career",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("font-sans", plexMono.variable, plexSans.variable)}
      suppressHydrationWarning
    >
      <head>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className={plexSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {/* Add the Toaster component right above the closing body tag */}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
