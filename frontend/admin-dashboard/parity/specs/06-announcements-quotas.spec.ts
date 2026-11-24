import { test, expect, go, shot, snack, pickOption, confirmDialog } from './fixtures';

test('announcements create, publish and delete', async ({ signedIn: page }, info) => {
  await go(page, '/announcements', 'Announcements');
  const cards = page.locator('mat-card.announcement-card');
  await expect(cards).toHaveCount(3);
  await shot(page, '09-announcements', info.project.name);
  await page.getByRole('button', { name: 'New Announcement' }).click();
  const create = page.getByRole('button', { name: 'Create', exact: true });
  await expect(create).toBeDisabled();
  const title = `Parity notice ${Date.now()}`;
  await page.getByLabel('Title').fill(title);
  await expect(create).toBeDisabled();
  await page.getByLabel('Content').fill('Created by the parity suite.');
  await pickOption(page, 'Priority', 'High');
  await pickOption(page, 'Target Audience', 'Editors');
  await shot(page, '09-announcements-form', info.project.name);
  await expect(create).toBeEnabled();
  await create.click();
  await snack(page, 'Announcement created');
  const card = cards.filter({ hasText: title });
  await expect(card).toContainText('draft');
  await expect(card).toContainText('editors');
  await card.getByRole('button', { name: 'Publish' }).click();
  await snack(page, 'Announcement published');
  await expect(card).toContainText('published');
  await card.getByRole('button', { name: 'Delete' }).click();
  await confirmDialog(page, 'Delete Announcement', 'Delete');
  await snack(page, 'Announcement deleted');
  await expect(cards).toHaveCount(3);
});

test('storage quotas list and update', async ({ signedIn: page }, info) => {
  await go(page, '/quotas', 'Storage Quotas');
  const rows = page.locator('table.quotas-table tbody tr');
  await expect(rows).toHaveCount(5);
  await expect(rows.first()).toContainText('3.2 GB');
  await expect(rows.first()).toContainText('10 GB');
  await expect(rows.first()).toContainText('32%');
  await shot(page, '10-quotas', info.project.name);
  await page.getByLabel('Search users').pressSequentially('noah');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('94%');
  await rows.first().getByRole('combobox').click();
  await page.getByRole('option', { name: '10 GB', exact: true }).click();
  await snack(page, 'Quota updated for Noah Patel');
  // Pre-existing behaviour: the usage % is not recomputed until reload.
  await expect(rows.first()).toContainText('94%');
  await page.reload();
  await page.getByLabel('Search users').pressSequentially('noah');
  await expect(rows.first()).toContainText('47%');
});
