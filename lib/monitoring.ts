/**
 * Minimal, dependency-free error alerting.
 *
 * Failures that need a human (a payment that was taken but not credited, the
 * AI provider down, PDF export failing) used to be a console.error line that
 * nobody reads. If ERROR_WEBHOOK_URL is set to a Slack or Discord incoming-
 * webhook URL, reportError() also posts a short alert there. If it is not
 * set, this does nothing, so it is safe to leave unconfigured.
 *
 * Deliberately NOT sent: request bodies, resume text, emails, tokens. Only the
 * scope name, the error's name/message (truncated) and a few short, explicitly
 * passed context values such as a Razorpay order id.
 *
 * This is a stop-gap, not a replacement for a proper error tracker: no
 * grouping, no stack traces, no history. If you outgrow it, Sentry is the
 * usual next step.
 */

const THROTTLE_MS = 60_000;
const MAX_TRACKED = 100;
const recent = new Map<string, number>();

type Context = Record<string, string | number | boolean | null | undefined>;

function webhookUrl(): URL | null {
  const raw = process.env.ERROR_WEBHOOK_URL;
  if (!raw) return null;

  try {
    const url = new URL(raw);
    // https only: never send alerts over plain HTTP.
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/**
 * Error messages from database drivers and HTTP clients can embed connection
 * strings, tokens or keys. Alerts land in a chat channel that is read (and
 * retained) far more widely than server logs, so anything secret-looking is
 * masked BEFORE the text is clipped or sent.
 */
export function redactSecrets(text: string): string {
  return (
    text
      // user:password@host in any URL / connection string
      .replace(/(\w+:\/\/)[^\s/@:]+:[^\s/@]+@/g, "$1[redacted]@")
      // "Bearer <token>" first, so the key/value rule below cannot consume the
      // word "Bearer" and leave the token itself behind
      .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
      // key=value / key: value / "key": "value" where the key names a secret
      .replace(
        /\b(password|passwd|pwd|secret|token|api[_-]?key|apikey|authorization|signature)\b(["']?\s*[=:]\s*)("[^"]*"|'[^']*'|\S+)/gi,
        "$1$2[redacted]"
      )
      // JWTs (Supabase keys and session tokens)
      .replace(
        /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g,
        "[redacted-jwt]"
      )
      // well-known provider key shapes (Stripe/Razorpay style, Groq, Google)
      .replace(/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+/g, "[redacted-key]")
      .replace(/\brzp_(?:live|test)_[A-Za-z0-9]+/g, "[redacted-key]")
      .replace(/\bgsk_[A-Za-z0-9]+/g, "[redacted-key]")
      .replace(/\bAIza[0-9A-Za-z_-]{20,}/g, "[redacted-key]")
  );
}

function clip(value: unknown, max: number): string {
  return redactSecrets(String(value)).replace(/\s+/g, " ").slice(0, max);
}

export function formatAlert(
  scope: string,
  error: unknown,
  context: Context = {}
): string {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const name = error instanceof Error ? error.name : "Error";
  const message = error instanceof Error ? error.message : String(error);

  const details = Object.entries(context)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${clip(key, 30)}=${clip(value, 100)}`)
    .join(" ");

  return [
    `[${env}${sha ? ` @${sha}` : ""}] ${clip(scope, 60)}`,
    `${clip(name, 40)}: ${clip(message, 300)}`,
    details,
  ]
    .filter(Boolean)
    .join("\n");
}

/** True when the same alert was already sent in the last minute (per instance). */
function isThrottled(key: string, now: number): boolean {
  const last = recent.get(key);
  if (last !== undefined && now - last < THROTTLE_MS) return true;

  if (recent.size >= MAX_TRACKED) {
    for (const [k, t] of recent) {
      if (now - t >= THROTTLE_MS) recent.delete(k);
    }
    if (recent.size >= MAX_TRACKED) recent.clear();
  }
  recent.set(key, now);
  return false;
}

/**
 * Never throws and never takes long: it is awaited inside request handlers
 * (serverless functions can be frozen the moment the response is sent, so a
 * fire-and-forget request may never leave), hence the short timeout.
 */
export async function reportError(
  scope: string,
  error: unknown,
  context: Context = {}
): Promise<void> {
  try {
    const url = webhookUrl();
    if (!url) return;

    const message = error instanceof Error ? error.message : String(error);
    if (isThrottled(`${scope}:${clip(message, 80)}`, Date.now())) return;

    const text = formatAlert(scope, error, context);

    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Slack reads "text", Discord reads "content"; each ignores the other.
      body: JSON.stringify({ text, content: text }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Alerting must never turn into a second failure.
  }
}

/** Test helper: clears the in-memory throttle. */
export function _resetThrottleForTests() {
  recent.clear();
}
