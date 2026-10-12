import { expect, test, type Page } from '@playwright/test';
import { archiveTitles, currentPath, expectPath, gotoAndSettle, isMobile, menuButton } from './helpers';

/** Journeys B (browse by topic) and I (mobile navigation). */

const CATEGORY = 'تأملات';
const CATEGORY_PATH = `/category/${CATEGORY}/`;
const GROUP = 'الحياة المسيحية';

async function openCategoryFromMenu(page: Page, name: string, group: string) {
  if (isMobile(page)) {
    await menuButton(page).click();
    const drawer = page.getByRole('dialog', { name: 'القائمة' });
    await expect(drawer).toBeVisible();
    const toggle = drawer.getByRole('button', { name: group });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await drawer.getByRole('link', { name, exact: true }).click();
  } else {
    const trigger = page.getByRole('navigation', { name: 'التنقّل الرئيسي' }).getByRole('button', { name: 'كل الأقسام' });
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const mega = page.locator('#site-mega-menu');
    await expect(mega).toBeVisible();
    await mega.getByRole('link', { name, exact: true }).click();
  }
}

test.describe('B — browse by topic', () => {
  test('menu → تأملات → sort by oldest → pagination → open an article', async ({ page }) => {
    await gotoAndSettle(page, '/');
    await openCategoryFromMenu(page, CATEGORY, GROUP);
    await expectPath(page, CATEGORY_PATH);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(CATEGORY);
    // The menu closed after choosing.
    if (isMobile(page)) await expect(page.getByRole('dialog', { name: 'القائمة' })).toHaveCount(0);
    else await expect(page.locator('#site-mega-menu')).toBeHidden();

    const newest = await archiveTitles(page);
    expect(newest.length).toBeGreaterThanOrEqual(2);

    const sort = page.getByRole('navigation', { name: 'ترتيب المقالات' });
    await expect(sort.getByRole('link', { name: 'الأحدث' })).toHaveAttribute('aria-current', 'page');
    await sort.getByRole('link', { name: 'الأقدم' }).click();
    await expect(sort.getByRole('link', { name: 'الأقدم' })).toHaveAttribute('aria-current', 'page');
    await expect.poll(() => new URL(page.url()).searchParams.get('sort')).toBe('oldest');
    await expect.poll(() => archiveTitles(page)).not.toEqual(newest);
    const oldest = await archiveTitles(page);
    expect(oldest[0]).not.toBe(newest[0]);
    expect([...oldest].sort()).toEqual([...newest].sort());

    const pagination = page.getByRole('navigation', { name: 'التنقّل بين الصفحات' });
    const count = Number((await page.locator('main strong').filter({ hasText: /مقال/ }).first().innerText()).match(/\d+/)?.[0] ?? newest.length);
    if (count > 12) {
      await pagination.getByRole('link', { name: 'التالية' }).click();
      await expect.poll(() => new URL(page.url()).searchParams.get('page')).toBe('2');
      expect(new URL(page.url()).searchParams.get('sort')).toBe('oldest');
    } else {
      // A single page of results has no pagination.
      await expect(pagination).toHaveCount(0);
      expect(oldest.length).toBe(count);
    }

    const target = (await archiveTitles(page))[0];
    await page.locator('main section ul > li article h2').getByRole('link', { name: target, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(target);
    await expect(page.locator('main article').first().getByRole('link', { name: CATEGORY, exact: true }).first()).toBeVisible();
  });

  test('all-articles archive paginates and keeps the sort across pages', async ({ page }) => {
    await gotoAndSettle(page, '/articles/?sort=oldest');
    const first = await archiveTitles(page);
    expect(first).toHaveLength(12);
    const pagination = page.getByRole('navigation', { name: 'التنقّل بين الصفحات' });
    await pagination.getByRole('link', { name: 'التالية' }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get('page')).toBe('2');
    expect(new URL(page.url()).searchParams.get('sort')).toBe('oldest');
    const second = await archiveTitles(page);
    expect(second.length).toBeGreaterThan(0);
    for (const title of second) expect(first).not.toContain(title);
    await expect(pagination.getByRole('link', { name: 'السابقة' })).toBeVisible();
  });
});

test.describe('I — mobile navigation', () => {
  test.skip(({ isMobile: mobile }) => !mobile, 'phone-only drawer');

  test('drawer: expand group → choose category → closes → reopens; Escape closes and restores focus', async ({ page }) => {
    await gotoAndSettle(page, '/');
    const hamburger = menuButton(page);
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await openCategoryFromMenu(page, CATEGORY, GROUP);
    await expectPath(page, CATEGORY_PATH);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(CATEGORY);
    await expect(page.getByRole('dialog', { name: 'القائمة' })).toHaveCount(0);
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    // Reopen.
    await hamburger.click();
    const drawer = page.getByRole('dialog', { name: 'القائمة' });
    await expect(drawer).toBeVisible();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    // The current category is marked inside the drawer.
    const groupToggle = drawer.getByRole('button', { name: GROUP });
    if ((await groupToggle.getAttribute('aria-expanded')) !== 'true') await groupToggle.click();
    await expect(drawer.getByRole('link', { name: CATEGORY, exact: true })).toHaveAttribute('aria-current', 'page');
    // Focus moved into the dialog.
    await expect.poll(() => drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    // Escape closes and focus returns to the hamburger.
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(hamburger).toBeFocused();

    // The close button also works.
    await hamburger.click();
    await page.getByRole('dialog', { name: 'القائمة' }).getByRole('button', { name: 'إغلاق القائمة' }).click();
    await expect(page.getByRole('dialog', { name: 'القائمة' })).toHaveCount(0);
    await expect(hamburger).toBeFocused();
    expect(currentPath(page)).toBe(CATEGORY_PATH);
  });

  test('drawer traps focus while open', async ({ page }) => {
    await gotoAndSettle(page, '/');
    await menuButton(page).click();
    const drawer = page.getByRole('dialog', { name: 'القائمة' });
    await expect(drawer).toBeVisible();
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      expect(await drawer.evaluate((el) => el.contains(document.activeElement)), `focus left the drawer after ${i + 1} Tab presses`).toBe(true);
    }
  });
});

test.describe('desktop mega menu', () => {
  test.skip(({ isMobile: mobile }) => mobile, 'desktop-only mega menu');

  test('Escape closes the mega menu and focus returns to its trigger', async ({ page }) => {
    await gotoAndSettle(page, '/');
    const trigger = page.getByRole('navigation', { name: 'التنقّل الرئيسي' }).getByRole('button', { name: 'كل الأقسام' });
    await trigger.click();
    await expect(page.locator('#site-mega-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#site-mega-menu')).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });
});
