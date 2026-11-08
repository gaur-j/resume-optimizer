import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

export const PROXY_IP_HEADERS = {
  ip: "x-resume-visitor-ip",
  timestamp: "x-resume-proxy-timestamp",
  signature: "x-resume-proxy-signature",
} as const;

export function proxyIpPayload(ip: string, timestamp: string, method: string, path: string) {
  return JSON.stringify(["resume-ip-v1", method.toUpperCase(), path, ip, timestamp]);
}

/** Only a configured forwarding server can sign an accepted handoff.
 * Signatures expire after 60 seconds and bind method/path. They do not bypass limits. */
export function verifiedProxyIp(request: Request, secret: string | undefined, now = Date.now()): string | null {
  const ip = request.headers.get(PROXY_IP_HEADERS.ip);
  const timestamp = request.headers.get(PROXY_IP_HEADERS.timestamp);
  const signature = request.headers.get(PROXY_IP_HEADERS.signature);
  if (!ip && !timestamp && !signature) return null;
  if (!secret || secret.length < 32) throw new Error("Trusted proxy is not configured");
  if (!ip || !isIP(ip) || !timestamp || !/^\d{10,11}$/.test(timestamp) || !signature || !/^[a-f0-9]{64}$/.test(signature)) throw new Error("Invalid visitor-IP handoff");
  if (Math.abs(Math.floor(now / 1000) - Number(timestamp)) > 60) throw new Error("Expired visitor-IP handoff");
  const expected = createHmac("sha256", secret).update(proxyIpPayload(ip, timestamp, request.method, new URL(request.url).pathname)).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) throw new Error("Invalid visitor-IP signature");
  return ip;
}

/** Direct traffic uses Vercel's edge-provided rightmost IP, never the first entry. */
export function resolveClientIp(request: Request, secret?: string, now = Date.now()): string {
  const verified = verifiedProxyIp(request, secret, now);
  if (verified) return verified;
  const parts = (request.headers.get("x-forwarded-for") ?? "").split(",").map((part) => part.trim()).filter(Boolean);
  const edgeIp = parts[parts.length - 1] || request.headers.get("x-real-ip")?.trim();
  return edgeIp && isIP(edgeIp) ? edgeIp : "unknown";
}
