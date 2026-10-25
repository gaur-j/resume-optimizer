/**
 * Request-body helpers for tests.
 *
 * Why not just `new Request(url, { body: formData })` or `{ body: "text" }`?
 * Node builds those bodies with an internal stream that closes itself on a
 * microtask after the last chunk. When the code under test stops reading early
 * and cancels the stream (which is exactly what the size-limit guard in
 * lib/request-body.ts is supposed to do), that late close() throws
 * "ReadableStream is already closed" as an unhandled rejection on Node 24+,
 * and the test runner marks the whole file as failed.
 *
 * A plain pull-based stream we control has no such race, behaves like a real
 * network upload (many chunks, no Content-Length), and works on every Node.
 */
const CHUNK_BYTES = 16 * 1024;

export function chunkedStream(
  bytes: Uint8Array,
  chunkSize = CHUNK_BYTES
): ReadableStream<Uint8Array> {
  let offset = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
        return;
      }
      controller.enqueue(bytes.slice(offset, offset + chunkSize));
      offset += chunkSize;
    },
  });
}

/** Serialises a FormData into raw multipart bytes plus its Content-Type. */
export async function multipartBytes(form: FormData) {
  const response = new Response(form);
  return {
    bytes: new Uint8Array(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") ?? "",
  };
}

// Omit "signal": NextRequest's init type is narrower than RequestInit there.
type StreamingInit = Omit<RequestInit, "signal"> & { duplex: "half" };

export async function multipartInit(form: FormData): Promise<StreamingInit> {
  const { bytes, contentType } = await multipartBytes(form);
  return {
    method: "POST",
    headers: { "content-type": contentType },
    body: chunkedStream(bytes),
    duplex: "half",
  };
}

export function jsonInit(body: unknown): StreamingInit {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: chunkedStream(new TextEncoder().encode(text)),
    duplex: "half",
  };
}
