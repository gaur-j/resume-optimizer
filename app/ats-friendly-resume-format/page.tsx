import type { Metadata } from "next";

import { SeoLandingPage } from "@/components/marketing/SeoLandingPage";

const PATH = "/ats-friendly-resume-format";
const TITLE = "ATS-Friendly Resume Format Guide";
const DESCRIPTION =
  "How to format a resume so applicant tracking systems can read it: layout, fonts, file type and common mistakes, plus a quick way to test your own file.";

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
      h1="ATS-Friendly Resume Format: A Practical Guide"
      intro="Formatting will not get you an interview on its own, but a layout that parsing software cannot read can hide everything else on your resume. Here is what to do, and how to test your own file."
      sections={[
        {
          heading: "The short version",
          bullets: [
            "Use a single-column, reverse-chronological layout.",
            "Use standard section headings: Summary, Experience, Education, Skills.",
            "Save as a text-based PDF or a .docx file.",
            "Keep contact details in the body of the page, not in a header or footer.",
            "Skip tables, text boxes, icons and skill-rating bars.",
          ],
        },
        {
          heading: "Layout",
          paragraphs: [
            "Parsers read a page roughly top to bottom. Multi-column designs, tables and text boxes can cause content to be skipped or read out of order, so your job titles end up attached to the wrong dates. A simple single column avoids the problem.",
            "Use headings the system recognizes. A section called Experience or Work Experience is understood far more reliably than a creative label like My Journey.",
          ],
        },
        {
          heading: "File type and fonts",
          bullets: [
            "Use a PDF where you can select and copy the text, or a .docx file. Avoid a PDF that is really a scanned image.",
            "Stick to standard fonts such as Arial, Calibri, Helvetica or Times New Roman at 10 to 12 pt.",
            "Name the file clearly, for example firstname-lastname-resume.pdf.",
            "If an employer asks for a specific format, follow their instruction over any general rule.",
          ],
        },
        {
          heading: "Content details that help parsing",
          bullets: [
            "Use one consistent date format, such as Jan 2024 to Mar 2026.",
            "Write job titles and company names as plain text on their own line.",
            "Spell out an acronym once with the abbreviation in brackets, then use either form.",
            "Start bullets with a verb and include a result or number where you can.",
            "List skills by their real names, such as Python, SQL or Salesforce, rather than a graphic bar showing proficiency.",
          ],
        },
        {
          heading: "A two-minute test of your own file",
          paragraphs: [
            "Open your PDF, select all the text, and paste it into a plain text editor. If the order is scrambled, sections are missing or words are broken apart, a parser is likely to struggle too. Once the text comes out clean, run your resume against a real job description to see how it matches the role.",
          ],
        },
      ]}
      faqs={[
        {
          q: "Is a PDF or a Word file better for ATS?",
          a: "Most modern systems read both. A text-based PDF keeps your layout intact and a .docx is the safest when an employer does not say. Follow any format the job posting asks for.",
        },
        {
          q: "Can I use a two-column resume template?",
          a: "It is risky. Columns can be read out of order. A single column is the safer choice if you are applying through an online system.",
        },
        {
          q: "Should I put my contact details in the header?",
          a: "Put them in the main body of the page. Some systems ignore headers and footers, which can leave your resume without an email address or phone number.",
        },
        {
          q: "Does perfect formatting guarantee an interview?",
          a: "No. Formatting only makes sure your content can be read. What gets you shortlisted is matching the skills and experience in the job description.",
        },
      ]}
      related={[
        {
          href: "/ats-resume-checker",
          label: "Free ATS resume checker",
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
