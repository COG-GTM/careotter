import { test, expect, go, shot, snack, pickOption, confirmDialog } from './fixtures';

test('incidents summary, filters and closed toggle', async ({ signedIn: page }, info) => {
  await go(page, '/incidents', 'Incident Response');
  const cards = page.locator('mat-card.incident-card');
  await expect(cards).toHaveCount(3);
  await expect(page.getByText('2 Active')).toBeVisible();
  await expect(page.getByText('1 Devin Investigating')).toBeVisible();
  await expect(page.getByText('1 Resolved')).toBeVisible();
  await expect(page.getByText('1 Closed (hidden)')).toBeVisible();
  await expect(cards.filter({ hasText: 'Search autocomplete' })).toContainText('devin-abc123');
  await expect(cards.filter({ hasText: 'Slow document loads' })).toContainText('No Devin session');
  await shot(page, '11-incidents', info.project.name);
  await page.getByText('1 Resolved').click();
  await expect(cards).toHaveCount(1);
  await page.getByText('1 Resolved').click();
  await page.getByText('1 Closed (hidden)').click();
  await expect(cards).toHaveCount(4);
  await expect(page.getByText('1 Closed', { exact: true })).toBeVisible();
});

test('report incident form validation and create', async ({ signedIn: page }, info) => {
  await go(page, '/incidents', 'Incident Response');
  await page.getByRole('button', { name: 'Report Incident' }).click();
  const submit = page.getByRole('button', { name: 'Create Incident & Launch Devin' });
  await expect(submit).toBeDisabled();
  const title = `Parity incident ${Date.now()}`;
  await page.getByLabel('Incident Title').fill(title);
  await expect(submit).toBeDisabled();
  await page.getByLabel('Description').fill('Created by the parity suite.');
  await pickOption(page, 'Severity', 'Critical');
  await shot(page, '11-incidents-form', info.project.name);
  await submit.click();
  await snack(page, /Incident created!/);
  await expect(page.locator('mat-card.incident-card').filter({ hasText: title })).toContainText('investigating');
  await expect(page.getByText('3 Active')).toBeVisible();
});

test('launch Devin, resolve, close and delete incidents', async ({ signedIn: page }) => {
  await go(page, '/incidents', 'Incident Response');
  const cards = page.locator('mat-card.incident-card');
  const slow = cards.filter({ hasText: 'Slow document loads' });
  await slow.getByRole('button', { name: 'Launch Devin' }).click();
  await snack(page, 'Devin session launched!');
  await expect(slow).toContainText('devin-inc-002');
  await slow.getByRole('button', { name: 'Resolve' }).click();
  await confirmDialog(page, 'Resolve Incident', 'Resolve');
  await snack(page, 'Incident resolved');
  await expect(page.getByText('2 Resolved')).toBeVisible();
  await slow.getByRole('button', { name: 'Close' }).click();
  await confirmDialog(page, 'Close Incident', 'Close');
  await snack(page, 'Incident closed');
  await expect(page.getByText('2 Closed (hidden)')).toBeVisible();
  await expect(cards).toHaveCount(2);
  const search = cards.filter({ hasText: 'Search autocomplete' });
  await search.getByRole('button', { name: 'Delete' }).click();
  await confirmDialog(page, 'Delete Incident', 'Delete');
  await snack(page, "Stop Devin session 'devin-abc123' before deleting");
  await expect(cards).toHaveCount(2);
  const upload = cards.filter({ hasText: 'Upload failures in Radiology' });
  await upload.getByRole('button', { name: 'Delete' }).click();
  await confirmDialog(page, 'Delete Incident', 'Delete');
  await snack(page, 'Incident deleted');
  await expect(cards).toHaveCount(1);
  await expect(search).toBeVisible();
});

test('demo controls: auto-investigate and chaos', async ({ signedIn: page }, info) => {
  await go(page, '/incidents', 'Incident Response');
  await expect(page.getByText('Auto-Investigate with Devin')).toBeVisible();
  await page.getByText('Demo Controls').click();
  await expect(page.getByText('Auto-Investigate with Devin')).toBeHidden();
  await page.getByText('Demo Controls').click();
  await expect(page.getByText(/OFF:/)).toBeVisible();
  await page.locator('.auto-investigate-toggle').getByRole('switch').click();
  await snack(page, /Auto-Investigate:/);
  await expect(page.getByText(/ON:/)).toBeVisible();
  const reset = page.getByRole('button', { name: 'Reset All' });
  await expect(reset).toBeDisabled();
  await page.getByRole('button', { name: 'Break Search Autocomplete' }).click();
  await expect(page.getByText('1 active')).toBeVisible();
  await expect(page.getByText('Chaos active — Grafana alert fires in ~30s')).toBeVisible();
  await shot(page, '11-incidents-demo-controls', info.project.name);
  await expect(reset).toBeEnabled();
  await reset.click();
  await expect(page.getByText('1 active')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Break Search Autocomplete' })).toBeEnabled();
});
