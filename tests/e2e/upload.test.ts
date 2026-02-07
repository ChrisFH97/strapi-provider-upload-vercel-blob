import { Readable } from "node:stream";
import { describe, it, expect, afterAll } from "vitest";
import { head, del } from "@vercel/blob";
import provider from "../../src/index.js";
import type { StrapiFile } from "../../src/types.js";

/**
 * E2E tests that upload real blobs to Vercel Blob storage.
 *
 * Requirements:
 *   1. Put your read-write token in `.env.test` at the project root.
 *   2. Run with:  npm run test:e2e
 *
 * Every blob created during the run is tracked and deleted in `afterAll`
 * so nothing is left behind in the store.
 */

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN ?? "";

/** URLs to clean up after the suite finishes. */
const uploadedUrls: string[] = [];

afterAll(async () => {
  if (uploadedUrls.length > 0) {
    await del(uploadedUrls, { token: TOKEN });
  }
});

/** Helper – build a minimal Strapi-shaped file object. */
function file(overrides: Partial<StrapiFile> = {}): StrapiFile {
  const id = Math.random().toString(36).slice(2, 10);
  return {
    name: `e2e-test-${id}.txt`,
    hash: `e2e_${id}`,
    ext: ".txt",
    mime: "text/plain",
    size: 1, // 1 KB
    url: "",
    ...overrides,
  };
}

describe("e2e – real Vercel Blob uploads", () => {
  const p = provider.init({ token: TOKEN, addRandomSuffix: false });

  // -----------------------------------------------------------------------
  // Buffer upload
  // -----------------------------------------------------------------------
  it("uploads a buffer and populates the file url", async () => {
    const f = file({ buffer: Buffer.from("hello from e2e buffer test") });

    await p.upload(f);
    uploadedUrls.push(f.url);

    expect(f.url).toMatch(/^https:\/\/.+\.public\.blob\.vercel-storage\.com\//);
    expect(f.previewUrl).toBe(f.url);
    expect(f.path).toContain("e2e_");

    // Verify the blob actually exists via the SDK
    const info = await head(f.url, { token: TOKEN });
    expect(info.contentType).toBe("text/plain");
    expect(info.size).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------------
  // Stream upload
  // -----------------------------------------------------------------------
  it("uploads a stream and populates the file url", async () => {
    const stream = Readable.from(Buffer.from("hello from e2e stream test"));
    const f = file({ stream: stream as any });

    await p.uploadStream(f);
    uploadedUrls.push(f.url);

    expect(f.url).toMatch(/^https:\/\/.+\.public\.blob\.vercel-storage\.com\//);

    const info = await head(f.url, { token: TOKEN });
    expect(info.size).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------------
  // Delete
  // -----------------------------------------------------------------------
  it("deletes a previously uploaded blob", async () => {
    const f = file({ buffer: Buffer.from("delete me") });

    await p.upload(f);

    // Confirm it exists
    const info = await head(f.url, { token: TOKEN });
    expect(info.url).toBe(f.url);

    // Delete through the provider
    await p.delete(f);

    // Confirm it's gone – head should throw
    await expect(head(f.url, { token: TOKEN })).rejects.toThrow();
  });
});
