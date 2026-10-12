import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoAndSettle, isolateRateLimit } from './helpers';

/** Journeys F (newsletter) and G (contact): validation and honest server responses. */

const SUCCESS_TEXT = /تمّ اشتراكك|شكرًا لك|أُرسلت رسالتك|بنجاح/;

function newsletterIn(scope: Locator) {
  const form = scope.locator('form').filter({ has: scope.page().getByPlaceholder('name@example.com') }).first();
  return {
    form,
    email: form.getByLabel('البريد الإلكترونيّ'),
    submit: form.getByRole('button', { name: /اشترك/ }),
    status: form.locator('p[aria-live]'),
  };
}

test.describe('F — newsletter', () => {
  test.beforeEach(async ({ page }) => isolateRateLimit(page));

  for (const where of ['main', 'footer'] as const) {
    test(`${where} form: invalid email is rejected client-side, valid email shows the honest server answer`, async ({ page }) => {
      await gotoAndSettle(page, '/');
      const nl = newsletterIn(page.locator(where).first());
      await nl.form.scrollIntoViewIfNeeded();

      // Invalid address: a validation error, and no request is sent.
      let posted = 0;
      page.on('request', (req) => {
        if (req.url().includes('/api/newsletter') && req.method() === 'POST') posted += 1;
      });
      await nl.email.fill('not-an-email');
      await nl.submit.click();
      await expect(nl.status).toHaveText(/يرجى إدخال بريد إلكترونيّ صحيح/);
      await expect(nl.status).toHaveAttribute('role', 'alert');
      await expect(nl.email).toHaveAttribute('aria-invalid', 'true');
      expect(posted).toBe(0);

      // Valid address: the preview has no provider → the API answers 503 and the UI says so.
      await nl.email.fill('reader@example.com');
      const [response] = await Promise.all([page.waitForResponse((r) => r.url().includes('/api/newsletter') && r.request().method() === 'POST'), nl.submit.click()]);
      const status = response.status();
      const body = (await response.json()) as { message: string };
      expect(status, 'no newsletter provider is configured in preview').toBe(503);
      await expect(nl.status).toHaveText(body.message);
      await expect(nl.status).toHaveAttribute('role', 'alert');
      await expect(nl.status).not.toHaveText(SUCCESS_TEXT);
      await expect(nl.status).toContainText('غير مفعّلة');
      // The address is kept so nothing has to be typed again.
      await expect(nl.email).toHaveValue('reader@example.com');
    });
  }

  test('a non-2xx response is never presented as success, a 2xx response is', async ({ page }) => {
    await gotoAndSettle(page, '/');
    const nl = newsletterIn(page.locator('main'));
    await nl.form.scrollIntoViewIfNeeded();

    // Server error with a misleading body: still an error.
    await page.route('**/api/newsletter/**', (route) => route.fulfill({ status: 500, json: { message: 'خطأ في الخادم' } }));
    await nl.email.fill('reader@example.com');
    await nl.submit.click();
    await expect(nl.status).toHaveAttribute('role', 'alert');
    await expect(nl.status).toHaveText('خطأ في الخادم');

    // Non-JSON failure: generic error, not success.
    await page.unroute('**/api/newsletter/**');
    await page.route('**/api/newsletter/**', (route) => route.fulfill({ status: 502, body: 'Bad gateway', contentType: 'text/plain' }));
    await nl.email.fill('reader2@example.com');
    await nl.submit.click();
    await expect(nl.status).toHaveAttribute('role', 'alert');
    await expect(nl.status).not.toHaveText(SUCCESS_TEXT);

    // Control: a confirmed subscription is shown as success.
    await page.unroute('**/api/newsletter/**');
    await page.route('**/api/newsletter/**', (route) => route.fulfill({ status: 200, json: { message: 'تمّ اشتراكك في النشرة البريديّة. شكرًا لك!' } }));
    await nl.email.fill('reader3@example.com');
    await nl.submit.click();
    await expect(nl.status).toHaveAttribute('role', 'status');
    await expect(nl.status).toHaveText(/تمّ اشتراكك/);
  });

  test('API: validation and disabled provider statuses', async ({ request }) => {
    const ip = { 'x-real-ip': `10.200.${Math.floor(Math.random() * 250)}.1` };
    const bad = await request.post('/api/newsletter/', { data: { email: 'nope' }, headers: ip });
    expect(bad.status()).toBe(422);
    const ok = await request.post('/api/newsletter/', { data: { email: 'reader@example.com' }, headers: ip });
    expect(ok.status()).toBe(503);
    expect((await ok.json()).message).toContain('غير مفعّلة');
  });
});

