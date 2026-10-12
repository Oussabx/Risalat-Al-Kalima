import { expect, test } from '@playwright/test';
import { REFERENCE, REFERENCE_PATH, currentPath, expectPath, gotoAndSettle, searchButton } from './helpers';

/** Journey C (search). */

const LEADERSHIP = 'الإدارة بالخوف أم بالثّقة؟ سرّ القائد الحكيم';

test.describe('C — search', () => {
  test('overlay live results → Enter → results page → open → back keeps results', async ({ page }) => {
    await gotoAndSettle(page, '/');
    const trigger = searchButton(page);
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole('searchbox').or(dialog.getByRole('textbox')).first();
    await expect(input).toBeFocused();

    await input.fill('فرح');
    const live = dialog.getByRole('list', { name: 'نتائج البحث' });
    await expect(live).toBeVisible();
    await expect(live.getByRole('link').filter({ hasText: REFERENCE.title })).toBeVisible();

    await input.press('Enter');
    await expect.poll(() => currentPath(page)).toBe('/search/');
    expect(new URL(page.url()).searchParams.get('q')).toBe('فرح');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const results = page.locator('main').getByRole('heading', { level: 3 }).getByRole('link');
    await expect(results.filter({ hasText: REFERENCE.title })).toBeVisible();
    await expect(page.locator('main').getByRole('heading', { level: 2 }).first()).toContainText('فرح');

    await results.filter({ hasText: REFERENCE.title }).click();
    await expectPath(page, REFERENCE_PATH);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(REFERENCE.title);

    await page.goBack();
    await expect.poll(() => currentPath(page)).toBe('/search/');
    expect(new URL(page.url()).searchParams.get('q')).toBe('فرح');
    await expect(page.locator('main').getByRole('heading', { level: 3 }).getByRole('link').filter({ hasText: REFERENCE.title })).toBeVisible();
    await expect(page.locator('main').getByRole('searchbox')).toHaveValue('فرح');
  });

  test('Escape closes the overlay and returns focus to the search icon', async ({ page }) => {
    await gotoAndSettle(page, '/');
    const trigger = searchButton(page);
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('hamza / taa-marbuta / diacritic variants still match («الاداره» → «الإدارة…»)', async ({ page }) => {
    await gotoAndSettle(page, `/search/?q=${encodeURIComponent('الاداره')}`);
    await expect(page.locator('main').getByRole('link', { name: LEADERSHIP, exact: true })).toBeVisible();

    // And in the live overlay.
    await searchButton(page).click();
    const dialog = page.getByRole('dialog');
    const input = dialog.getByRole('searchbox').or(dialog.getByRole('textbox')).first();
    await input.fill('الاداره بالخوف');
    await expect(dialog.getByRole('list', { name: 'نتائج البحث' }).getByRole('link').filter({ hasText: 'الإدارة بالخوف' })).toBeVisible();
  });

  test('a nonsense query shows the empty state', async ({ page }) => {
    const q = 'زخقثصضغظ';
    await gotoAndSettle(page, `/search/?q=${encodeURIComponent(q)}`);
    await expect(page.locator('main').getByRole('heading', { name: /لا توجد نتائج/ })).toBeVisible();
    await expect(page.locator('main').getByRole('heading', { level: 3 }).getByRole('link')).toHaveCount(0);

    // The overlay shows an empty state as well (no stale results).
    await searchButton(page).click();
    const dialog = page.getByRole('dialog');
    const input = dialog.getByRole('searchbox').or(dialog.getByRole('textbox')).first();
    await input.fill(q);
    await expect(dialog.getByText(/^لا (توجد )?نتائج/).first()).toBeVisible();
    await expect(dialog.getByRole('list', { name: 'نتائج البحث' })).toHaveCount(0);
  });

  test('search API returns JSON for live results', async ({ request }) => {
    const res = await request.get(`/api/search/?q=${encodeURIComponent('فرح')}&limit=5`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');
    expect(JSON.stringify(await res.json())).toContain(REFERENCE.title);
  });
});
