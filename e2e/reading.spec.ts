import { expect, test } from '@playwright/test';
import { REFERENCE, REFERENCE_PATH, currentPath, expectPath, gotoAndSettle } from './helpers';

/** Journeys A (discover & read), D (author), E (tags) and H (previous / next). */

test.describe('A — discover & read', () => {
  test('home → lead article → author → back → related article', async ({ page }) => {
    await gotoAndSettle(page, '/');

    // The lead (hero) story is the first article of the home page.
    const lead = page.locator('main article').first();
    const leadLink = lead.getByRole('heading').getByRole('link');
    await expect(leadLink).toBeVisible();
    const leadTitle = (await leadLink.innerText()).trim();
    expect(leadTitle).toBe(REFERENCE.title);
    await leadLink.click();
    await expectPath(page, REFERENCE_PATH);

    // The article renders: title, body text and author.
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText(REFERENCE.title);
    await expect(page.locator('#article-body')).toBeVisible();
    expect((await page.locator('#article-body p').count()) > 1).toBeTruthy();
    expect((await page.locator('#article-body').innerText()).length).toBeGreaterThan(200);
    const authorLink = page.locator('main article').first().getByRole('link', { name: REFERENCE.author }).first();
    await expect(authorLink).toBeVisible();
    await expect(page.locator('main article time').first()).toBeVisible();

    // Open the author.
    await authorLink.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(REFERENCE.author);
    expect(currentPath(page)).toMatch(/^\/author\/[^/]+\/$/);

    // Back to the article.
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(REFERENCE.title);

    // Related articles → open another one.
    const related = page.getByRole('region', { name: 'مقالات ذات صلة' });
    await related.scrollIntoViewIfNeeded();
    const cards = related.getByRole('heading', { level: 3 }).getByRole('link');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    const relatedTitle = (await cards.first().innerText()).trim();
    expect(relatedTitle).not.toBe(REFERENCE.title);
    await cards.first().click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(relatedTitle);
    await expect(page.locator('#article-body')).toBeVisible();
  });
});

test.describe('D — author', () => {
  test('article → author link → author archive → open one of their articles', async ({ page }) => {
    await gotoAndSettle(page, REFERENCE_PATH);
    await page.locator('main article').first().getByRole('link', { name: REFERENCE.author }).first().click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(REFERENCE.author);

    const list = page.getByRole('list', { name: `مقالات ${REFERENCE.author}` });
    const items = list.getByRole('listitem');
    expect(await items.count()).toBeGreaterThanOrEqual(2);
    // Every card on the author archive is by that author.
    for (const item of await items.all()) await expect(item.getByRole('link', { name: REFERENCE.author })).toBeVisible();

    const titles = (await list.getByRole('heading', { level: 2 }).allInnerTexts()).map((t) => t.trim());
    expect(titles).toContain(REFERENCE.title);
    const other = titles.find((t) => t !== REFERENCE.title)!;
    await list.getByRole('link', { name: other, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(other);
    await expect(page.locator('main article').first().getByRole('link', { name: REFERENCE.author }).first()).toBeVisible();
  });
});

test.describe('E — tags', () => {
  test('article → tag chip «فرح» → tag archive → open an article', async ({ page }) => {
    await gotoAndSettle(page, REFERENCE_PATH);
    const tags = page.getByRole('heading', { name: 'وسوم المقال' });
    await expect(tags).toBeVisible();
    const tagLink = page.locator('main').getByRole('link', { name: 'فرح', exact: true }).first();
    await tagLink.click();
    await expectPath(page, '/tag/فرح/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('فرح');

    const list = page.getByRole('list', { name: 'وسم فرح' });
    const links = list.getByRole('heading', { level: 2 }).getByRole('link');
    expect(await links.count()).toBeGreaterThanOrEqual(1);
    await expect(list.getByRole('link', { name: REFERENCE.title, exact: true })).toBeVisible();
    const title = (await links.last().innerText()).trim();
    await links.last().click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  });
});

test.describe('H — previous / next', () => {
  test('reference article links to the verified neighbours and «next» works', async ({ page }) => {
    await gotoAndSettle(page, REFERENCE_PATH);
    const nav = page.getByRole('navigation', { name: 'المقال السابق والتالي' });
    const prev = nav.getByRole('link', { name: `المقال السابق: ${REFERENCE.previous}` });
    const next = nav.getByRole('link', { name: `المقال التالي: ${REFERENCE.next}` });
    await expect(prev).toHaveCount(1);
    await expect(next).toHaveCount(1);

    await next.scrollIntoViewIfNeeded();
    await next.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(REFERENCE.next);
    // The next article's «previous» is the reference article.
    await expect(page.getByRole('navigation', { name: 'المقال السابق والتالي' }).getByRole('link', { name: `المقال السابق: ${REFERENCE.title}` })).toHaveCount(1);
  });

  test('previous link opens «طوبى للودعاء…»', async ({ page }) => {
    await gotoAndSettle(page, REFERENCE_PATH);
    const prev = page.getByRole('navigation', { name: 'المقال السابق والتالي' }).getByRole('link', { name: `المقال السابق: ${REFERENCE.previous}` });
    await prev.scrollIntoViewIfNeeded();
    await prev.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(REFERENCE.previous);
  });
});

test.describe('mobile action bar', () => {
  test.skip(({ isMobile: mobile }) => !mobile, 'phone-only sticky bar');

  test('sticky «next article» button opens the next article', async ({ page }) => {
    await gotoAndSettle(page, REFERENCE_PATH);
    // The fixed bar at the bottom of the screen (the in-page previous/next cards share the link name).
    const bar = page.locator('div.fixed.bottom-0').filter({ has: page.getByRole('button', { name: 'مشاركة المقال' }) });
    const next = bar.getByRole('link', { name: `المقال التالي: ${REFERENCE.next}` });
    await expect(next).toBeInViewport();
    await next.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(REFERENCE.next);
  });
});
