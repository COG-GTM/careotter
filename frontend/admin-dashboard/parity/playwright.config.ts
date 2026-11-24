import { defineConfig } from '@playwright/test';

const baselineApi = process.env['BASELINE_API'] || 'http://127.0.0.1:8091';
const upgradedApi = process.env['UPGRADED_API'] || 'http://127.0.0.1:8092';
if (new URL(baselineApi).port === new URL(upgradedApi).port) {
  throw new Error('BASELINE_API and UPGRADED_API must use different mock gateway ports');
}

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
      use: { baseURL: process.env['BASELINE_URL'] || 'http://localhost:4000' },
      metadata: { api: baselineApi },
    },
    {
      name: 'upgraded',
      use: { baseURL: process.env['UPGRADED_URL'] || 'http://localhost:4200' },
      metadata: { api: upgradedApi },
    },
  ],
});
