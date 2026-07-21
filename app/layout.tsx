import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
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

export const metadata: Metadata = {
  title: "Resume AI Optimizer | ATS Score Checker",
  description:
    "Find out why ATS bots are rejecting your resume. Get a free ATS score, keyword analysis, and AI-powered rewrites in under 2 minutes.",
  keywords: [
    "ATS resume checker",
    "resume optimizer",
    "LinkedIn optimizer",
    "job application",
    "India",
  ],
  authors: [{ name: "Resume AI Optimizer" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Resume AI Optimizer",
    title: "Resume AI Optimizer | Check Your ATS Score Free",
    description:
      "AI-powered resume optimization. Get instant ATS score, find missing keywords, and rewrite weak bullets.",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume AI Optimizer",
    description: "Check your ATS score and optimize your resume in 2 minutes",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          async
        ></script>
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
