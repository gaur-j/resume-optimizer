import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract bullet points from resume text.
 *
 * PDFs frequently lose their bullet character entirely on text extraction —
 * Word/Canva/resume-builder exports often use a bullet font (Wingdings-style
 * or a private-use-area glyph) that pdf-parse can't map back to a plain "•"
 * or "-". If we only ever look for a leading bullet character, we silently
 * find zero bullets for a large share of real resumes, which then starves
 * the AI tailoring step of anything concrete to rewrite.
 *
 * Strategy: try strict glyph-based detection first (most precise when it
 * works). If that finds too few results to be useful, fall back to a
 * broader heuristic that treats plausible body lines as bullet candidates
 * even with no leading glyph at all.
 */
export function extractBullets(text: string): string[] {
  const lines = text.split("\n");

  const strictBullets = extractStrictBullets(lines);

  // Only reach for the broader heuristic when glyph detection found next
  // to nothing — if it found a reasonable number, trust it alone rather
  // than risk the heuristic pass pulling in false positives (job titles,
  // company lines) alongside already-good results.
  if (strictBullets.length >= 2) {
    return strictBullets;
  }

  const heuristicBullets = extractHeuristicBullets(lines);
  const merged = [...strictBullets];
  const seen = new Set(strictBullets.map(normalizeForDedup));

  for (const bullet of heuristicBullets) {
    const key = normalizeForDedup(bullet);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(bullet);
    }
  }

  return merged;
}

// Strips leading bullet glyphs/numbering AND all punctuation before
// comparing, so "• Developed X" and "Developed X" are recognized as the
// same line regardless of which pass found it.
function normalizeForDedup(s: string): string {
  return s
    .toLowerCase()
    .replace(/^[\-\•\*\u2013\u2014]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Lines with an explicit bullet glyph or numbered/lettered list marker. */
function extractStrictBullets(lines: string[]): string[] {
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (
      trimmed.match(/^[\-\•\*\u2013\u2014]\s+/) ||
      trimmed.match(/^\d+\.\s+/) ||
      trimmed.match(/^[A-Za-z]\.\s+/)
    ) {
      const cleanedBullet = trimmed
        .replace(/^[\-\•\*\u2013\u2014]\s+/, "")
        .replace(/^\d+\.\s+/, "")
        .replace(/^[A-Za-z]\.\s+/, "");

      if (cleanedBullet.length > 10) {
        bullets.push(cleanedBullet);
      }
    }
  }

  return bullets;
}

// Section header words we don't want mistaken for bullet content.
const HEADER_WORDS =
  /^(experience|work experience|professional experience|employment|education|skills|technical skills|projects|summary|profile|objective|certifications|achievements|awards|publications|contact|references|languages|interests|volunteer|extracurricular)s?:?$/i;

/**
 * Fallback for resumes where bullet glyphs didn't survive PDF extraction.
 * Treats any plausible, sentence-like body line as a bullet candidate,
 * filtering out section headers and short title/date lines.
 */
function extractHeuristicBullets(lines: string[]): string[] {
  const bullets: string[] = [];

  for (const rawLine of lines) {
    // Strip any glyph that DID survive extraction, so this pass produces
    // clean text either way instead of risking a raw "• ..." duplicate.
    const trimmed = rawLine
      .trim()
      .replace(/^[\-\•\*\u2013\u2014]\s+/, "")
      .replace(/^\d+\.\s+/, "");

    if (trimmed.length < 20 || trimmed.length > 260) continue;
    if (HEADER_WORDS.test(trimmed)) continue;

    // Short, ALL-CAPS lines are almost always section headers, not bullets.
    const isShortAndShouty =
      trimmed.length < 40 && trimmed === trimmed.toUpperCase();
    if (isShortAndShouty) continue;

    // Contact-info lines (email / phone / LinkedIn / GitHub) should never
    // show up as a "bullet to rewrite" — instantly recognizable, high
    // confidence filter.
    const looksLikeContactLine =
      /@/.test(trimmed) ||
      /linkedin\.com|github\.com/i.test(trimmed) ||
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(trimmed);
    if (looksLikeContactLine) continue;

    // A short line containing a year is almost always a subheading or
    // credential line (job title/dates, degree/institution/year) rather
    // than a bullet — whether or not it also has a pipe or dash separator.
    const looksLikeDateOrCredentialLine =
      trimmed.length < 70 && /\b(19|20)\d{2}\b/.test(trimmed);
    if (looksLikeDateOrCredentialLine) continue;

    // Short "Job Title, Company Name" lines (no date, but still a title
    // line) — usually under 55 chars, one or two commas, and no verb-like
    // opening word. Heuristic, not perfect, but avoids the most common
    // false positive: picking up a subheading as if it were a bullet.
    const commaCount = (trimmed.match(/,/g) || []).length;
    const looksLikeTitleLine =
      trimmed.length < 55 &&
      commaCount >= 1 &&
      commaCount <= 2 &&
      !/[.!?]$/.test(trimmed) &&
      trimmed.split(/\s+/).length <= 8;
    if (looksLikeTitleLine) continue;

    bullets.push(trimmed);
  }

  return bullets;
}

/**
 * Validate PDF file size and type
 */
export function validatePDF(file: File): { valid: boolean; error?: string } {
  const maxSize = 2 * 1024 * 1024; // 2MB
  const validTypes = ["application/pdf"];

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: "Please upload a PDF file" };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 2MB" };
  }

  return { valid: true };
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Format ATS score for display (0-100)
 */
export function formatATSScore(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  return clamped.toString();
}

/**
 * Get color for ATS score (red, amber, green)
 */
export function getATSScoreColor(score: number): string {
  if (score < 40) return "text-red-600";
  if (score < 70) return "text-amber-600";
  return "text-green-600";
}

/**
 * Format currency in INR
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get readable relative time (e.g., "2 days ago")
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return then.toLocaleDateString("en-IN");
}
