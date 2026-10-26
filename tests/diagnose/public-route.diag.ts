/**
 * Diagnostic for "the public PDF route returns 500 in my environment".
 * Run with:  node scripts/diagnose.mjs
 * Each step is isolated so the output shows WHICH layer fails and why.
 * It prints only technical facts (versions, statuses, error text); no secrets.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import * as limiter from "@/lib/ip-rate-limit";
import { POST as publicRoute } from "@/app/api/public-extract-pdf/route";
import { POST as authRoute } from "@/app/api/extract-pdf/route";
import { handlePdfUpload } from "@/lib/pdf-upload";
import { readLimitedFormData } from "@/lib/request-body";
import { multipartInit } from "../helpers/bodies";
import { testState } from "../stubs/supabase-server";

const say = (key: string, value: unknown) => process.stdout.write(`DIAG ${key}: ${value}\n`);
const firstLines = (e: unknown, n = 4) =>
  String((e instanceof Error && e.stack) || e).split("\n").slice(0, n).join(" // ");

process.on("unhandledRejection", (e) => say("UNHANDLED REJECTION", firstLines(e)));
process.on("uncaughtException", (e) => say("UNCAUGHT EXCEPTION", firstLines(e)));

// Records WHERE every 500 response is created, even when nothing is logged.
let lastFiveHundred = "";
const realJson = NextResponse.json.bind(NextResponse);
NextResponse.json = ((body: unknown, init?: ResponseInit) => {
  if (init?.status === 500) {
    Error.stackTraceLimit = 40;
    lastFiveHundred = String(new Error("500 created here").stack)
      .split("\n").slice(1)
      .filter((line) => /resume-optimizer|[\\/](app|lib|tests)[\\/]/.test(line) && !/node_modules/.test(line))
      .slice(0, 6).map((line) => line.trim().replace(/^at /, "")).join("  <-  ");
  }
  return realJson(body, init);
}) as typeof NextResponse.json;

/** Short fingerprint of a file with line endings normalised, so Windows and Linux copies compare equal. */
function fingerprint(path: string) {
  try {
    const text = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
    return `${createHash("sha256").update(text).digest("hex").slice(0, 12)} (${text.split("\n").length} lines)`;
  } catch (error) {
    return `UNREADABLE: ${String(error).slice(0, 60)}`;
  }
}

async function tinyPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage([612, 792]).drawText("Jane Doe Senior Engineer built scalable distributed systems and led teams.", { x: 20, y: 700, size: 9, font });
  return Buffer.from(await doc.save());
}

async function step(name: string, fn: () => Promise<unknown>) {
  // Every console.error goes straight to the terminal so nothing can hide it.
  const realError = console.error;
  console.error = (...args: unknown[]) => say(`  [console.error during "${name}"]`, args.map((a) => firstLines(a, 2)).join(" "));
  try {
    say(name, await fn());
  } catch (error) {
    say(`${name} THREW`, firstLines(error));
  } finally {
    console.error = realError;
  }
}

async function main() {
  say("node", process.version);
  say("platform", `${process.platform} ${process.arch}`);
  say("NODE_OPTIONS", process.env.NODE_OPTIONS || "(none)");
  say("console.error is native", /\[native code\]/.test(Function.prototype.toString.call(console.error)));
  say("route imports the STUB limiter (has setPublicLimitAllows)", typeof (limiter as Record<string, unknown>).setPublicLimitAllows === "function");
  say("limiter exports", Object.keys(limiter).join(", "));

  for (const file of [
    "app/api/public-extract-pdf/route.ts",
    "app/api/extract-pdf/route.ts",
    "lib/pdf-upload.ts",
    "lib/ip-rate-limit.ts",
    "tests/stubs/ip-rate-limit.ts",
    "tests/stubs/supabase-server.ts",
  ]) say(`fingerprint ${file}`, fingerprint(file));

  testState().user = { id: "u1" };
  const pdf = await tinyPdf();
  const form = () => { const f = new FormData(); f.set("file", new File([new Uint8Array(pdf)], "r.pdf", { type: "application/pdf" })); return f; };
  const req = async () => new NextRequest("http://localhost/x", await multipartInit(form()));

  await step("1. limiter.checkPublicRateLimit()", async () => JSON.stringify(await limiter.checkPublicRateLimit(await req(), "x", [], { max: 1, windowSeconds: 1 } as never)));
  await step("2. readLimitedFormData(valid PDF)", async () => { const fd = await readLimitedFormData(await req(), 6_000_000); const f = fd.get("file"); return f instanceof File ? `ok, file ${f.size} bytes` : "no file parsed"; });
  await step("3. handlePdfUpload() directly", async () => { const r = await handlePdfUpload(await req(), { minTextLength: 20, extractionLogLabel: "x", uploadLogLabel: "x", messages: { noFile: "nf", tooLarge: "tl", notPdf: "np", unreadable: "ur", tooLittleText: "lt", serverError: "SERVER-ERROR" } }); return `${r.status} ${JSON.stringify(await r.json()).slice(0, 120)}`; });
  await step("4. signed-in route", async () => { const r = await authRoute(await req()); return `${r.status} ${JSON.stringify(await r.json()).slice(0, 120)}`; });
  await step("5. PUBLIC route", async () => { const r = await publicRoute(await req()); return `${r.status} ${JSON.stringify(await r.json()).slice(0, 120)}`; });
  say("where the 500 in step 5 was created", lastFiveHundred || "(no NextResponse.json 500 was created)");
  await step("6. PUBLIC route, second call", async () => { const r = await publicRoute(await req()); return `${r.status} ${JSON.stringify(await r.json()).slice(0, 120)}`; });
  say("done", "paste everything that starts with DIAG");
  process.exit(0);
}

main().catch((e) => { say("DIAGNOSTIC SCRIPT FAILED", firstLines(e)); process.exit(1); });
