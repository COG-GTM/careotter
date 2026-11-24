import { defineConfig } from '@playwright/test';

// Same specs, two apps. Each app proxies /api to its own mock gateway instance
// (see README.md), and `metadata.api` lets specs reset that instance's state.
export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'report/results.json' }]],
  use: {
    viewport: { width: 1440, height: 900 },
    timezoneId: 'UTC',
    locale: 'en-US',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'baseline',
      use: { baseURL: process.env.BASELINE_URL || 'http://localhost:4000' },
      metadata: { api: process.env.BASELINE_API || 'http://localhost:8091' },
    },
    {
      name: 'upgraded',
      use: { baseURL: process.env.UPGRADED_URL || 'http://localhost:4200' },
      metadata: { api: process.env.UPGRADED_API || 'http://localhost:8092' },
    },
  ],
});
