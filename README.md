# strapi-provider-upload-vercel-blob

Upload media from [Strapi](https://strapi.io/) directly to [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) storage.

---

## Why this package?

Vercel Blob gives you edge-cached, globally distributed file storage with a simple SDK. This provider plugs it into Strapi's upload system so every image, video, or document you add through the Media Library ends up in your blob store automatically.

---

## Quick start

```bash
npm install strapi-provider-upload-vercel-blob
```

Add your Vercel Blob token to `.env`:

```
VERCEL_BLOB_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

Create (or update) `config/plugins.ts`:

```ts
export default ({ env }) => ({
  upload: {
    config: {
      provider: "strapi-provider-upload-vercel-blob",
      providerOptions: {
        token: env("VERCEL_BLOB_TOKEN"),
      },
    },
  },
});
```

That's it — uploads now go to Vercel Blob.

---

## Options

All fields are optional. Sensible defaults are applied when omitted.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `token` | `string` | `BLOB_READ_WRITE_TOKEN` env var | Vercel Blob read-write token. |
| `addRandomSuffix` | `boolean` | `true` | Append a random suffix to blob paths to avoid collisions. |
| `cacheControlMaxAge` | `number` | `31536000` (1 year) | Edge and browser cache lifetime in seconds. |
| `maxUploadSizeMB` | `number` | `500` | Reject files larger than this (in MB). |

Full example with every option:

```ts
export default ({ env }) => ({
  upload: {
    config: {
      provider: "strapi-provider-upload-vercel-blob",
      providerOptions: {
        token: env("VERCEL_BLOB_TOKEN"),
        addRandomSuffix: false,
        cacheControlMaxAge: 60 * 60 * 24 * 30, // 30 days
        maxUploadSizeMB: 100,
      },
    },
  },
});
```

---

## Strapi security middleware

Strapi's default CSP blocks images from external origins. You need to allow your blob store's domain so thumbnails show up in the Media Library.

In `config/middlewares.ts`, replace the `"strapi::security"` string with:

```ts
export default [
  // …keep your other middlewares
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "https://<STORE_ID>.public.blob.vercel-storage.com",
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            "https://<STORE_ID>.public.blob.vercel-storage.com",
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
];
```

Replace `<STORE_ID>` with the subdomain shown in your [Vercel Blob dashboard](https://vercel.com/dashboard/stores).

---

## Development

### Prerequisites

- Node.js ≥ 18
- npm

### Setup

```bash
git clone <repo-url>
cd strapi-provider-upload-vercel-blob
npm install
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run dev` | Compile in watch mode |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Run unit tests (mocked, no network) |
| `npm run test:coverage` | Unit tests with V8 coverage report |
| `npm run test:e2e` | Run end-to-end tests against a real Vercel Blob store |

### Running e2e tests

The e2e suite uploads and deletes real blobs. You need a token:

1. Copy `.env.test` and fill in your token:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
   ```
2. Run:
   ```bash
   npm run test:e2e
   ```

### Project structure

```
src/
  types.ts         — ProviderConfig, StrapiFile, and StrapiUploadProvider interfaces
  blob-client.ts   — BlobStorageClient class wrapping the Vercel Blob SDK
  validation.ts    — File-size assertion and body extraction helpers
  index.ts         — Provider entry point (init → StrapiUploadProvider)
tests/
  helpers.ts       — Shared mock factories for tests
  validation.test.ts
  blob-client.test.ts
  index.test.ts
  e2e/
    upload.test.ts — Real upload / download / delete against Vercel Blob
```

---

## License

[MIT](./LICENSE)
