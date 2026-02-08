import type { Readable } from "node:stream";
import type { StrapiFile } from "./types";

/** Default upper limit for uploads – Vercel Blob caps at 500 MB. */
const DEFAULT_MAX_UPLOAD_MB = 500;

/**
 * Converts kilobytes (Strapi's unit for `file.size`) to megabytes.
 */
function kbToMb(kb: number): number {
  return kb / 1024;
}

/**
 * Throws if the file exceeds the configured upload-size ceiling.
 *
 * @param file     - The Strapi file whose `.size` is in **kilobytes**.
 * @param limitMB  - Maximum allowed size in megabytes.
 */
export function assertFileSize(file: StrapiFile, limitMB = DEFAULT_MAX_UPLOAD_MB): void {
  const fileMB = kbToMb(file.size);

  if (fileMB > limitMB) {
    throw new Error(
      `File "${file.name}" is ${fileMB.toFixed(2)} MB which exceeds the ${limitMB} MB upload limit.`,
    );
  }
}

/**
 * Returns the upload body from a Strapi file, preferring the buffer.
 * Throws a descriptive error when neither is available.
 */
export function extractBody(file: StrapiFile, mode: "buffer" | "stream"): Buffer | Readable {
  if (mode === "buffer") {
    if (!file.buffer) {
      throw new Error(`File "${file.name}" is missing its buffer.`);
    }
    return file.buffer;
  }

  if (!file.stream) {
    throw new Error(`File "${file.name}" is missing its readable stream.`);
  }
  return file.stream;
}
