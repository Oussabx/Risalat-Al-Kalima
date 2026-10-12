import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests run against a production build backed by the labelled preview
 * fixtures (CONTENT_SOURCE=fixtures), so they never depend on the live WordPress.
 * Set PW_CHROMIUM_PATH to use a system Chromium instead of the bundled browser.
 */

const PORT = 3210;
const baseURL = `http://127.0.0.1:${PORT}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    locale: 'ar',
    trace: 'on-first-retry',
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
  },
  projects: [
    {
      name: 'desktop',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
    {
      // Pixel 7-like, on Chromium.
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
      },
    },
  ],
  webServer: {
    command: `npm run build:preview && npx next start -p ${PORT} -H 127.0.0.1`,
    url: baseURL,
    env: { CONTENT_SOURCE: 'fixtures' },
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
