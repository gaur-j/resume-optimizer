import type { Metadata } from "next";

import { SeoLandingPage } from "@/components/marketing/SeoLandingPage";

const PATH = "/resume-keyword-checker";
const TITLE = "Resume Keyword Checker for Any Job";
const DESCRIPTION =
  "Find which keywords from a job description are missing from your resume, and learn where to add them honestly. Paste both and see your match in minutes.";

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
      h1="Resume Keyword Checker: Match Your Resume to Any Job Description"
      intro="Paste your resume and a job description to see which keywords you already cover and which ones are missing. Then use the guide below to add them honestly."
      sections={[
        {
          heading: "Why keywords matter",
          paragraphs: [
            "Recruiters often search the resumes in their applicant tracking system by skill, tool or job title. If the terms they search for never appear in your resume, you are much less likely to show up, even if you have the experience. The job posting tells you which terms that employer cares about.",
          ],
        },
        {
          heading: "How to find the keywords in a job description",
          bullets: [
            "Start with the job title and use the employer's own wording where it honestly describes your role.",
            "Read the Requirements or Qualifications section for tools, technologies, methods and certifications.",
            "Note terms that appear more than once. Repetition signals priority.",
            "Separate hard skills (SQL, Figma, GAAP) from soft skills (communication) and make sure the hard skills are clearly visible.",
          ],
        },
        {
          heading: "Where to put them",
          paragraphs: [
            "A keyword inside a bullet that shows what you did with it is stronger than a keyword in a list, because it proves the skill and reads naturally to a human. Use your Skills section for a clean list of tools, and use your Experience bullets for context.",
          ],
          bullets: [
            "Before: Worked on React projects for the team.",
            "After: Led React front-end development for 3 customer-facing web apps, cutting page load time by 40%.",
          ],
        },
        {
          heading: "Exact match versus synonyms",
          paragraphs: [
            "Some systems match exact text, so a recruiter searching for one form may not find the other. When it is natural, write both: Search Engine Optimization (SEO) or Certified Public Accountant (CPA). After the first mention you can use either.",
          ],
        },
        {
          heading: "What not to do",
          bullets: [
            "Do not add skills you do not have. It tends to surface in the interview.",
            "Do not paste the whole job description into your resume.",
            "Do not hide keywords in white text. It is dishonest and can get your application discarded.",
          ],
        },
      ]}
      faqs={[
        {
          q: "How many keywords should my resume include?",
          a: "There is no magic number. Cover the must-have requirements in the posting that are true for you, and make each one easy to spot.",
        },
        {
          q: "Does this work for any industry?",
          a: "Yes. The comparison is driven by the job description you paste, so it works for any role where you have the posting text.",
        },
        {
          q: "Is it okay to copy phrases from the job description?",
          a: "Reusing the employer's terminology for skills and tools you really have is fine. Copying whole sentences is not, and it reads badly to a recruiter.",
        },
        {
          q: "Do I need to update my keywords for each application?",
          a: "Yes. Each job emphasizes different terms, so adjust the wording of your bullets and skills for every posting.",
        },
      ]}
      related={[
        {
          href: "/ats-resume-checker",
          label: "Free ATS resume checker",
        },
        {
          href: "/ats-friendly-resume-format",
          label: "ATS-friendly resume format: a practical guide",
        },
      ]}
    />
  );
}
