import React from "react";

export type Experience = {
  company?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  details?: string[];
};

export type Education = {
  institution?: string;
  degree?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  details?: string;
};

export type Project = {
  name?: string;
  description?: string;
  link?: string;
  tech?: string[];
};

export type TailoredResume = {
  name?: string;
  label?: string;
  contact?: string;
  summary?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: string[];
  projects?: Project[];
};

type Props = {
  tailoredResume: TailoredResume;
};

export default function ResumePreview({ tailoredResume }: Props) {
  const {
    name,
    label,
    contact,
    summary,
    experience = [],
    education = [],
    skills = [],
    projects = [],
  } = tailoredResume || {};

  return (
    <article className="max-w-3xl mx-auto bg-white text-black p-8 shadow-md print:shadow-none print:p-0 text-sm leading-relaxed">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {name ?? "Your Name"}
          </h1>
          {label && <p className="text-sm text-muted-foreground">{label}</p>}
        </div>
        {contact && (
          <div className="mt-4 sm:mt-0 text-sm text-right whitespace-pre-line">
            <span>{contact}</span>
          </div>
        )}
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-6">
          <h2 className="text-base font-semibold uppercase tracking-wide mb-2">
            Summary
          </h2>
          <p className="text-sm text-foreground/90">{summary}</p>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left / main column */}
        <div className="lg:col-span-2">
          {/* Experience */}
          {experience.length > 0 && (
            <section className="mb-6">
              <h2 className="text-base font-semibold uppercase tracking-wide mb-3">
                Experience
              </h2>
              <div className="space-y-4">
                {experience.map((exp, i) => (
                  <div key={i} className="">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium">
                          {exp.title ?? "Title"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {exp.company}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground text-right">
                        <div>
                          {exp.startDate ?? ""}{" "}
                          {exp.endDate ? `— ${exp.endDate}` : ""}
                        </div>
                        {exp.location && (
                          <div className="mt-1">{exp.location}</div>
                        )}
                      </div>
                    </div>
                    {exp.details && exp.details.length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                        {exp.details.map((d, idx) => (
                          <li key={idx}>{d}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <section className="mb-6">
              <h2 className="text-base font-semibold uppercase tracking-wide mb-3">
                Projects
              </h2>
              <div className="space-y-4">
                {projects.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-medium">{p.name}</h3>
                      {p.link && (
                        <a
                          className="text-sm text-primary underline"
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {p.link}
                        </a>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-sm mt-1">{p.description}</p>
                    )}
                    {p.tech && p.tech.length > 0 && (
                      <p className="text-sm mt-1 text-muted-foreground">
                        Tech: {p.tech.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section className="mb-6">
              <h2 className="text-base font-semibold uppercase tracking-wide mb-3">
                Education
              </h2>
              <div className="space-y-4">
                {education.map((ed, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium">
                          {ed.institution}
                        </h3>
                        {ed.degree && (
                          <p className="text-sm text-muted-foreground">
                            {ed.degree}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {ed.startDate ?? ""}{" "}
                        {ed.endDate ? `— ${ed.endDate}` : ""}
                      </div>
                    </div>
                    {ed.details && <p className="text-sm mt-1">{ed.details}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <aside className="lg:col-span-1">
          {/* Skills */}
          {skills.length > 0 && (
            <section className="mb-6">
              <h2 className="text-base font-semibold uppercase tracking-wide mb-3">
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-muted rounded-md border border-border text-foreground/90"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Optional quick contact / small print hint for printing */}
          <div className="text-xs text-muted-foreground mt-2 print:text-[10px]">
            <p className="print:hidden">
              Tip: Use your browser's Print (Ctrl/Cmd+P) to export to PDF. This
              note will be hidden on print.
            </p>
          </div>
        </aside>
      </div>

      <style jsx>{`
        /* Improve print layout: remove margins and shadows, use full width */
        @media print {
          body {
            -webkit-print-color-adjust: exact;
          }

          /* Ensure the resume uses the full page width when printing */
          .print\:p-0 {
            padding: 0 !important;
          }

          /* Avoid printing the tip */
          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </article>
  );
}