async function contactForm(page: Page) {
  const form = page.locator('main form').filter({ has: page.getByLabel('الرسالة') });
  return {
    form,
    name: form.getByLabel('الاسم', { exact: true }),
    email: form.getByLabel('البريد الإلكترونيّ', { exact: true }),
    subject: form.getByLabel('الموضوع', { exact: true }),
    message: form.getByLabel('الرسالة', { exact: true }),
    submit: form.getByRole('button', { name: /أرسل الرسالة/ }),
    success: form.locator('[role="status"][aria-live] > div'),
    alert: form.locator('[role="alert"]'),
  };
}

test.describe('G — contact', () => {
  test.beforeEach(async ({ page }) => isolateRateLimit(page));

  test('empty submit shows field errors and focuses the first invalid field', async ({ page }) => {
    await gotoAndSettle(page, '/contact/');
    const c = await contactForm(page);
    let posted = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/contact') && req.method() === 'POST') posted += 1;
    });
    await c.submit.click();
    for (const field of [c.name, c.email, c.subject, c.message]) await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(c.form.locator('.field-error')).toHaveCount(4);
    await expect(c.name).toBeFocused();
    // Errors are linked to their fields.
    const describedBy = await c.name.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`[id="${describedBy}"]`)).toContainText('يرجى كتابة اسمك');
    expect(posted).toBe(0);
    await expect(c.success).toHaveCount(0);
  });

  test('valid submit shows the honest "not configured" message (503) and no success state', async ({ page }) => {
    await gotoAndSettle(page, '/contact/');
    const c = await contactForm(page);
    await c.name.fill('قارئ تجريبيّ');
    await c.email.fill('reader@example.com');
    await c.subject.fill('سؤال عن المجلّة');
    await c.message.fill('هذه رسالة تجريبيّة لاختبار نموذج الاتصال.');
    const [response] = await Promise.all([page.waitForResponse((r) => r.url().includes('/api/contact') && r.request().method() === 'POST'), c.submit.click()]);
    expect(response.status(), 'no contact provider is configured in preview').toBe(503);
    await expect(c.alert).toContainText('غير مفعّل');
    await expect(c.alert).not.toContainText(SUCCESS_TEXT);
    await expect(c.success).toHaveCount(0);
    // Input is kept.
    await expect(c.message).toHaveValue('هذه رسالة تجريبيّة لاختبار نموذج الاتصال.');
  });

  test('non-2xx is never shown as success; a 2xx is', async ({ page }) => {
    await gotoAndSettle(page, '/contact/');
    const c = await contactForm(page);
    const fill = async () => {
      await c.name.fill('قارئ تجريبيّ');
      await c.email.fill('reader@example.com');
      await c.subject.fill('سؤال عن المجلّة');
      await c.message.fill('هذه رسالة تجريبيّة لاختبار نموذج الاتصال.');
    };
    await page.route('**/api/contact/**', (route) => route.fulfill({ status: 500, body: '<html>oops</html>', contentType: 'text/html' }));
    await fill();
    await c.submit.click();
    await expect(c.alert).toContainText('تعذّر');
    await expect(c.success).toHaveCount(0);

    await page.unroute('**/api/contact/**');
    await page.route('**/api/contact/**', (route) => route.fulfill({ status: 200, json: { message: 'أُرسلت رسالتك إلى فريق التحرير. شكرًا لتواصلك معنا.' } }));
    await c.submit.click();
    await expect(c.success).toContainText('أُرسلت رسالتك');
  });
});
