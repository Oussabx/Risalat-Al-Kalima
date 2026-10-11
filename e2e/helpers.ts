import { expect, type Page } from '@playwright/test';

export const enc = (s: string) => encodeURIComponent(s);
export const articlePath = (slug: string) => `/${enc(slug)}/`;

export function isMobile(page: Page) {
  return (page.viewportSize()?.width ?? 1440) < 1024;
}

/** Waits until a client-side navigation has landed on a page whose <h1> matches. */
export async function expectHeading(page: Page, text: string | RegExp) {
  await expect(page.getByRole('heading', { level: 1 })).toContainText(text);
}

export async function openDrawer(page: Page) {
  await page.getByRole('button', { name: 'فتح القائمة' }).click();
  const drawer = page.getByRole('dialog', { name: 'القائمة' });
  await expect(drawer).toBeVisible();
  return drawer;
}
