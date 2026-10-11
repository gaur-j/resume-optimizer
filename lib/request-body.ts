/**
 * Reads a request body with a hard byte ceiling, counting bytes as they
 * arrive. request.json() / request.formData() buffer the WHOLE body before
 * you can look at it, and a Content-Length header can be absent (chunked)
 * or simply wrong, so neither is a safe size guard on its own.
 */
export class PayloadTooLargeError extends Error {
  constructor(public readonly maxBytes: number) {
    super(`Request body exceeds ${maxBytes} bytes`);
    this.name = "PayloadTooLargeError";
  }
}

async function readLimited(request: Request, maxBytes: number) {
  // Cheap early rejection when the client is honest about the size.
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new PayloadTooLargeError(maxBytes);
  }

  if (!request.body) return new Uint8Array(0);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        throw new PayloadTooLargeError(maxBytes);
      }
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }

  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function readLimitedJson(
  request: Request,
  maxBytes: number
): Promise<unknown> {
  const body = await readLimited(request, maxBytes);
  return JSON.parse(new TextDecoder().decode(body));
}

export async function readLimitedFormData(
  request: Request,
  maxBytes: number
): Promise<FormData> {
  const body = await readLimited(request, maxBytes);
  // Re-wrap so the platform's multipart parser can run on the bounded bytes.
  return new Response(body as BodyInit, {
    headers: { "content-type": request.headers.get("content-type") ?? "" },
  }).formData();
}
