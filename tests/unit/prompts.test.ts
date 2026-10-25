import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * The model is shown an example JSON object inside each system prompt. Those
 * live in template strings, so a lost brace still compiles - and TypeScript
 * cannot see it. This has already happened once (a closing "}" was deleted),
 * so the examples are parsed here.
 */
// Normalise line endings: on Windows git checks files out with CRLF.
const source = readFileSync("lib/ai.ts", "utf8").replace(/\r\n/g, "\n");

function exampleAround(needle: string) {
  const anchor = source.indexOf(needle);
  assert.ok(anchor > 0, `could not find ${needle} in lib/ai.ts`);
  const start = source.lastIndexOf("\n{", anchor) + 1;
  const end = source.indexOf("UNTRUSTED_INPUT_NOTICE", anchor);
  const block = source.slice(start, end);
  return block.slice(0, block.lastIndexOf("}") + 1);
}

describe("AI prompt integrity", () => {
  test("the ATS example JSON is valid", () => {
    const parsed = JSON.parse(exampleAround('"overall_score": 72'));
    assert.equal(typeof parsed.overall_score, "number");
    assert.ok(Array.isArray(parsed.quick_wins));
  });

  test("the bullet-rewrite example JSON is valid", () => {
    const parsed = JSON.parse(exampleAround('"rewrites": ['));
    assert.ok(Array.isArray(parsed.rewrites));
  });

  test("every LLM prompt carries the untrusted-input notice", () => {
    const uses = source.match(/UNTRUSTED_INPUT_NOTICE/g) ?? [];
    assert.ok(
      uses.length >= 4,
      `expected the notice in ATS, bullets and tailor prompts (found ${uses.length} mentions)`
    );
  });

  test("user text is fenced, never concatenated raw", () => {
    assert.ok(
      source.includes('fenceUntrusted(\n    "resume"') ||
        source.includes('fenceUntrusted("resume"')
    );
    assert.ok(
      !/`RESUME:\\n\$\{resumeText\}/.test(source),
      "raw resume text must not be interpolated into a prompt"
    );
  });
});
