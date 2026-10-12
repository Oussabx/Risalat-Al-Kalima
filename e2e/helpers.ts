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
  await page.waitForLoadState('networkidle').catch(() => undefined);
}
