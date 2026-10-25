import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  safeDisplayName,
  safeEqual,
  safeHttpsUrl,
  safeRedirectPath,
  sanitizeAttribution,
} from "@/lib/security";

const ORIGIN = "https://app.example.com";

describe("safeRedirectPath (open-redirect guard)", () => {
  const attacks: (string | null | undefined)[] = [
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
    "/\u0000/evil.com",
    "evil.com",
    "",
    null,
    undefined,
  ];

  for (const attack of attacks) {
    test(`rejects ${JSON.stringify(attack)}`, () => {
      assert.equal(safeRedirectPath(attack, ORIGIN), "/dashboard");
    });
  }

  test("whatever it returns stays on our origin", () => {
    for (const input of [...attacks, "/%09/evil.com", "/%2F/evil.com", "/ok"]) {
      const result = safeRedirectPath(input, ORIGIN);
      assert.equal(new URL(result, ORIGIN).origin, ORIGIN, String(input));
    }
  });

  test("keeps legitimate same-site paths, query and hash", () => {
    assert.equal(
      safeRedirectPath("/dashboard/settings", ORIGIN),
      "/dashboard/settings"
    );
    assert.equal(
      safeRedirectPath("/dashboard/settings?tab=billing#x", ORIGIN),
      "/dashboard/settings?tab=billing#x"
    );
    assert.equal(safeRedirectPath("/", ORIGIN), "/");
  });

  test("honours a custom fallback", () => {
    assert.equal(safeRedirectPath("//evil.com", ORIGIN, "/home"), "/home");
  });
});

describe("safeEqual (constant-time compare)", () => {
  const hash = "a".repeat(64);

  test("equal / different / different length / empty", () => {
    assert.equal(safeEqual(hash, hash), true);
    assert.equal(safeEqual(hash, "b".repeat(64)), false);
    assert.equal(safeEqual(hash, hash.slice(1)), false);
    assert.equal(safeEqual(hash, ""), false);
    assert.equal(safeEqual("", hash), false);
    assert.equal(safeEqual("", ""), true);
  });

  test("same character count but different byte length does not throw", () => {
    assert.equal(safeEqual(hash, "é".repeat(64)), false);
  });
});

describe("sanitizeAttribution", () => {
  test("non-objects and empties become null", () => {
    for (const value of [null, undefined, "x", 42, [1], {}]) {
      assert.equal(sanitizeAttribution(value), null);
    }
  });

  test("keeps only the three known keys, trimmed, control chars stripped, capped", () => {
    const clean = sanitizeAttribution({
      utm_source: "  google ",
      utm_medium: "cpc\n\u0000",
      utm_campaign: "x".repeat(500),
      evil: "<script>",
      utm_extra: "1",
    });
    assert.deepEqual(Object.keys(clean ?? {}).sort(), [
      "utm_campaign",
      "utm_medium",
      "utm_source",
    ]);
    assert.equal(clean?.utm_source, "google");
    assert.equal(clean?.utm_medium, "cpc");
    assert.equal(clean?.utm_campaign?.length, 100);
  });

  test("non-string values are dropped", () => {
    assert.equal(
      sanitizeAttribution({ utm_source: 5, utm_medium: {}, utm_campaign: [] }),
      null
    );
  });
});

describe("safeDisplayName (user_metadata is user-writable)", () => {
  test("non-strings use the fallback", () => {
    for (const value of [undefined, null, 5, {}, ["a"]]) {
      assert.equal(safeDisplayName(value, "User"), "User");
    }
  });

  test("control characters and runs of whitespace are collapsed", () => {
    assert.equal(safeDisplayName("  Jane\u0000\t\n  Doe  "), "Jane Doe");
  });

  test("is capped at 100 characters by default", () => {
    assert.equal(safeDisplayName("x".repeat(100_000)).length, 100);
    assert.equal(safeDisplayName("x".repeat(50), "", 10).length, 10);
  });

  test("empty after cleaning falls back", () => {
    assert.equal(safeDisplayName("\u0000\u0007  ", "User"), "User");
  });

  test("keeps normal international names", () => {
    assert.equal(safeDisplayName("Åsa Müller-Řezníček"), "Åsa Müller-Řezníček");
    assert.equal(safeDisplayName("日本 太郎"), "日本 太郎");
  });
});

describe("safeHttpsUrl (avatar_url)", () => {
  test("accepts plain https URLs", () => {
    assert.equal(
      safeHttpsUrl("https://lh3.googleusercontent.com/a/photo=s96"),
      "https://lh3.googleusercontent.com/a/photo=s96"
    );
  });

  test("rejects everything else", () => {
    const bad = [
      "http://example.com/a.png",
      "javascript:alert(1)",
      "data:image/svg+xml;base64,AAAA",
      "https://user:pass@example.com/a.png",
      "//example.com/a.png",
      "not a url",
      "",
      "https://example.com/" + "a".repeat(600),
      undefined,
      null,
      42,
      {},
    ];
    for (const value of bad) {
      assert.equal(safeHttpsUrl(value), undefined, String(value).slice(0, 40));
    }
  });
});
