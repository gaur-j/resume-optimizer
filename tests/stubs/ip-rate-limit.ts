/** Route-test double for lib/ip-rate-limit.ts: no database, controllable verdict. */
import { NextResponse, type NextRequest } from "next/server";

const g = globalThis as unknown as { __PUBLIC_LIMIT_ALLOWS?: boolean };

export function setPublicLimitAllows(value: boolean) {
  g.__PUBLIC_LIMIT_ALLOWS = value;
}

export interface PublicLimit {
  max: number;
  windowSeconds: number;
}
export interface PublicLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  unavailable?: boolean;
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get("x-test-ip") ?? "unknown";
}

export async function checkPublicRateLimit(): Promise<PublicLimitResult> {
  return g.__PUBLIC_LIMIT_ALLOWS === false
    ? { allowed: false, retryAfterSeconds: 7 }
    : { allowed: true, retryAfterSeconds: 0 };
}

export function publicLimitResponse(
  result: PublicLimitResult,
  message: string
) {
  return NextResponse.json(
    { error: result.unavailable ? "unavailable" : message },
    {
      status: result.unavailable ? 503 : 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    }
  );
}
