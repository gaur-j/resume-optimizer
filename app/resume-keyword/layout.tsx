// app/resume-keyword-checker/layout.tsx
import type { Metadata } from "next";

const TITLE = "Resume Keyword Checker by Industry & Role | Get Resume AI";
const DESCRIPTION =
  "Find high-impact resume keywords for 280+ industries and roles. Scan your resume to discover missing hard skills, software tools, and action verbs to maximize your ATS match score.";
const PATH = "/resume-keyword";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PATH,
    type: "website",
  },
};

export default function KeywordCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
