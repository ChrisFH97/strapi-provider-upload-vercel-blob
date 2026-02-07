import { describe, it, expect } from "vitest";
import { assertFileSize, extractBody } from "../src/validation.js";
import { createMockFile, createMockStream } from "./helpers.js";

// ---------------------------------------------------------------------------
// assertFileSize
// ---------------------------------------------------------------------------
describe("assertFileSize", () => {
  it("does not throw when the file is under the default limit", () => {
    const file = createMockFile({ size: 1024 }); // 1 MB
    expect(() => assertFileSize(file)).not.toThrow();
  });

  it("does not throw when the file is exactly at the limit", () => {
    const file = createMockFile({ size: 500 * 1024 }); // 500 MB in KB
    expect(() => assertFileSize(file)).not.toThrow();
  });

  it("throws when the file exceeds the default 500 MB limit", () => {
    const file = createMockFile({ name: "huge.zip", size: 501 * 1024 });
    expect(() => assertFileSize(file)).toThrowError(/huge\.zip.*501.*500/);
  });

  it("respects a custom limit", () => {
    const file = createMockFile({ name: "medium.mp4", size: 11 * 1024 }); // 11 MB
    expect(() => assertFileSize(file, 10)).toThrowError(/medium\.mp4.*10/);
  });

  it("allows a file under a custom limit", () => {
    const file = createMockFile({ size: 5 * 1024 }); // 5 MB
    expect(() => assertFileSize(file, 10)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// extractBody – buffer mode
// ---------------------------------------------------------------------------
describe("extractBody (buffer mode)", () => {
  it("returns the buffer when present", () => {
    const buf = Buffer.from("hello");
    const file = createMockFile({ buffer: buf });
    expect(extractBody(file, "buffer")).toBe(buf);
  });

  it("throws when the buffer is missing", () => {
    const file = createMockFile({ name: "no-buf.png" });
    expect(() => extractBody(file, "buffer")).toThrowError(
      /no-buf\.png.*missing its buffer/,
    );
  });
});

// ---------------------------------------------------------------------------
// extractBody – stream mode
// ---------------------------------------------------------------------------
describe("extractBody (stream mode)", () => {
  it("returns the stream when present", () => {
    const stream = createMockStream();
    // ReadStream extends Readable, cast is safe in test context
    const file = createMockFile({ stream: stream as any });
    expect(extractBody(file, "stream")).toBe(stream);
  });

  it("throws when the stream is missing", () => {
    const file = createMockFile({ name: "no-stream.jpg" });
    expect(() => extractBody(file, "stream")).toThrowError(
      /no-stream\.jpg.*missing its readable stream/,
    );
  });
});
