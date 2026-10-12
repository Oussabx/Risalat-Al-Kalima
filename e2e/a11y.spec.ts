import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { REFERENCE_PATH, gotoAndSettle, isMobile, menuButton, searchButton } from './helpers';

/**
 * Automated WCAG 2 A/AA checks with axe-core. Every violation is reported in the
 * test output; the test fails on serious or critical ones.
 */

type Violation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

function describe(violations: Violation[]): string {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .slice(0, 5)
        .map((n) => `      - ${n.target.join(' ')}${n.failureSummary ? `\n        ${n.failureSummary.replace(/\n/g, '\n        ')}` : ''}`)
        .join('\n');
      return `  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))\n${nodes}`;
    })
    .join('\n');
}

async function audit(page: Page, label: string, include?: string) {
  // @axe-core/playwright is typed against its own playwright-core; the runtime API is the same.
  let builder = new AxeBuilder({ page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]['page'] }).withTags(['wcag2a', 'wcag2aa']);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  if (violations.length) {
    const report = describe(violations);
    console.log(`axe violations on ${label} [${page.viewportSize()?.width}px]:\n${report}`);
    test.info().annotations.push({ type: 'axe', description: `${label}: ${violations.map((v) => `${v.id} (${v.impact})`).join(', ')}` });
  }
  const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(blocking, `serious/critical axe violations on ${label}:\n${describe(blocking)}`).toEqual([]);
}

const PAGES: [string, string][] = [
  ['home', '/'],
  ['article', REFERENCE_PATH],
  ['category', '/category/تأملات/'],
  ['search', '/search/?q=فرح'],
  ['search (no results)', '/search/?q=زخقثصضغظ'],
  ['about', '/about/'],
  ['contact', '/contact/'],
  ['saved', '/saved/'],
];

test.describe('accessibility (axe, WCAG 2 A/AA)', () => {
  for (const [label, path] of PAGES) {
    test(`${label} page`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await gotoAndSettle(page, path);
      await audit(page, label);
    });
  }

  test('contact form with validation errors', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoAndSettle(page, '/contact/');
    await page.locator('main form').getByRole('button', { name: /أرسل الرسالة/ }).click();
    await expect(page.locator('main form .field-error').first()).toBeVisible();
    await audit(page, 'contact (errors)');
  });

  test('search overlay open', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoAndSettle(page, '/');
    await searchButton(page).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('searchbox').fill('فرح');
    await expect(dialog.getByRole('list', { name: 'نتائج البحث' })).toBeVisible();
    await audit(page, 'search overlay', '#site-search');
  });

  test('navigation menu open', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoAndSettle(page, '/');
    if (isMobile(page)) {
      await menuButton(page).click();
      const drawer = page.getByRole('dialog', { name: 'القائمة' });
      await drawer.getByRole('button', { name: 'الحياة المسيحية' }).click();
      await audit(page, 'mobile drawer', '#site-drawer');
    } else {
      await page.getByRole('navigation', { name: 'التنقّل الرئيسي' }).getByRole('button', { name: 'كل الأقسام' }).click();
      await expect(page.locator('#site-mega-menu')).toBeVisible();
      await audit(page, 'mega menu', 'header');
    }
  });
});
