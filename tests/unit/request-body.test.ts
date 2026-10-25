import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  PayloadTooLargeError,
  readLimitedFormData,
  readLimitedJson,
} from "@/lib/request-body";
import { chunkedStream, multipartInit } from "../helpers/bodies";

const post = (body: BodyInit, init: RequestInit = {}) =>
  new Request("http://x/y", {
    method: "POST",
    body,
    ...init,
    duplex: "half",
  } as RequestInit);

describe("bounded request body reader", () => {
  test("reads a normal JSON body", async () => {
    const value = (await readLimitedJson(
      post(JSON.stringify({ a: 1 })),
      1000
    )) as { a: number };
    assert.equal(value.a, 1);
  });

  test("rejects an oversize body that admits its size (Content-Length), without reading it", async () => {
    const request = post("x".repeat(5000), {
      headers: { "content-length": "5000" },
    });
    await assert.rejects(readLimitedJson(request, 1000), PayloadTooLargeError);
  });

  test("rejects an oversize body even when Content-Length lies", async () => {
    const big = new TextEncoder().encode("x".repeat(50_000));
    const request = new Request("http://x/y", {
      method: "POST",
      headers: { "content-length": "10" },
      body: chunkedStream(big),
      duplex: "half",
    } as RequestInit);
    await assert.rejects(readLimitedJson(request, 1000), PayloadTooLargeError);
  });

  test("aborts a chunked body with NO Content-Length while it is still streaming", async () => {
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled++;
        if (pulled > 10_000) return controller.close();
        controller.enqueue(new Uint8Array(1024));
      },
    });
    await assert.rejects(
      readLimitedJson(post(stream), 10_000),
      PayloadTooLargeError
    );
    assert.ok(
      pulled < 50,
      `stopped reading early (pulled ${pulled} chunks, not 10,000)`
    );
  });

  test("multipart uploads round-trip within the limit", async () => {
    const form = new FormData();
    form.set("file", new File([new Uint8Array(1000)], "r.pdf"));
    const parsed = await readLimitedFormData(
      new Request("http://x/y", await multipartInit(form)),
      1_000_000
    );
    const file = parsed.get("file");
    assert.ok(file instanceof File);
    assert.equal(file.size, 1000);
  });

  test("oversize multipart is rejected", async () => {
    const form = new FormData();
    form.set("file", new File([new Uint8Array(200_000)], "big.pdf"));
    await assert.rejects(
      readLimitedFormData(
        new Request("http://x/y", await multipartInit(form)),
        50_000
      ),
      PayloadTooLargeError
    );
  });
});
