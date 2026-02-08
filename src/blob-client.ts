import { put, del } from "@vercel/blob";
import type { Readable } from "node:stream";
import type { ProviderConfig, StrapiFile } from "./types";

/** Default edge / browser cache lifetime – 1 year in seconds. */
const DEFAULT_CACHE_MAX_AGE = 31_536_000;

/**
 * Thin wrapper around the Vercel Blob SDK scoped to a single provider config.
 *
 * Keeps every SDK call in one place so the provider itself stays declarative.
 */
export class BlobStorageClient {
  readonly #token: string;
  readonly #addRandomSuffix: boolean;
  readonly #cacheControlMaxAge: number;

  constructor(config: ProviderConfig) {
    const token = config.token ?? process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error(
        "[strapi-provider-upload-vercel-blob] No token provided. " +
          "Pass `token` in providerOptions or set the BLOB_READ_WRITE_TOKEN environment variable.",
      );
    }

    this.#token = token;
    this.#addRandomSuffix = config.addRandomSuffix ?? true;
    this.#cacheControlMaxAge = config.cacheControlMaxAge ?? DEFAULT_CACHE_MAX_AGE;
  }

  /**
   * Uploads the given body (Buffer or ReadStream) to Vercel Blob and mutates
   * the Strapi file record with the resulting URL / path / content-type.
   */
  async upload(file: StrapiFile, body: Buffer | Readable): Promise<void> {
    const pathname = `${file.hash}${file.ext ?? ""}`;

    const blob = await put(pathname, body, {
      access: "public",
      contentType: file.mime,
      token: this.#token,
      addRandomSuffix: this.#addRandomSuffix,
      cacheControlMaxAge: this.#cacheControlMaxAge,
    });

    file.url = blob.url;
    file.previewUrl = blob.url;
    file.mime = blob.contentType;
    file.path = blob.pathname;
  }

  /**
   * Removes a blob identified by its public URL.
   */
  async remove(url: string): Promise<void> {
    await del(url, { token: this.#token });
  }
}
