import { BlobStorageClient } from "./blob-client.js";
import { assertFileSize, extractBody } from "./validation.js";
import type { ProviderConfig, StrapiFile, StrapiUploadProvider } from "./types.js";

export type { ProviderConfig, StrapiFile, StrapiUploadProvider };

/**
 * Initialises the Vercel Blob upload provider for Strapi.
 *
 * @example
 * ```ts
 * // config/plugins.ts
 * export default ({ env }) => ({
 *   upload: {
 *     config: {
 *       provider: "strapi-provider-upload-vercel-blob",
 *       providerOptions: {
 *         token: env("VERCEL_BLOB_TOKEN"),
 *       },
 *     },
 *   },
 * });
 * ```
 */
function createProvider(config: ProviderConfig): StrapiUploadProvider {
  const client = new BlobStorageClient(config);
  const maxSize = config.maxUploadSizeMB;

  return {
    async upload(file: StrapiFile): Promise<void> {
      const body = extractBody(file, "buffer");
      await client.upload(file, body);
    },

    async uploadStream(file: StrapiFile): Promise<void> {
      const body = extractBody(file, "stream");
      await client.upload(file, body);
    },

    async delete(file: StrapiFile): Promise<void> {
      if (!file.url) return;
      await client.remove(file.url);
    },

    checkFileSize(file: StrapiFile): void {
      assertFileSize(file, maxSize);
    },

    isPrivate(): boolean {
      // Vercel Blob only supports public access at this time.
      return false;
    },
  };
}

export default {
  init: createProvider,
};
