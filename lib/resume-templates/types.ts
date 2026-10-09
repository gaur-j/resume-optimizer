/**
 * A template is a set of visual parameters for PdfLayoutEngine
 * (lib/resume-templates/pdf-engine.ts) — not a separate renderer. Every
 * template shares the exact same pagination, wrapping, and sanitization
 * logic; only fonts, color, spacing, and divider usage vary. This is what
 * makes adding template #9 later a matter of adding one entry to
 * RESUME_TEMPLATES (registry.ts), not writing a new renderer from scratch.
 */
export interface ResumeTemplateStyle {
  id: string;
  name: string;
  description: string;
  /**
   * Gates access — see lib/plan.ts's isSubscriber(). "paid" templates are
   * still returned to free users (see registry.ts's getTemplatesForUser),
   * just marked `locked: true`, so the picker UI can show them as a
   * visible-but-disabled upsell surface rather than hiding them.
   */
  tier: "free" | "paid";
  font: "helvetica" | "times";
  /** RGB, each 0-1. null = pure black, no color accent (safest for ATS). */
  accentColor: [number, number, number] | null;
  /** Horizontal rule under each section heading. */
  showDividers: boolean;
  /** Multiplier on the base line-height/spacing constants. 1 = default. */
  spacingScale: number;
  /** Section headings rendered in ALL CAPS. */
  uppercaseHeadings: boolean;
}

export type ResumeTemplateWithLockState = ResumeTemplateStyle & {
  locked: boolean;
};
