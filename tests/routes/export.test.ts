import { afterEach, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/export/route";
import { testState } from "../stubs/supabase-server";
import { jsonInit } from "../helpers/bodies";

const line = (type: string, text: string, extra: object = {}) => ({
  type,
  text,
  order: 0,
  ...extra,
});
const resume = () => ({
  sections: [
    {
      heading: "Contact",
      order: 0,
      lines: [line("contact", "Jane Doe | jane@example.com")],
    },
    {
      heading: "Experience",
      order: 1,
      lines: [
        line("subheading", "Senior Engineer, Acme"),
        ...Array.from({ length: 10 }, (_, i) =>
          line("bullet", `Shipped feature ${i} improving latency`)
        ),
      ],
    },
    {
      heading: "Skills",
      order: 2,
      lines: [line("paragraph", "TypeScript, React, PostgreSQL")],
    },
  ],
});
const request = (body: unknown) =>
  new NextRequest("http://localhost/api/export", jsonInit(body));
const run = (body: unknown) => POST(request(body));

before(() => {
  testState().user = { id: "u1" };
});
afterEach(() => {
  const state = testState();
  state.user = { id: "u1" };
  state.subscriptionStatus = null;
  state.limiterAllows = true;
});

describe("/api/export", () => {
  test("a valid resume renders a real PDF with a constant filename", async () => {
    const response = await run({
      acceptedResume: resume(),
      templateId: "classic",
    });
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(response.status, 200);
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    assert.equal(
      response.headers.get("content-disposition"),
      'attachment; filename="tailored-resume.pdf"'
    );
  });

  test("an unknown template falls back to the default", async () => {
    assert.equal(
      (await run({ acceptedResume: resume(), templateId: "nope" })).status,
      200
    );
  });

  test("unauthenticated -> 401", async () => {
    testState().user = null;
    assert.equal((await run({ acceptedResume: resume() })).status, 401);
  });

  test("paid templates are locked for non-subscribers, open for active ones", async () => {
    const locked = await run({
      acceptedResume: resume(),
      templateId: "modern-accent",
    });
    assert.equal(locked.status, 403);
    assert.equal(
      ((await locked.json()) as { code: string }).code,
      "TEMPLATE_LOCKED"
    );

    testState().subscriptionStatus = "cancelled";
    assert.equal(
      (await run({ acceptedResume: resume(), templateId: "traditional-serif" }))
        .status,
      403
    );

    testState().subscriptionStatus = "active";
    assert.equal(
      (await run({ acceptedResume: resume(), templateId: "modern-accent" }))
        .status,
      200
    );
  });

  test("malformed payloads -> 400", async () => {
    for (const body of [
      {},
      { acceptedResume: null },
      { acceptedResume: "x" },
      { acceptedResume: { sections: [] } },
      { acceptedResume: { sections: [null] } },
      "{not json",
    ]) {
      assert.equal(
        (await run(body)).status,
        400,
        JSON.stringify(body).slice(0, 60)
      );
    }
  });

  test("oversize payloads -> 413", async () => {
    const tooManyLines = {
      sections: [
        {
          heading: "a",
          lines: Array.from({ length: 601 }, () => line("text", "x")),
        },
      ],
    };
    const longLine = {
      sections: [{ heading: "a", lines: [line("text", "x".repeat(1501))] }],
    };
    const hugeBody = {
      sections: [{ heading: "a", lines: [line("text", "z".repeat(400_000))] }],
    };
    for (const acceptedResume of [tooManyLines, longLine, hugeBody]) {
      assert.equal((await run({ acceptedResume })).status, 413);
    }
  });

  test("when the rate limiter says no -> 429 with Retry-After", async () => {
    testState().limiterAllows = false;
    const response = await run({ acceptedResume: resume() });
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("retry-after"), "42");
  });

  test("control characters, odd unicode and every line type never crash the renderer", async () => {
    const nasty = [
      "a\tb",
      "a\nb",
      "a\r\nb",
      "a\fb",
      "a\u0007b",
      "a\u001b[31mb",
      "a\u0000b",
      "a\u007fb",
      "a\u0085b",
      "a\u2028b",
      "a🚀b",
      "日本語",
      "a\u200db",
      "\ufeffab",
      "a\ud800b",
      "\u0007\u001b\u0000",
      "   \t  \n  ",
      "",
      "a\\(b)c",
      "100%\u0000",
    ];
    const types = [
      "contact",
      "subheading",
      "paragraph",
      "bullet",
      "text",
      "spacer",
    ];
    const failures: string[] = [];
    for (const text of nasty) {
      const sections = [
        {
          heading: text,
          order: 0,
          lines: types.map((type, i) =>
            line(type, text, { order: i, indent: 1 })
          ),
        },
      ];
      const response = await run({ acceptedResume: { sections } });
      if (response.status !== 200)
        failures.push(`${JSON.stringify(text)} -> ${response.status}`);
    }
    assert.deepEqual(failures, []);
  });
});

describe("when something unexpected fails", () => {
  test("the client gets a generic 500 (no internals) AND an alert is sent", async () => {
    const realFetch = globalThis.fetch;
    const sent: { url: string; body: string }[] = [];
    globalThis.fetch = (async (url: unknown, init: RequestInit) => {
      sent.push({ url: String(url), body: String(init?.body) });
      return new Response("ok");
    }) as typeof fetch;
    process.env.ERROR_WEBHOOK_URL = "https://hooks.example.com/alerts";
    const { _resetThrottleForTests } = await import("@/lib/monitoring");
    _resetThrottleForTests();

    try {
      // A paid template makes the route look up the user's subscription; make that blow up.
      testState().failQueries = true;
      const response = await run({
        acceptedResume: resume(),
        templateId: "modern-accent",
      });
      const body = (await response.json()) as { error: string };

      assert.equal(response.status, 500);
      assert.ok(
        !/ECONNREFUSED|hunter2|10\.0\.0\.5/.test(JSON.stringify(body)),
        "internal details must not reach the client"
      );

      assert.equal(sent.length, 1, "exactly one alert is posted");
      assert.equal(sent[0].url, "https://hooks.example.com/alerts");
      assert.match(sent[0].body, /export\.error/);
      assert.ok(
        !/hunter2/.test(sent[0].body),
        "secrets in the error message must be masked in the alert too"
      );
    } finally {
      testState().failQueries = false;
      globalThis.fetch = realFetch;
      delete process.env.ERROR_WEBHOOK_URL;
    }
  });
});
