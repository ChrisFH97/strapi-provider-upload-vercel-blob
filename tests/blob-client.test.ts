import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockFile, createMockPutResult } from "./helpers.js";

// ---------------------------------------------------------------------------
// Mock the @vercel/blob SDK before importing the module under test
// ---------------------------------------------------------------------------
const { mockPut, mockDel } = vi.hoisted(() => ({
  mockPut: vi.fn(),
  mockDel: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  put: mockPut,
  del: mockDel,
}));

import { BlobStorageClient } from "../src/blob-client.js";

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------
describe("BlobStorageClient – constructor", () => {
  it("accepts a token from config", () => {
    expect(() => new BlobStorageClient({ token: "tok_123" })).not.toThrow();
  });

  it("falls back to BLOB_READ_WRITE_TOKEN env var", () => {
    process.env.BLOB_READ_WRITE_TOKEN = "env_token";
    expect(() => new BlobStorageClient({})).not.toThrow();
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it("throws when no token is available", () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    expect(() => new BlobStorageClient({})).toThrowError(/No token provided/);
  });
});

// ---------------------------------------------------------------------------
// upload
// ---------------------------------------------------------------------------
describe("BlobStorageClient – upload", () => {
  const TOKEN = "test_token";
  let client: BlobStorageClient;

  beforeEach(() => {
    client = new BlobStorageClient({ token: TOKEN });
    mockPut.mockReset();
    mockDel.mockReset();
  });

  it("calls put with the correct pathname, body, and options", async () => {
    const blobResult = createMockPutResult();
    mockPut.mockResolvedValueOnce(blobResult);

    const file = createMockFile();
    const body = Buffer.from("data");

    await client.upload(file, body);

    expect(mockPut).toHaveBeenCalledOnce();
    expect(mockPut).toHaveBeenCalledWith("abc123.png", body, {
      access: "public",
      contentType: "image/png",
      token: TOKEN,
      addRandomSuffix: true,
      cacheControlMaxAge: 31_536_000,
    });
  });

  it("mutates the file with the blob result", async () => {
    const blobResult = createMockPutResult({
      url: "https://blob.vercel-storage.com/resolved.png",
      pathname: "resolved.png",
      contentType: "image/webp",
    });
    mockPut.mockResolvedValueOnce(blobResult);

    const file = createMockFile();
    await client.upload(file, Buffer.from("x"));

    expect(file.url).toBe("https://blob.vercel-storage.com/resolved.png");
    expect(file.previewUrl).toBe("https://blob.vercel-storage.com/resolved.png");
    expect(file.mime).toBe("image/webp");
    expect(file.path).toBe("resolved.png");
  });

  it("builds pathname without ext when ext is undefined", async () => {
    mockPut.mockResolvedValueOnce(createMockPutResult());

    const file = createMockFile({ ext: undefined });
    await client.upload(file, Buffer.from("x"));

    expect(mockPut.mock.calls[0][0]).toBe("abc123");
  });

  it("respects addRandomSuffix = false", async () => {
    const c = new BlobStorageClient({ token: TOKEN, addRandomSuffix: false });
    mockPut.mockResolvedValueOnce(createMockPutResult());

    await c.upload(createMockFile(), Buffer.from("x"));

    expect(mockPut.mock.calls[0][2]).toMatchObject({ addRandomSuffix: false });
  });

  it("respects a custom cacheControlMaxAge", async () => {
    const c = new BlobStorageClient({ token: TOKEN, cacheControlMaxAge: 600 });
    mockPut.mockResolvedValueOnce(createMockPutResult());

    await c.upload(createMockFile(), Buffer.from("x"));

    expect(mockPut.mock.calls[0][2]).toMatchObject({ cacheControlMaxAge: 600 });
  });

  it("propagates SDK errors", async () => {
    mockPut.mockRejectedValueOnce(new Error("network failure"));

    await expect(client.upload(createMockFile(), Buffer.from("x"))).rejects.toThrowError(
      "network failure",
    );
  });
});

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------
describe("BlobStorageClient – remove", () => {
  const TOKEN = "test_token";
  let client: BlobStorageClient;

  beforeEach(() => {
    client = new BlobStorageClient({ token: TOKEN });
    mockDel.mockReset();
  });

  it("calls del with the url and token", async () => {
    mockDel.mockResolvedValueOnce(undefined);
    const url = "https://blob.vercel-storage.com/abc123.png";

    await client.remove(url);

    expect(mockDel).toHaveBeenCalledOnce();
    expect(mockDel).toHaveBeenCalledWith(url, { token: TOKEN });
  });

  it("propagates SDK errors", async () => {
    mockDel.mockRejectedValueOnce(new Error("not found"));

    await expect(client.remove("https://example.com/x")).rejects.toThrowError("not found");
  });
});
