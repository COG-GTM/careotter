import { test, expect, shot } from './fixtures';

test('dashboard stats and charts', async ({ signedIn: page }, info) => {
  const card = (label: string) => page.locator('mat-card').filter({ hasText: label });
  await expect(card('Total Users')).toContainText('12');
  await expect(card('Active Documents')).toContainText('0');
  await expect(card('Storage Used')).toContainText('25.3 GB');
  await expect(card('Active Sessions')).toContainText('9');
  await expect(page.getByText('User Signups')).toBeVisible();
  await expect(page.getByText('Document Activity')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(2);
  await shot(page, '02-dashboard', info.project.name);
});

test('sidebar navigation and collapse', async ({ signedIn: page }) => {
  const nav = page.locator('mat-nav-list a');
  for (const [i, label] of ['Dashboard', 'Users', 'Audit Logs', 'Feature Flags', 'System Health', 'Announcements', 'Storage Quotas', 'Incidents', 'Analytics'].entries()) {
    await expect(nav.nth(i)).toContainText(label);
  }
  await expect(nav).toHaveCount(9);
  await nav.filter({ hasText: 'Audit Logs' }).click();
  await expect(page).toHaveURL(/\/audit$/);
  await expect(nav.filter({ hasText: 'Audit Logs' })).toHaveClass(/active-link/);
  await page.locator('.toggle-btn').click();
  await expect(page.locator('.sidebar')).toHaveClass(/collapsed/);
  await expect(page.locator('.logo-text')).toBeHidden();
  await page.locator('.toggle-btn').click();
  await expect(page.locator('.logo-text')).toHaveText('Careotter');
});
