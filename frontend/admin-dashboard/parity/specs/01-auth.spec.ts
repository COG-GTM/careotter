import { test, expect, signIn, shot, runPassword } from './fixtures';

test('login page renders and validates empty credentials', async ({ page }, info) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Careotter Admin' })).toBeVisible();
  await expect(page.getByText('Sign in to the admin dashboard')).toBeVisible();
  await shot(page, '01-login', info.project.name);
  await page.getByLabel('Email').fill('someone@careotter.io');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Please enter both email and password.')).toBeVisible();
  await shot(page, '01-login-error', info.project.name);
  await page.getByLabel('Password', { exact: true }).fill('x');
  await expect(page.getByText('Please enter both email and password.')).toBeHidden();
});

test('password visibility toggle', async ({ page }) => {
  await page.goto('/login');
  const pw = page.getByLabel('Password', { exact: true });
  await pw.fill(runPassword());
  await expect(pw).toHaveAttribute('type', 'password');
  await page.locator('button').filter({ hasText: 'visibility_off' }).click();
  await expect(pw).toHaveAttribute('type', 'text');
});

test('sign in, see shell, sign out', async ({ page }) => {
  await signIn(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Admin Dashboard')).toBeVisible();
  await expect(page.getByText('Admin User')).toBeVisible();
  await page.getByRole('button', { name: 'User menu' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/users');
  await expect(page).toHaveURL(/\/login$/);
});

test('API calls carry the bearer token and a 401 signs the user out', async ({ signedIn: page }) => {
  const usersRequest = page.waitForRequest(r => r.url().includes('/api/v1/admin/users'));
  await page.getByRole('link', { name: 'Users' }).click();
  expect((await usersRequest).headers()['authorization']).toMatch(/^Bearer \S+$/);
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.route('**/api/v1/admin/users**', route => route.fulfill({ status: 401, json: { error: 'expired' } }));
  await page.getByRole('link', { name: 'Users' }).click();
  await expect(page).toHaveURL(/\/login$/);
});
