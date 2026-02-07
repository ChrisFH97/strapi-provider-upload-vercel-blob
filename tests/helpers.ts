import { Readable } from "node:stream";
import type { StrapiFile } from "../src/types.js";

/**
 * Builds a minimal StrapiFile with sensible defaults.
 * Override any field by passing a partial.
 */
export function createMockFile(overrides: Partial<StrapiFile> = {}): StrapiFile {
  return {
    name: "photo.png",
    hash: "abc123",
    ext: ".png",
    mime: "image/png",
    size: 256, // kilobytes
    url: "",
    ...overrides,
  };
}

/**
 * Returns a tiny readable stream useful for `uploadStream` tests.
 */
export function createMockStream(): Readable {
  const stream = new Readable();
  stream.push(Buffer.from("fake-stream-data"));
  stream.push(null);
  return stream;
}

/**
 * Standard blob result returned by the mocked `put` call.
 */
export function createMockPutResult(overrides: Record<string, unknown> = {}) {
  return {
    url: "https://blob.vercel-storage.com/abc123.png",
    pathname: "abc123.png",
    contentType: "image/png",
    contentDisposition: 'inline; filename="abc123.png"',
    ...overrides,
  };
}
