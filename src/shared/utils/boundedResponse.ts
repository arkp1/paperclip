function declaredLength(response: Response): number {
  const value = Number(response.headers.get("content-length") ?? "0");
  return Number.isFinite(value) && value > 0 ? value : 0;
}

async function readChunks(
  response: Response,
  maxBytes: number
): Promise<Uint8Array | null> {
  const body = response.body;
  if (!body || typeof body.getReader !== "function") {
    return null;
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new Error("The remote response is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock?.();
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

export async function readBoundedText(
  response: Response,
  maxBytes: number,
  maxCharacters: number
): Promise<string> {
  const declared = declaredLength(response);
  if (declared > maxBytes) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error("The remote response is too large.");
  }

  if (typeof TextDecoder === "undefined") {
    return (await response.text()).slice(0, maxCharacters);
  }

  const bytes = await readChunks(response, maxBytes);
  if (!bytes) {
    return (await response.text()).slice(0, maxCharacters);
  }
  return new TextDecoder("utf-8").decode(bytes).slice(0, maxCharacters);
}

export async function readBoundedArrayBuffer(
  response: Response,
  maxBytes: number
): Promise<ArrayBuffer> {
  const declared = declaredLength(response);
  if (declared > maxBytes) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error("The remote response is too large.");
  }

  const bytes = await readChunks(response, maxBytes);
  if (bytes) {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return copy.buffer;
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > maxBytes) {
    throw new Error("The remote response is too large.");
  }
  return buffer;
}
