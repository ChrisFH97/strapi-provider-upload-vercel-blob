import type { ReadStream } from "node:fs";

/**
 * Configuration accepted by the Vercel Blob upload provider.
 */
export interface ProviderConfig {
  /** Vercel Blob read-write token. Falls back to BLOB_READ_WRITE_TOKEN env var. */
  token?: string;

  /** Whether Vercel should append a random suffix to the blob path. Default: `true`. */
  addRandomSuffix?: boolean;

  /**
   * Edge and browser cache duration in seconds.
   * @default 31_536_000 (1 year)
   */
  cacheControlMaxAge?: number;

  /**
   * Maximum allowed upload size in megabytes.
   * @default 500
   */
  maxUploadSizeMB?: number;
}

/**
 * Represents a media file as passed around by Strapi's upload plugin.
 */
export interface StrapiFile {
  name: string;
  hash: string;
  ext?: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string;
  path?: string;
  provider?: string;
  provider_metadata?: Record<string, unknown>;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  formats?: Record<string, unknown>;
  buffer?: Buffer;
  stream?: ReadStream;
}

/**
 * The shape Strapi expects from every upload provider.
 */
export interface StrapiUploadProvider {
  upload(file: StrapiFile): Promise<void>;
  uploadStream(file: StrapiFile): Promise<void>;
  delete(file: StrapiFile): Promise<void>;
  checkFileSize?(file: StrapiFile): void;
  getSignedUrl?(file: StrapiFile): Promise<{ url: string }>;
  isPrivate?(): boolean;
}
