import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    trace: 'on-first-retry',
    colorScheme: 'light',
    reducedMotion: 'reduce'
  },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://127.0.0.1:4173/templates/index.template.html',
    reuseExistingServer: true,
    timeout: 30_000
  }
});
