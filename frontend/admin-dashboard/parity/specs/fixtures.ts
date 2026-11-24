import { test as base, expect, Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SHOTS = fileURLToPath(new URL('../report/screenshots', import.meta.url));

export const test = base.extend<{ signedIn: Page }>({
  page: async ({ page, request }, use, testInfo) => {
    await request.post(`${testInfo.project.metadata['api']}/__reset`);
    await use(page);
  },
  signedIn: async ({ page }, use) => {
    await signIn(page);
    await use(page);
  },
});

export { expect };

export function runPassword(): string {
  return `pw-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function signIn(page: Page, email = `admin+${Date.now()}@careotter.io`): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(runPassword());
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

export async function go(page: Page, path: string, heading: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
}

export async function shot(page: Page, name: string, project: string): Promise<void> {
  const dir = join(SHOTS, project);
  mkdirSync(dir, { recursive: true });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(dir, `${name}.png`), fullPage: true, animations: 'disabled' });
}

export async function snack(page: Page, text: string | RegExp): Promise<void> {
  await expect(page.locator('mat-snack-bar-container, .mat-mdc-snack-bar-container').filter({ hasText: text })).toBeVisible();
}

export async function pickOption(page: Page, label: string, option: string): Promise<void> {
  await page.getByRole('combobox', { name: label }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

export async function confirmDialog(page: Page, title: string, confirm: string): Promise<void> {
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: title })).toBeVisible();
  await dialog.getByRole('button', { name: confirm }).click();
  await expect(dialog).toBeHidden();
}
