import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { serializeJsonLd } from "@/lib/json-ld";

describe("serializeJsonLd", () => {
  test("cannot break out of a <script> element", () => {
    const data = {
      name: "</script><script>alert(1)</script>",
      note: "a & b <b>",
    };
    const out = serializeJsonLd(data);
    assert.ok(!out.includes("<") && !out.includes(">") && !out.includes("&"));
  });

  test("is still valid JSON that decodes to the original", () => {
    const data = {
      name: "</script>",
      n: 1,
      list: ["<a>", "x&y"],
      nested: { k: "é\u2028\u2029" },
    };
    assert.deepEqual(JSON.parse(serializeJsonLd(data)), data);
  });

  test("leaves ordinary data readable", () => {
    assert.equal(serializeJsonLd({ a: "b" }), '{"a":"b"}');
  });
});
