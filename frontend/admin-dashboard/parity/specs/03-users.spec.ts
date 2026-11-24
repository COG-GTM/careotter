import { test, expect, go, shot, snack, pickOption, confirmDialog } from './fixtures';

const rows = (page: import('@playwright/test').Page) => page.locator('tr.table-row');

test('users list paginates, searches and filters', async ({ signedIn: page }, info) => {
  await go(page, '/users', 'User Management');
  await expect(rows(page)).toHaveCount(5);
  await expect(page.getByText('1 – 5 of 12')).toBeVisible();
  await shot(page, '03-users', info.project.name);
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText('6 – 10 of 12')).toBeVisible();
  await page.getByRole('button', { name: 'Last page' }).click();
  await expect(rows(page)).toHaveCount(2);
  await page.getByLabel('Search users').fill('okafor');
  await page.getByLabel('Search users').press('r');
  await page.getByLabel('Search users').press('Backspace');
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText('Dr. Maya Okafor');
  await page.getByLabel('Search users').fill('');
  await page.getByLabel('Search users').press('Backspace');
  await pickOption(page, 'Status', 'Suspended');
  await expect(rows(page)).toHaveCount(2);
  await pickOption(page, 'Role', 'Editor');
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText('Mia Kowalski');
  await shot(page, '03-users-filtered', info.project.name);
});

test('suspend, restore and delete a user from the list', async ({ signedIn: page }) => {
  await go(page, '/users', 'User Management');
  const row = rows(page).filter({ hasText: 'Liam Chen' });
  await row.getByRole('button', { name: 'User actions' }).click();
  await page.getByRole('menuitem', { name: 'Suspend' }).click();
  await confirmDialog(page, 'Suspend User', 'Suspend');
  await snack(page, 'Liam Chen has been suspended');
  await expect(row).toContainText('suspended');
  await row.getByRole('button', { name: 'User actions' }).click();
  await page.getByRole('menuitem', { name: 'Restore' }).click();
  await snack(page, 'Liam Chen has been restored');
  await expect(row).toContainText('active');
  await row.getByRole('button', { name: 'User actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await confirmDialog(page, 'Delete User', 'Delete');
  await snack(page, 'Liam Chen has been deleted');
  await expect(page.getByText('1 – 5 of 11')).toBeVisible();
});

test('user detail page', async ({ signedIn: page }, info) => {
  await go(page, '/users', 'User Management');
  await rows(page).filter({ hasText: 'Dr. Maya Okafor' }).click();
  await expect(page).toHaveURL(/\/users\/u-001$/);
  await expect(page.getByRole('heading', { name: 'User Details' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dr. Maya Okafor' })).toBeVisible();
  await expect(page.getByText('Cardiology')).toBeVisible();
  await expect(page.getByText('42 documents')).toBeVisible();
  await expect(page.getByText('32% used')).toBeVisible();
  await expect(page.locator('.activity-table tr.mat-mdc-row, .activity-table tr[mat-row]')).toHaveCount(4);
  await shot(page, '04-user-detail', info.project.name);
  await page.getByRole('button', { name: 'Suspend User' }).click();
  await confirmDialog(page, 'Suspend User', 'Suspend');
  await snack(page, 'User suspended');
  await expect(page.getByRole('button', { name: 'Restore User' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore User' }).click();
  await snack(page, 'User restored');
  await page.locator('button').filter({ hasText: 'arrow_back' }).click();
  await expect(page).toHaveURL(/\/users$/);
});

// Pre-existing behaviour: a 404 from the API leaves the page on its spinner.
test('user detail for an unknown user keeps loading', async ({ signedIn: page }) => {
  await page.goto('/users/does-not-exist');
  await expect(page.getByRole('heading', { name: 'User Details' })).toBeVisible();
  await expect(page.getByRole('progressbar')).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(page.getByRole('progressbar')).toBeVisible();
  await expect(page.getByText('Account Information')).toBeHidden();
});
