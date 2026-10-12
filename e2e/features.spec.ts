import { expect, test } from '@playwright/test';
import { REFERENCE, REFERENCE_PATH, expectNoHorizontalOverflow, gotoAndSettle, isMobile } from './helpers';

/** Bookmarks, copy-link, reading progress, 404, layout overflow and the machine-readable endpoints. */

test.describe('bookmarks', () => {
  test('save on the article → listed on /saved/ after reload → remove', async ({ page }) => {
    await gotoAndSettle(page, REFERENCE_PATH);
    const save = page.getByRole('button', { name: 'حفظ المقال' }).filter({ visible: true }).first();
    await expect(save).toHaveAttribute('aria-pressed', 'false');
    await save.click();
    const saved = page.getByRole('button', { name: 'إزالة من المحفوظات' }).filter({ visible: true }).first();
    await expect(saved).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status').filter({ hasText: 'تمّ حفظ المقال' }).first()).toBeAttached();

    // Survives a reload of the article.
    await page.reload();
    await expect(page.getByRole('button', { name: 'إزالة من المحفوظات' }).filter({ visible: true }).first()).toHaveAttribute('aria-pressed', 'true');

    await gotoAndSettle(page, '/saved/');
    await page.reload();
    const region = page.getByRole('region', { name: 'المقالات المحفوظة' });
    await expect(region.getByRole('link', { name: REFERENCE.title }).first()).toBeVisible();

    await region.getByRole('button', { name: `إزالة «${REFERENCE.title}» من المحفوظات` }).click();
    await expect(page.getByRole('heading', { name: 'لا توجد مقالات محفوظة بعد' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'لا توجد مقالات محفوظة بعد' })).toBeVisible();

    // And the article no longer shows as saved.
    await gotoAndSettle(page, REFERENCE_PATH);
    await expect(page.getByRole('button', { name: 'حفظ المقال' }).filter({ visible: true }).first()).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('copy link', () => {
  test('copy-link copies the article URL and shows a confirmation', async ({ page, context, baseURL }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL });
    await gotoAndSettle(page, REFERENCE_PATH);
    const copy = page.getByRole('button', { name: 'نسخ الرابط' });
    await copy.scrollIntoViewIfNeeded();
    await copy.click();
    await expect(page.getByRole('button', { name: 'تمّ النسخ' })).toBeVisible();
    await expect(page.getByText('تمّ النسخ').last()).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(decodeURIComponent(copied)).toContain(REFERENCE.slug);
    expect(copied).toMatch(/^https?:\/\//);
  });
});

test.describe('reading progress', () => {
  test('progress increases as the reader scrolls through the article', async ({ page }) => {
    await gotoAndSettle(page, REFERENCE_PATH);
    const bar = page.getByRole('progressbar', { name: 'نسبة قراءة المقال' });
    await expect(bar).toBeAttached();
    const start = Number(await bar.getAttribute('aria-valuenow'));
    expect(start).toBeLessThan(50);

    await page.evaluate(() => {
      const body = document.getElementById('article-body')!;
      const rect = body.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + rect.top + rect.height / 2 - 96);
    });
    await expect.poll(async () => Number(await bar.getAttribute('aria-valuenow'))).toBeGreaterThan(start);

    await page.evaluate(() => {
      const body = document.getElementById('article-body')!;
      window.scrollTo(0, window.scrollY + body.getBoundingClientRect().bottom);
    });
    await expect.poll(async () => Number(await bar.getAttribute('aria-valuenow'))).toBe(100);
  });
});

test.describe('not found', () => {
  for (const path of ['/no-such-article-xyz/', '/category/no-such-category/', '/tag/no-such-tag/', '/author/no-such-author/']) {
    test(`404 for ${path}`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(404);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('لم نجد هذه الصفحة');
      await expect(page.locator('main').getByRole('link', { name: 'الرئيسية' }).or(page.locator('main a[href="/"]')).first()).toBeVisible();
    });
  }
});

test.describe('layout', () => {
  const pages = [
    '/',
    REFERENCE_PATH,
    '/category/تأملات/',
    '/articles/',
    '/search/?q=فرح',
    '/tag/فرح/',
    '/author/hanan-zahreddine/',
    '/about/',
    '/contact/',
    '/saved/',
    '/picks/',
    '/no-such-article-xyz/',
  ];
  for (const path of pages) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res).not.toBeNull();
      await page.evaluate(() => document.fonts?.ready.then(() => undefined));
      await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => undefined);
      await expectNoHorizontalOverflow(page);
      // Scroll to the bottom too (lazy content, sticky bars).
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(300);
      await expectNoHorizontalOverflow(page);
    });
  }

  test('no horizontal overflow at 360px on the article and home', async ({ page }) => {
    test.skip(!isMobile(page), 'phone width only');
    await page.setViewportSize({ width: 360, height: 780 });
    for (const path of ['/', REFERENCE_PATH, '/category/تأملات/', '/search/?q=فرح']) {
      await gotoAndSettle(page, path);
      await expectNoHorizontalOverflow(page);
    }
  });

  test('document is Arabic and right-to-left', async ({ page }) => {
    await gotoAndSettle(page, '/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });
});

test.describe('machine-readable endpoints', () => {
  test('RSS feed', async ({ request }) => {
    const res = await request.get('/feed/');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/application\/(rss\+)?xml/);
    const xml = await res.text();
    expect(xml).toContain('<rss');
    expect(xml).toContain('<item>');
    expect(xml).toContain(REFERENCE.title);
  });

  test('sitemap', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('xml');
    const xml = await res.text();
    expect(xml).toContain('<urlset');
    expect(decodeURIComponent(xml)).toContain(REFERENCE.slug);
  });

  test('robots.txt', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');
    expect(await res.text()).toMatch(/User-Agent:\s*\*/i);
  });
});
