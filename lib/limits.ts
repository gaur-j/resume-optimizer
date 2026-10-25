/**
 * Central input/cost limits. One place so the public preview, the
 * authenticated analyze route, and the PDF parser can never drift apart.
 */

// Text sent to the LLM. A real resume is a few thousand characters; these
// are generous ceilings that stop someone turning one request into an
// arbitrarily large (paid) prompt.
export const MAX_RESUME_CHARS = 30_000;
export const MAX_JD_CHARS = 20_000;

// Raw JSON body ceiling for routes that take resume + JD text. Text caps
// above are in characters (up to 4 bytes each in UTF-8), plus JSON overhead.
export const MAX_JSON_BODY_BYTES = 256 * 1024;

// PDF uploads.
export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_PAGES = 10; // resumes are 1-4 pages; this is generous
export const PDF_PARSE_TIMEOUT_MS = 15_000;
// Multipart framing overhead allowed on top of the file itself.
export const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

// PDF export payload (the structured resume the browser sends to /api/export).
// A real 1-4 page resume is well under every one of these.
export const MAX_EXPORT_SECTIONS = 30;
export const MAX_EXPORT_LINES = 600;
export const MAX_EXPORT_LINE_CHARS = 1_500;
export const MAX_EXPORT_HEADING_CHARS = 100;
export const MAX_EXPORT_TOTAL_CHARS = 60_000;

// Profile display name. Supabase stores user_metadata inside the signed-in
// user's JWT/cookie and offers no server-side length cap, so the app limits
// what it writes AND what it renders.
export const MAX_DISPLAY_NAME_CHARS = 100;
