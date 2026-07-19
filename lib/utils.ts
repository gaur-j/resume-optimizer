import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract bullet points from resume text
 * Looks for lines starting with -, •, *, or numbers followed by .
 */
export function extractBullets(text: string): string[] {
  const lines = text.split("\n");
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (
      trimmed.match(/^[\-\•\*]\s+/) ||
      trimmed.match(/^\d+\.\s+/) ||
      trimmed.match(/^[A-Za-z]\.\s+/)
    ) {
      const cleanedBullet = trimmed
        .replace(/^[\-\•\*]\s+/, "")
        .replace(/^\d+\.\s+/, "")
        .replace(/^[A-Za-z]\.\s+/, "");

      if (cleanedBullet.length > 10) {
        bullets.push(cleanedBullet);
      }
    }
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
