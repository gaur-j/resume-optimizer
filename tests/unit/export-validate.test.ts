import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  ExportValidationError,
  validateExportResume,
} from "@/lib/export-validate";

const line = (type: string, text: string, extra: object = {}) => ({
  type,
  text,
  order: 0,
  ...extra,
});
const one = (lines: unknown[], heading = "H") => ({
  sections: [{ heading, lines }],
});

function kindOf(input: unknown) {
  try {
    validateExportResume(input);
    return "ok";
  } catch (error) {
    assert.ok(
      error instanceof ExportValidationError,
      "must be an ExportValidationError"
    );
    return error.kind;
  }
}

describe("validateExportResume", () => {
  test("a normal resume is accepted and normalised", () => {
    const resume = validateExportResume({
      sections: [
        {
          heading: "Experience",
          order: 1,
          lines: [line("bullet", "Built things", { indent: 1 })],
        },
      ],
    });
    assert.equal(resume.sections[0].heading, "Experience");
    assert.deepEqual(resume.sections[0].lines[0], {
      type: "bullet",
      text: "Built things",
      order: 0,
      indent: 1,
    });
  });

  test("malformed shapes are rejected as invalid", () => {
    for (const bad of [
      null,
      "x",
      5,
      [1],
      {},
      { sections: [] },
      { sections: "x" },
      { sections: [null] },
      { sections: [{ heading: "a", lines: "zzz" }] },
      { sections: [{ heading: "a", lines: ["x"] }] },
    ]) {
      assert.equal(kindOf(bad), "invalid", JSON.stringify(bad));
    }
  });

  test("size ceilings are enforced as too_large", () => {
    const sections = (n: number) =>
      Array.from({ length: n }, () => ({
        heading: "S",
        lines: [line("text", "x")],
      }));
    assert.equal(kindOf({ sections: sections(30) }), "ok");
    assert.equal(kindOf({ sections: sections(31) }), "too_large");
    assert.equal(
      kindOf(one(Array.from({ length: 600 }, () => line("text", "x")))),
      "ok"
    );
    assert.equal(
      kindOf(one(Array.from({ length: 601 }, () => line("text", "x")))),
      "too_large"
    );
    assert.equal(kindOf(one([line("text", "x".repeat(1501))])), "too_large");
    assert.equal(kindOf(one([], "h".repeat(101))), "too_large");
    assert.equal(
      kindOf(
        one(Array.from({ length: 50 }, () => line("text", "y".repeat(1400))))
      ),
      "too_large"
    );
  });

  test("unknown keys are dropped; bad type, indent and text are coerced to safe values", () => {
    const resume = validateExportResume({
      is_admin: true,
      sections: [
        {
          heading: "A",
          evil: "x",
          lines: [
            {
              type: "weird",
              text: "hello",
              indent: 999,
              order: "NaN",
              extra: 1,
            },
            { type: "bullet", text: 12345 },
            { type: "bullet", text: "ok", indent: -3 },
          ],
        },
      ],
    }) as unknown as Record<string, unknown>;
    assert.equal("is_admin" in resume, false);
    const lines = (
      resume.sections as {
        lines: { type: string; text: string; indent: number }[];
      }[]
    )[0].lines;
    assert.deepEqual(
      lines.map((l) => l.type),
      ["text", "bullet", "bullet"]
    );
    assert.deepEqual(
      lines.map((l) => l.indent),
      [0, 0, 0]
    );
    assert.equal(lines[1].text, "");
  });
});
