import { before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { POST as authRoute } from "@/app/api/extract-pdf/route";
import { POST as publicRoute } from "@/app/api/public-extract-pdf/route";
import { testState } from "../stubs/supabase-server";
import { setPublicLimitAllows } from "../stubs/ip-rate-limit";
import { multipartInit } from "../helpers/bodies";

/**
 * Both PDF upload routes share lib/pdf-upload.ts. These expectations were
 * captured from the routes BEFORE they were refactored onto the shared helper
 * (24 scenarios, byte-identical afterwards), so they pin the user-visible
 * behaviour: status codes, wording, and the one real difference (the login
 * route accepts 20+ characters of text, the public one needs 50+).
 */
async function pdf(pages: number, text: string) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++)
    doc.addPage([612, 792]).drawText(text, { x: 20, y: 700, size: 9, font });
  return Buffer.from(await doc.save());
}

const form = (bytes?: Uint8Array) => {
  const fd = new FormData();
  if (bytes)
    fd.set(
      "file",
      new File([new Uint8Array(bytes)], "r.pdf", { type: "application/pdf" })
    );
  return fd;
};
const request = async (fd: FormData) =>
  new NextRequest("http://localhost/x", await multipartInit(fd));
const LONG =
  "Jane Doe Senior Engineer built scalable distributed systems and led teams of five engineers.";

type Route = typeof authRoute;
async function call(route: Route, fd: FormData) {
  // Capture what the server logs, so an unexpected 500 explains itself
  // instead of leaving only "500 !== 400".
  const logged: string[] = [];
  const realError = console.error;
  console.error = (...args: unknown[]) => {
    logged.push(
      args
        .map((a) =>
          a instanceof Error ? `${a.name}: ${a.message}` : String(a)
        )
        .join(" ")
    );
  };
  let response: Response;
  try {
    response = await route(await request(fd));
  } finally {
    console.error = realError;
  }
  const body = (await response.json()) as {
    error?: string;
    data?: { text: string };
  };
  if (response.status === 500) {
    assert.fail(
      `unexpected 500 (${body.error}); the server logged: ${
        logged.join(" | ") || "nothing"
      }`
    );
  }
  return { status: response.status, body, logged };
}

before(() => {
  testState().user = { id: "u1" };
  setPublicLimitAllows(true);
});

const routes: {
  name: string;
  route: Route;
  minText: number;
  messages: Record<string, string>;
}[] = [
  {
    name: "signed-in route",
    route: authRoute,
    minText: 20,
    messages: {
      noFile: "No file was uploaded.",
      tooLarge: "File is too large. Please upload a PDF under 5 MB.",
      notPdf:
        "This file doesn't appear to be a valid PDF. Please upload the original PDF resume.",
      unreadable: "We couldn't read this PDF. It may be damaged",
      littleText:
        "We couldn't find enough readable text in this PDF. This usually",
    },
  },
  {
    name: "public route",
    route: publicRoute,
    minText: 50,
    messages: {
      noFile: "No resume PDF was uploaded.",
      tooLarge: "Your resume is too large. Please upload a PDF under 5 MB.",
      notPdf: "This file doesn't appear to be a valid PDF.",
      unreadable:
        "We couldn't read this PDF. Please upload a text-based resume PDF.",
      littleText:
        "We couldn't find enough readable text in this PDF. Scanned/image",
    },
  },
];

for (const { name, route, minText, messages } of routes) {
  describe(name, () => {
    test("no file / a non-file field -> 400", async () => {
      for (const fd of [
        form(),
        (() => {
          const f = new FormData();
          f.set("file", "text");
          return f;
        })(),
      ]) {
        const { status, body } = await call(route, fd);
        assert.equal(status, 400);
        assert.equal(body.error, messages.noFile);
      }
    });

    test("empty file -> 400", async () => {
      const { status, body } = await call(route, form(new Uint8Array(0)));
      assert.equal(status, 400);
      assert.equal(body.error, "The uploaded file is empty.");
    });

    test("6 MB upload is stopped at the body cap -> 413", async () => {
      const { status, body } = await call(
        route,
        form(new Uint8Array(6 * 1024 * 1024).fill(0x25))
      );
      assert.equal(status, 413);
      assert.equal(body.error, messages.tooLarge);
    });

    test("just over the 5 MB file cap -> 400", async () => {
      const { status, body } = await call(
        route,
        form(new Uint8Array(5 * 1024 * 1024 + 10_000).fill(0x25))
      );
      assert.equal(status, 400);
      assert.equal(body.error, messages.tooLarge);
    });

    test("not a PDF (wrong signature) -> 400", async () => {
      const { status, body } = await call(
        route,
        form(Buffer.from("hello world, definitely not a pdf"))
      );
      assert.equal(status, 400);
      assert.equal(body.error, messages.notPdf);
    });

    test("PDF header but garbage inside -> 422", async () => {
      const { status, body } = await call(
        route,
        form(Buffer.from("%PDF-1.7\n" + "garbage".repeat(300)))
      );
      assert.equal(status, 422);
      assert.ok(body.error?.startsWith(messages.unreadable), body.error);
    });

    test("a valid resume returns its text", async () => {
      const { status, body } = await call(route, form(await pdf(1, LONG)));
      assert.equal(status, 200);
      assert.equal(body.data?.text, LONG);
    });

    test("no text at all -> 422", async () => {
      const { status, body } = await call(route, form(await pdf(1, "")));
      assert.equal(status, 422);
      assert.ok(body.error?.startsWith(messages.littleText), body.error);
    });

    test(`a 60-page PDF is rejected from its header -> 422`, async () => {
      const { status, body } = await call(route, form(await pdf(60, LONG)));
      assert.equal(status, 422);
      assert.match(body.error ?? "", /60 pages/);
    });

    test(`the minimum text length is ${minText} characters`, async () => {
      const text28 = "Short resume text of 30 char"; // 28 characters
      const { status } = await call(route, form(await pdf(1, text28)));
      assert.equal(status, minText === 20 ? 200 : 422);
    });
  });
}

describe("the gates in front of the shared handler", () => {
  test("signed-in route: unauthenticated -> 401, nothing is parsed", async () => {
    testState().user = null;
    const { status, body } = await call(authRoute, form(await pdf(1, LONG)));
    testState().user = { id: "u1" };
    assert.equal(status, 401);
    assert.equal(body.error, "Unauthorized");
  });

  test("public route: when the IP limiter says no -> 429 with Retry-After", async () => {
    setPublicLimitAllows(false);
    const response = await publicRoute(await request(form(await pdf(1, LONG))));
    setPublicLimitAllows(true);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("retry-after"), "7");
  });
});
