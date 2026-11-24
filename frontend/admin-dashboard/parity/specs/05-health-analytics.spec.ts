import { test, expect, go, shot } from './fixtures';

test('system health summary and service cards', async ({ signedIn: page }, info) => {
  await go(page, '/health', 'System Health');
  await expect(page.locator('.summary-card.healthy .summary-count')).toHaveText('8');
  await expect(page.locator('.summary-card.degraded .summary-count')).toHaveText('1');
  await expect(page.locator('.summary-card.down .summary-count')).toHaveText('1');
  await expect(page.locator('mat-card.service-card')).toHaveCount(10);
  const doc = page.locator('mat-card.service-card').filter({ hasText: 'document-service' });
  await expect(doc).toContainText('p95 latency above 500ms');
  await expect(doc).toContainText('840ms');
  await expect(doc).toContainText('DEGRADED');
  await shot(page, '07-health', info.project.name);
  await page.getByRole('button', { name: 'Refresh' }).click();
  await expect(page.locator('mat-card.service-card')).toHaveCount(10);
});

test('analytics charts render', async ({ signedIn: page }, info) => {
  await go(page, '/analytics', 'Analytics');
  for (const t of ['Active Users Over Time', 'Storage Usage (TB)', 'Top File Types', 'User Signups (Monthly)', 'Peak Usage Hours']) {
    await expect(page.getByText(t, { exact: true })).toBeVisible();
  }
  await expect(page.locator('canvas')).toHaveCount(5);
  await shot(page, '08-analytics', info.project.name);
});
