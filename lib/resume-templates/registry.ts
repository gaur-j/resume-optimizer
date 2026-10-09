import type {
  ResumeTemplateStyle,
  ResumeTemplateWithLockState,
} from "./types";

/**
 * Every template a user can pick. Free-tier templates are the two chosen
 * for maximum ATS-parsing reliability (plain single-column text, no color,
 * no visual flourish) per the gating rule - subscribers unlock the rest.
 *
 * To add a template: add one entry here. Nothing else needs to change -
 * the API route, the picker UI, and the gating logic all read from this
 * array rather than any hardcoded list or count.
 */
export const RESUME_TEMPLATES: ResumeTemplateStyle[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean single-column layout with subtle section dividers.",
    tier: "free",
    font: "helvetica",
    accentColor: null,
    showDividers: true,
    spacingScale: 1,
    uppercaseHeadings: true,
  },
  {
    id: "ats-minimal",
    name: "ATS Minimal",
    description:
      "The plainest possible layout - no dividers, tightest spacing. Built for maximum ATS-parsing reliability.",
    tier: "free",
    font: "helvetica",
    accentColor: null,
    showDividers: false,
    spacingScale: 0.92,
    uppercaseHeadings: true,
  },
  {
    id: "modern-accent",
    name: "Modern Accent",
    description:
      "Classic layout with a subtle color accent on section headings and dividers.",
    tier: "paid",
    font: "helvetica",
    accentColor: [0.11, 0.32, 0.63],
    showDividers: true,
    spacingScale: 1,
    uppercaseHeadings: false,
  },
  {
    id: "traditional-serif",
    name: "Traditional Serif",
    description: "A formal serif typeface for traditional industries.",
    tier: "paid",
    font: "times",
    accentColor: null,
    showDividers: true,
    spacingScale: 1.05,
    uppercaseHeadings: false,
  },
];

const DEFAULT_TEMPLATE_ID = "classic";

export function getTemplate(
  id: string | null | undefined
): ResumeTemplateStyle {
  return (
    RESUME_TEMPLATES.find((t) => t.id === id) ??
    // Falls back to the default rather than throwing: a stale/unknown
    // templateId (e.g. an old bookmark, or a template later removed)
    // should still produce a resume, not a 500.
    (RESUME_TEMPLATES.find(
      (t) => t.id === DEFAULT_TEMPLATE_ID
    ) as ResumeTemplateStyle)
  );
}

/** For the dashboard picker UI: every template, marked locked/unlocked. */
export function getTemplatesForUser(
  isSubscriber: boolean
): ResumeTemplateWithLockState[] {
  return RESUME_TEMPLATES.map((t) => ({
    ...t,
    locked: t.tier === "paid" && !isSubscriber,
  }));
}
