import type { Metadata } from "next";

import { SeoLandingPage } from "@/components/marketing/SeoLandingPage";

const PATH = "/ats-resume-checker";
const TITLE = "Free ATS Resume Checker Online";
const DESCRIPTION =
  "Check your resume against any job description. Get a free ATS score, matched and missing keyword counts, and a breakdown by category. No account needed.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      title={TITLE}
      h1="Free ATS Resume Checker: See How Your Resume Scores for a Specific Job"
      intro="Paste your resume and the job description you are applying to. You get an ATS score and a breakdown across keywords, experience, formatting and skills in about two minutes. The preview needs no account."
      sections={[
        {
          heading: "What an ATS resume checker tells you",
          paragraphs: [
            "An applicant tracking system (ATS) such as Workday, Greenhouse, Lever or iCIMS parses your resume into fields and lets recruiters search and filter those fields. A checker approximates that process: can your file be parsed cleanly, and do the terms the job asks for actually appear in your resume?",
            "Be realistic about what the score means. Every employer configures their system differently, and most do not automatically reject candidates below a universal score. A low match usually means you are harder to find in a recruiter's search, not that a bot deleted you. Use the score to find gaps, not as a pass or fail verdict.",
          ],
        },
        {
          heading: "How the score is broken down",
          bullets: [
            "Keywords: how many terms from the job description appear in your resume, and which important ones are missing.",
            "Experience: whether your achievements are specific, quantified and relevant to the role.",
            "Formatting: whether the structure of your resume can be read by parsing software.",
            "Skills: how well your listed skills line up with what the role asks for.",
          ],
          paragraphs: [
            "The analysis is AI-assisted, so treat a difference of a few points between two runs as noise and focus on the lowest category.",
          ],
        },
        {
          heading: "How to use your results",
          bullets: [
            "Fix the lowest-scoring category first. It usually has the biggest payoff.",
            "Add missing keywords only where they are true. If you have the skill, put it in a bullet with context, not just in a list.",
            "Rewrite vague bullets so they include a number, a scope or a result.",
            "Run a fresh check for every job. A resume tailored to one posting will score differently against another.",
          ],
        },
        {
          heading: "What a checker cannot do",
          paragraphs: [
            "It cannot see how a specific employer has configured their system, and it cannot judge whether you are a good fit. Stuffing keywords to raise a number tends to backfire once a human reads the resume. The goal is a resume that is both easy for software to read and convincing to a person.",
          ],
        },
      ]}
      faqs={[
        {
          q: "Is the ATS resume checker free?",
          a: "The score preview needs no account. Creating a free account unlocks the full keyword list and AI rewrites, and your first 3 scans are free with no card required.",
        },
        {
          q: "Does an ATS automatically reject resumes with a low score?",
          a: "Usually not. Most systems store and parse resumes and let recruiters search and filter them. Some employers add knockout questions or filters. A low keyword match mostly means you are less likely to surface in a search.",
        },
        {
          q: "Which file format should I upload?",
          a: "A text-based PDF or a Word document works for most systems. Avoid scanned images of a resume, since the text cannot be read from them.",
        },
        {
          q: "Do I need to check my resume again for every job?",
          a: "Yes. The keywords that matter come from each job description, so the same resume can score very differently against two postings.",
        },
        {
          q: "How is my resume data handled?",
          a: "See the Privacy page linked in the footer for how resume data is handled.",
        },
      ]}
      related={[
        {
          href: "/ats-friendly-resume-format",
          label: "ATS-friendly resume format: a practical guide",
        },
        {
          href: "/resume-keyword-checker",
          label:
            "Resume keyword checker: match your resume to any job description",
        },
      ]}
    />
  );
}
