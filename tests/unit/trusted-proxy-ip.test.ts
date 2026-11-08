import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { test } from "node:test";
import { proxyIpPayload, resolveClientIp, PROXY_IP_HEADERS } from "../../lib/trusted-proxy-ip";

const secret = "test-only-signing-key-not-a-real-secret-12345";
const now = 1700000000000;
function signed(ip = "203.0.113.1", timestamp = "1700000000", path = "/api/preview-score") {
  return new Request(`https://example.test${path}`, { method: "POST", headers: {
    "x-forwarded-for": "198.51.100.99",
    [PROXY_IP_HEADERS.ip]: ip,
    [PROXY_IP_HEADERS.timestamp]: timestamp,
    [PROXY_IP_HEADERS.signature]: createHmac("sha256", secret).update(proxyIpPayload(ip, timestamp, "POST", path)).digest("hex"),
  }});
}
test("signed visitor addresses stay separate despite the same proxy address", () => {
  assert.equal(resolveClientIp(signed(), secret, now), "203.0.113.1");
  assert.equal(resolveClientIp(signed("203.0.113.2"), secret, now), "203.0.113.2");
});
test("spoofed first forwarded entry is ignored", () => {
  assert.equal(resolveClientIp(new Request("https://example.test", { headers: { "x-forwarded-for": "203.0.113.9, 198.51.100.1" }})), "198.51.100.1");
});
test("plain custom visitor header is refused", () => {
  assert.throws(() => resolveClientIp(new Request("https://example.test", { headers: { [PROXY_IP_HEADERS.ip]: "203.0.113.9" }}), secret, now));
});
test("forged visitor address is refused", () => {
  const request = signed(); request.headers.set(PROXY_IP_HEADERS.ip, "203.0.113.9");
  assert.throws(() => resolveClientIp(request, secret, now));
});
test("expired signature is refused after 60 seconds", () => {
  assert.throws(() => resolveClientIp(signed(), secret, now + 61000));
});
test("future-dated signature beyond 60 seconds is refused", () => {
  assert.throws(() => resolveClientIp(signed("203.0.113.1", "1700000061"), secret, now));
});
test("signature cannot be moved between scoring and upload routes", () => {
  const request = signed();
  assert.throws(() => resolveClientIp(new Request("https://example.test/api/public-extract-pdf", { method: "POST", headers: request.headers }), secret, now));
});
test("missing shared secret refuses a handoff, not direct visitors", () => {
  assert.throws(() => resolveClientIp(signed(), undefined, now));
  assert.equal(resolveClientIp(new Request("https://example.test", { headers: { "x-real-ip": "203.0.113.3" }})), "203.0.113.3");
});
