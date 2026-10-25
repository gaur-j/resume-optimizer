import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  _resetThrottleForTests,
  formatAlert,
  redactSecrets,
  reportError,
} from "@/lib/monitoring";

type Call = { url: string; init: RequestInit };
const realFetch = globalThis.fetch;
let calls: Call[];

beforeEach(() => {
  calls = [];
  _resetThrottleForTests();
  globalThis.fetch = (async (url: unknown, init: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response("ok");
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.ERROR_WEBHOOK_URL;
});

describe("reportError", () => {
  test("does nothing when ERROR_WEBHOOK_URL is not set", async () => {
    delete process.env.ERROR_WEBHOOK_URL;
    await reportError("scope", new Error("boom"));
    assert.equal(calls.length, 0);
  });

  test("refuses non-https and malformed URLs", async () => {
    for (const bad of [
      "http://hooks.example.com/x",
      "not a url",
      "ftp://x.com/y",
    ]) {
      process.env.ERROR_WEBHOOK_URL = bad;
      await reportError("scope", new Error("boom"));
    }
    assert.equal(calls.length, 0);
  });

  test("posts a Slack- and Discord-compatible payload to an https webhook", async () => {
    process.env.ERROR_WEBHOOK_URL = "https://hooks.example.com/abc";
    await reportError("razorpay.webhook.grant_failed", new Error("db down"), {
      orderId: "order_1",
    });
    assert.equal(calls.length, 1);
    const body = JSON.parse(String(calls[0].init.body));
    assert.equal(body.text, body.content);
    assert.match(body.text, /razorpay\.webhook\.grant_failed/);
    assert.match(body.text, /db down/);
    assert.match(body.text, /orderId=order_1/);
  });

  test("the same alert is throttled, a different one is not", async () => {
    process.env.ERROR_WEBHOOK_URL = "https://hooks.example.com/abc";
    await reportError("a", new Error("same"));
    await reportError("a", new Error("same"));
    await reportError("a", new Error("different"));
    assert.equal(calls.length, 2);
  });

  test("never throws, even if the network call fails", async () => {
    process.env.ERROR_WEBHOOK_URL = "https://hooks.example.com/abc";
    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as typeof fetch;
    await assert.doesNotReject(reportError("scope", new Error("x")));
  });
});

describe("formatAlert", () => {
  test("truncates long messages and values, skips empty context", () => {
    const text = formatAlert("s", new Error("m".repeat(1000)), {
      a: "v".repeat(500),
      b: undefined,
      c: null,
    });
    assert.ok(text.length < 600);
    assert.ok(!text.includes("b=") && !text.includes("c="));
  });

  test("handles non-Error values", () => {
    assert.match(formatAlert("s", "just a string"), /just a string/);
  });
});

describe("redactSecrets (alerts must not leak credentials)", () => {
  const cases: [string, string][] = [
    ["connect ECONNREFUSED password=hunter2 host=db", "hunter2"],
    ["postgres://admin:s3cr3tP@ss@db.example.com:5432/app", "s3cr3tP"],
    ["https://user:pa55word@api.example.com/x", "pa55word"],
    ["Authorization: Bearer abc123.def456-ghi789", "abc123.def456"],
    ["token=abcdef123456 failed", "abcdef123456"],
    ['{"apiKey": "SuperSecretValue99"}', "SuperSecretValue99"],
    [
      "bad key eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcDEF123_-xyz",
      "eyJhbGciOiJIUzI1NiJ9",
    ],
    ["sk_live_51Habcdefghijklmnop leaked", "sk_live_51H"],
    ["rzp_live_AbCdEf123456 rejected", "rzp_live_AbCdEf"],
    ["gsk_AbCdEfGhIjKlMnOp0123 invalid", "gsk_AbCdEf"],
    ["key AIzaSyA1234567890abcdefghijklmnop bad", "AIzaSyA1234567890"],
  ];

  for (const [input, secret] of cases) {
    test(`masks the secret in: ${input.slice(0, 44)}`, () => {
      const out = redactSecrets(input);
      assert.ok(!out.includes(secret), `still contains "${secret}": ${out}`);
    });
  }

  test("ordinary error text is left alone", () => {
    const text = 'relation "users" does not exist (code 42P01)';
    assert.equal(redactSecrets(text), text);
  });

  test("formatAlert redacts message and context values", () => {
    const alert = formatAlert("s", new Error("db password=hunter2"), {
      note: "token=abcdef123456",
    });
    assert.ok(!alert.includes("hunter2") && !alert.includes("abcdef123456"));
  });
});
