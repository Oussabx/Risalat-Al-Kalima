import { expect, type Page } from '@playwright/test';

/** The verified reference article («فرح تحت المجهر») and its neighbours, as served by the preview fixtures. */
export const REFERENCE = {
  slug: 'فرح-تحت-المجهر',
  title: 'فرح تحت المجهر',
  author: 'حنان زهر الدّين',
  previous: 'طوبى للودعاء: قوّة تحت السّيطرة وميراث أبديّ',
  next: 'الإدارة بالخوف أم بالثّقة؟ سرّ القائد الحكيم',
} as const;

/** Path of the reference article (trailing slash, as the site's routes produce). */
export const REFERENCE_PATH = `/${REFERENCE.slug}/`;

/** Width below which the layout switches to its mobile presentation (Tailwind `lg`). */
export const MOBILE_BREAKPOINT = 1024;

/** True when the page runs in a mobile-sized viewport. */
export function isMobile(page: Page): boolean {
  const width = page.viewportSize()?.width ?? 1440;
  return width < MOBILE_BREAKPOINT;
}

/** Asserts the document cannot be scrolled sideways (RTL layouts overflow to the left, so check both edges). */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const viewport = doc.clientWidth;
    const offenders: string[] = [];
    if (doc.scrollWidth > viewport + 1) {
      for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
        const rect = el.getBoundingClientRect();
        if (rect.width && (rect.right > viewport + 1 || rect.left < -1) && getComputedStyle(el).position !== 'fixed') {
          const id = el.id ? `#${el.id}` : '';
          const cls = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}` : '';
          offenders.push(`${el.tagName.toLowerCase()}${id}${cls}`);
          if (offenders.length >= 5) break;
        }
      }
    }
    return { scrollWidth: doc.scrollWidth, viewport, offenders };
  });
  expect(overflow.scrollWidth, `horizontal overflow; widest elements: ${overflow.offenders.join(', ')}`).toBeLessThanOrEqual(overflow.viewport + 1);
}

/**
 * Navigates to a path and waits until the page is usable: the response is OK,
 * the main landmark is visible, web fonts have loaded and the network is quiet.
 */
export async function gotoAndSettle(page: Page, path: string): Promise<void> {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(response, `no response for ${path}`).not.toBeNull();
  expect(response!.status(), `status for ${path}`).toBeLessThan(400);
  await expect(page.locator('main#main')).toBeVisible();
  await page.evaluate(() => document.fonts?.ready.then(() => undefined));
  // Best effort: Next.js link prefetches can leave requests Chromium never reports as finished.
  await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => undefined);
}

/** Decoded current pathname (Arabic slugs arrive percent-encoded in `page.url()`). */
export function currentPath(page: Page): string {
  return decodeURIComponent(new URL(page.url()).pathname).normalize('NFC');
}

/** Waits until the decoded pathname equals `path`. */
export async function expectPath(page: Page, path: string): Promise<void> {
  await expect.poll(() => currentPath(page), { message: `expected to be on ${path}` }).toBe(path.normalize('NFC'));
}

/** Titles of the article cards in the main listing of an archive page, in display order. */
export async function archiveTitles(page: Page): Promise<string[]> {
  return page.locator('main section ul > li article h2').allInnerTexts().then((all) => all.map((t) => t.trim()));
}

/**
 * Gives this test its own client IP for the rate-limited form endpoints, so
 * parallel tests and both projects never share (and exhaust) one bucket.
 */
export async function isolateRateLimit(page: Page): Promise<void> {
  const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  await page.route('**/api/**', (route) => route.continue({ headers: { ...route.request().headers(), 'x-real-ip': ip } }));
}

/** The header's menu button (hamburger on phones, mega-menu toggle on desktop). */
export function menuButton(page: Page) {
  return page.locator('header[data-site-header]').getByRole('button', { name: 'القائمة', exact: true });
}

/** The header's search icon button. */
export function searchButton(page: Page) {
  return page.locator('header[data-site-header]').getByRole('button', { name: 'البحث', exact: true });
}
