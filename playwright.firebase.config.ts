import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: "account.spec.ts",
  use: { ...base.use, baseURL: "http://127.0.0.1:5175" },
  webServer: {
    command: "npm run dev:emulator",
    url: "http://127.0.0.1:5175",
    reuseExistingServer: true,
  },
  timeout: 60000,
});
