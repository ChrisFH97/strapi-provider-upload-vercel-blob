import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockFile, createMockPutResult, createMockStream } from "./helpers.js";

// ---------------------------------------------------------------------------
// Mock the @vercel/blob SDK
// ---------------------------------------------------------------------------
const { mockPut, mockDel } = vi.hoisted(() => ({
  mockPut: vi.fn(),
  mockDel: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  put: mockPut,
  del: mockDel,
}));

import provider from "../src/index.js";

const TOKEN = "provider_test_token";

describe("provider.init", () => {
  beforeEach(() => {
    mockPut.mockReset();
    mockDel.mockReset();
  });

  // -------------------------------------------------------------------------
  // upload (buffer)
  // -------------------------------------------------------------------------
  describe("upload", () => {
    it("uploads a file via its buffer", async () => {
      mockPut.mockResolvedValueOnce(createMockPutResult());

      const p = provider.init({ token: TOKEN });
      const file = createMockFile({ buffer: Buffer.from("img-data") });

      await p.upload(file);

      expect(mockPut).toHaveBeenCalledOnce();
      expect(file.url).toBe("https://blob.vercel-storage.com/abc123.png");
    });

    it("throws when the buffer is missing", async () => {
      const p = provider.init({ token: TOKEN });
      const file = createMockFile(); // no buffer

      await expect(p.upload(file)).rejects.toThrowError(/missing its buffer/);
      expect(mockPut).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // uploadStream
  // -------------------------------------------------------------------------
  describe("uploadStream", () => {
    it("uploads a file via its stream", async () => {
      mockPut.mockResolvedValueOnce(createMockPutResult());

      const p = provider.init({ token: TOKEN });
      const file = createMockFile({ stream: createMockStream() as any });

      await p.uploadStream(file);

      expect(mockPut).toHaveBeenCalledOnce();
      expect(file.url).toBe("https://blob.vercel-storage.com/abc123.png");
    });

    it("throws when the stream is missing", async () => {
      const p = provider.init({ token: TOKEN });
      const file = createMockFile(); // no stream

      await expect(p.uploadStream(file)).rejects.toThrowError(/missing its readable stream/);
      expect(mockPut).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe("delete", () => {
    it("deletes the blob by url", async () => {
      mockDel.mockResolvedValueOnce(undefined);

      const p = provider.init({ token: TOKEN });
      const file = createMockFile({ url: "https://blob.vercel-storage.com/abc123.png" });

      await p.delete(file);

      expect(mockDel).toHaveBeenCalledOnce();
      expect(mockDel).toHaveBeenCalledWith("https://blob.vercel-storage.com/abc123.png", {
        token: TOKEN,
      });
    });

    it("skips deletion when the file has no url", async () => {
      const p = provider.init({ token: TOKEN });
      const file = createMockFile({ url: "" });

      await p.delete(file);

      expect(mockDel).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // checkFileSize
  // -------------------------------------------------------------------------
  describe("checkFileSize", () => {
    it("does not throw for a small file", () => {
      const p = provider.init({ token: TOKEN });
      const file = createMockFile({ size: 1024 }); // 1 MB
      expect(() => p.checkFileSize!(file)).not.toThrow();
    });

    it("throws for a file exceeding the default limit", () => {
      const p = provider.init({ token: TOKEN });
      const file = createMockFile({ name: "big.bin", size: 501 * 1024 });
      expect(() => p.checkFileSize!(file)).toThrowError(/big\.bin.*500/);
    });

    it("respects a custom maxUploadSizeMB from config", () => {
      const p = provider.init({ token: TOKEN, maxUploadSizeMB: 10 });
      const file = createMockFile({ name: "over.mp4", size: 11 * 1024 });
      expect(() => p.checkFileSize!(file)).toThrowError(/over\.mp4.*10/);
    });
  });

  // -------------------------------------------------------------------------
  // isPrivate
  // -------------------------------------------------------------------------
  describe("isPrivate", () => {
    it("returns false (Vercel Blob is public-only)", () => {
      const p = provider.init({ token: TOKEN });
      expect(p.isPrivate!()).toBe(false);
    });
  });
});
