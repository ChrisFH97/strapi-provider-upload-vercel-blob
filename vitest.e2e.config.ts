import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

// Load .env.test so BLOB_READ_WRITE_TOKEN is available
dotenv.config({ path: ".env.test" });

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/e2e/**/*.test.ts"],
    testTimeout: 30_000, // network calls can be slow
  },
});
