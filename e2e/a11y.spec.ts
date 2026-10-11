import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { articlePath, enc } from './helpers';

const pages = [
  ['home', '/'],
  ['article', articlePath('فرح-تحت-المجهر')],
  ['articles', '/articles/'],
  ['category', `/category/${enc('تأملات')}/`],
  ['search', `/search/?q=${enc('الصلاة')}`],
  ['about', '/about/'],
  ['contact', '/contact/'],
];

for (const [name, path] of pages) {
  test(`no serious accessibility violations: ${name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  });
}
