import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { head } from "@vercel/blob";
import provider from "../../src/index.js";
import type { StrapiFile } from "../../src/types.js";

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN ?? "";

describe("e2e – 25 MB file upload", () => {
  const p = provider.init({ token: TOKEN, addRandomSuffix: false });

  it("uploads a 25 MB buffer successfully", async () => {
    const filePath = resolve(import.meta.dirname, "test-25mb.bin");
    const buffer = readFileSync(filePath);

    const file: StrapiFile = {
      name: "test-25mb.bin",
      hash: `e2e_large_${Date.now()}`,
      ext: ".bin",
      mime: "application/octet-stream",
      size: 25 * 1024, // 25 MB in KB (Strapi uses KB)
      url: "",
      buffer,
    };

    await p.upload(file);

    console.log("25 MB upload URL:", file.url);

    expect(file.url).toMatch(/^https:\/\/.+\.public\.blob\.vercel-storage\.com\//);

    const info = await head(file.url, { token: TOKEN });
    expect(info.size).toBe(25 * 1024 * 1024);
    expect(info.contentType).toBe("application/octet-stream");

    console.log("Verified: size =", info.size, "bytes, contentType =", info.contentType);
  });
});
