import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { GET } from "@/app/auth/callback/route";
import { testState } from "../stubs/supabase-server";

const ORIGIN = "http://localhost";

async function callback(
  next: string | null,
  extra: Record<string, string> = {}
) {
  const url = new URL(`${ORIGIN}/auth/callback`);
  url.searchParams.set("code", "abc");
  if (next !== null) url.searchParams.set("next", next);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
  const response = await GET(new Request(url.toString()));
  return new URL(response.headers.get("location") ?? "", ORIGIN);
}

afterEach(() => {
  testState().exchange = {
    user: {
      created_at: "2026-01-01T00:00:00Z",
      last_sign_in_at: "2026-06-01T00:00:00Z",
    },
    error: null,
  };
});

describe("/auth/callback", () => {
  const attacks = [
    "@evil.com",
    ".evil.com",
    "//evil.com",
    "///evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "https://evil.com",
    "http://evil.com/x",
    "javascript:alert(1)",
    "/\t/evil.com",
    "/\n/evil.com",
    "evil.com",
    "",
  ];

  test("no open redirect: every payload stays on our own host", async () => {
    for (const attack of attacks) {
      const location = await callback(attack);
      assert.equal(
        location.host,
        "localhost",
        `${JSON.stringify(attack)} -> ${location.href}`
      );
      assert.equal(location.protocol, "http:");
    }
  });

  test("hostile paths fall back to /dashboard", async () => {
    for (const attack of [
      "@evil.com",
      "//evil.com",
      "https://evil.com",
      "/\\evil.com",
    ]) {
      assert.equal((await callback(attack)).pathname, "/dashboard", attack);
    }
  });

  test("legitimate next path, query and hash are preserved", async () => {
    const location = await callback("/dashboard/settings?tab=billing#x");
    assert.equal(location.pathname, "/dashboard/settings");
    assert.equal(location.searchParams.get("tab"), "billing");
    assert.equal(location.hash, "#x");
  });

  test("no next parameter -> /dashboard", async () => {
    assert.equal((await callback(null)).pathname, "/dashboard");
  });

  test("a failed code exchange never redirects off-site", async () => {
    testState().exchange = { user: null, error: new Error("bad code") };
    const location = await callback("//evil.com");
    assert.equal(location.host, "localhost");
    assert.match(location.pathname, /login/);
  });
});
