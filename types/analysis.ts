/**
 * User-related types
 */
export interface User {
  id: string;
  email: string;
  full_name?: string;
  scan_credits: number;
  total_paid_scans: number;
  total_spent_inr: number;
  created_at: string;
  updated_at: string;
}

/**
 * Resume scan result
 */
export interface ResumeScan {
  id: string;
  user_id: string;
  resume_text: string;
  jd_text: string;
  is_paid: boolean;
  ats_score: number;
  result_json: ScanAnalysisResult;
  created_at: string;
}

/**
 * Line-level types for structured resume output (PDF-export friendly).
 */
export type TailoredResumeLineType =
  | "contact"
  | "subheading"
  | "paragraph"
  | "bullet"
  | "text"
  | "spacer";

/**
 * A single line in the tailored resume, in document order.
 */
export interface TailoredResumeLine {
  type: TailoredResumeLineType;
  /** Plain text only — no markdown or HTML. */
  text: string;
  /** Position within the section; preserves chronology. */
  order: number;
  /** Bullet nesting depth for PDF export (0 = top level). */
  indent?: number;
}

/**
 * One resume section; heading name is preserved from the source resume.
 */
export interface TailoredResumeSection {
  /** Original section name (e.g. "Experience", "Education"). */
  heading: string;
  /** Position in the document; preserves section order. */
  order: number;
  lines: TailoredResumeLine[];
}

/**
 * Summary of edits applied during tailoring.
 */
export interface TailoredResumeChangesSummary {
  bullets_rewritten: number;
  summary_updated: boolean;
  skills_updated: boolean;
}

/**
 * Inputs passed to the tailoring step after ATS analysis and bullet rewrites.
 */
export interface TailoredResumeContext {
  matchedKeywords: string[];
  missingKeywords: string[];
  bulletRewrites: BulletRewrite[];
}

/**
 * Complete tailored resume produced after ATS analysis and bullet rewrites.
 */
export interface TailoredResume {
  sections: TailoredResumeSection[];
  /** Plain-text rendering derived from sections; used for copy and PDF export. */
  full_text: string;
  keywords_added: string[];
  keywords_matched: string[];
  keywords_missing: string[];
  changes_summary: TailoredResumeChangesSummary;
}

/**
 * Complete analysis result from AI pipeline
 */
export interface ScanAnalysisResult {
  ats_analysis: ATSAnalysis;
  bullet_rewrites: BulletRewrite[];
  tailored_resume?: TailoredResume;
  professional_summary?: ProfessionalSummary;
}

/**
 * ATS score breakdown
 */
export interface ATSAnalysis {
  overall_score: number;
  sections: {
    keywords: number;
    experience: number;
    formatting: number;
    skills: number;
  };
  matched_keywords: string[];
  missing_keywords: string[];
  critical_issues: string[];
  quick_wins: string[];
}

/**
 * Rewritten bullet point
 */
export interface BulletRewrite {
  original: string;
  rewritten_options: string[];
  selected?: string;
}

/**
 * Professional summary
 */
export interface ProfessionalSummary {
  summary: string;
}

/**
 * Payment transaction
 */
export interface Payment {
  id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount_inr: number;
  scan_credits_granted: number;
  status: "pending" | "success" | "failed";
  created_at: string;
  updated_at: string;
}

/**
 * Razorpay order response
 */
export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id?: string;
  status: string;
  attempts: number;
  notes: Record<string, unknown>;
  created_at: number;
}

/**
 * Razorpay payment success response
 */
export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * API response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AnalyzeApiResponse extends ApiResponse {
  data?: {
    scan_id: string;
    ats_analysis: ATSAnalysis;
    bullet_rewrites: BulletRewrite[];
    tailored_resume: TailoredResume;
    remaining_credits: number;
  };
}

export interface CreateOrderResponse extends ApiResponse {
  data?: {
    order_id: string;
    amount: number;
    currency: string;
  };
}

/**
 * Pricing tier
 */
export type PricingTier = "free" | "single" | "pack";

export interface PricingOption {
  tier: PricingTier;
  name: string;
  price: number | "Free";
  scans: number;
  description: string;
  popular?: boolean;
  cta: string;
}
