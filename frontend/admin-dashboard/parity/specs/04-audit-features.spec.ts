import { test, expect, go, shot, snack, pickOption } from './fixtures';

test('audit logs list, search and filters', async ({ signedIn: page }, info) => {
  await go(page, '/audit', 'Audit Logs');
  const rows = page.locator('table.audit-table tbody tr');
  await expect(rows).toHaveCount(10);
  await expect(page.getByText('1 – 10 of 14')).toBeVisible();
  await shot(page, '05-audit', info.project.name);
  await pickOption(page, 'Severity', 'Warning');
  await expect(rows).toHaveCount(4);
  await pickOption(page, 'Action', 'Suspend');
  await expect(rows).toHaveCount(2);
  await pickOption(page, 'Action', 'All Actions');
  await pickOption(page, 'Severity', 'All Severities');
  await page.getByLabel('Search audit events').pressSequentially('xray');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('isabella.garcia@careotter.io');
});

test('feature flags search and toggle', async ({ signedIn: page }, info) => {
  await go(page, '/features', 'Feature Flags');
  const cards = page.locator('mat-card.flag-card');
  await expect(cards).toHaveCount(5);
  await expect(cards.first()).toContainText('patient-portal');
  await expect(cards.first()).toContainText('Updated 11/12/26 by Ethan Müller');
  await shot(page, '06-features', info.project.name);
  await page.getByLabel('Search features').fill('video');
  await expect(cards).toHaveCount(1);
  await cards.first().getByRole('switch').click();
  await snack(page, 'Telehealth Video enabled');
  await page.getByLabel('Search features').fill('zzz');
  await expect(page.getByText('No feature flags match your search')).toBeVisible();
});
