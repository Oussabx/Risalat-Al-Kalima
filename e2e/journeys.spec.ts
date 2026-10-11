import { expect, test } from '@playwright/test';
import { articlePath, expectHeading, isMobile, openDrawer } from './helpers';

const JOY = 'فرح-تحت-المجهر';

test.describe('A — discover and read', () => {
  test('home → featured → author → related → another article', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.getByRole('region', { name: 'المقال المميّز' }).getByRole('link', { name: 'فرح تحت المجهر' }).click();
    await expectHeading(page, 'فرح تحت المجهر');
    await expect(page.locator('#article-body')).toBeVisible();

    const related = page.getByRole('region', { name: 'مقالات ذات صلة' });
    await expect(related.getByRole('article')).toHaveCount(4);
    const firstRelated = related.getByRole('article').first().getByRole('heading');
    const relatedTitle = (await firstRelated.textContent())!.trim();

    await page.getByRole('region', { name: 'عن الكاتب' }).getByRole('link', { name: 'حنان زهر الدّين', exact: true }).click();
    await expectHeading(page, 'حنان زهر الدّين');
    await page.goBack();
    await expectHeading(page, 'فرح تحت المجهر');

    await page.getByRole('region', { name: 'مقالات ذات صلة' }).getByRole('link', { name: relatedTitle }).click();
    await expectHeading(page, relatedTitle);
  });
});

test.describe('B — browse by topic', () => {
  test('category menu → category → sort & paginate → article', async ({ page }) => {
    await page.goto('/');
    if (isMobile(page)) {
      const drawer = await openDrawer(page);
      await drawer.getByRole('button', { name: 'المجتمع والثقافة' }).click();
      await drawer.getByRole('link', { name: 'تاريخ وشخصيات' }).click();
    } else {
      await page.getByRole('button', { name: 'الأقسام' }).click();
      await page.locator('#mega-menu').getByRole('link', { name: 'تاريخ وشخصيات' }).click();
    }
    await expectHeading(page, 'تاريخ وشخصيات');
    const titles = page.getByRole('main').getByRole('article').getByRole('heading');
    await expect(titles.first()).toContainText('كبريانوس');

    await page.getByLabel('الترتيب').selectOption('oldest');
    await expect(page).toHaveURL(/sort=oldest/);
    await expect(titles.first()).toContainText('ترتليان');

    await titles.first().getByRole('link').click();
    await expectHeading(page, /ترتليان/);
  });

  test('articles archive filters and paginates', async ({ page }) => {
    await page.goto('/articles/');
    await expectHeading(page, 'كل المقالات');
    await expect(page.getByText('35 مقالًا')).toBeVisible();
    await page.getByRole('link', { name: /التالي/ }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole('main').getByRole('article')).toHaveCount(12);

    await page.getByLabel('القسم').selectOption({ label: 'الحياة والعائلة المسيحية' });
    await expect(page).toHaveURL(/category=/);
    await expect(page).not.toHaveURL(/page=2/);
    await expect(page.getByText('3 مقالات')).toBeVisible();
    await page.getByRole('button', { name: 'مسح الفلاتر' }).click();
    await expect(page.getByText('35 مقالًا')).toBeVisible();
  });
});

test.describe('C — search', () => {
  test('overlay → results page → article → back to results', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'بحث', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'البحث في المجلة' });
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole('searchbox');
    await expect(input).toBeFocused();
    await input.fill('الظروف'); // no shadda: must still find «الظّروف»
    await expect(dialog.getByRole('link', { name: /هل تكفي الظّروف/ })).toBeVisible();
    await input.press('Enter');

    await expect(page).toHaveURL(/\/search\/\?q=/);
    await expectHeading(page, 'نتائج البحث عن «الظروف»');
    await page.getByRole('main').getByRole('link', { name: 'هل تكفي الظّروف لنكون سعداء؟' }).click();
    await expectHeading(page, 'هل تكفي الظّروف لنكون سعداء؟');
    await page.goBack();
    await expectHeading(page, 'نتائج البحث عن «الظروف»');
  });

  test('empty results and category facet', async ({ page }) => {
    await page.goto(`/search/?q=${encodeURIComponent('كلمةغيرموجودة')}`);
    await expect(page.getByText('لا توجد نتائج لـ «كلمةغيرموجودة»')).toBeVisible();

    await page.goto(`/search/?q=${encodeURIComponent('الصلاة')}`);
    const facets = page.getByLabel('تصفية حسب القسم');
    await facets.getByRole('link', { name: /الكتاب المقدس/ }).click();
    await expect(page).toHaveURL(/category=/);
    await expect(page.getByRole('main').getByRole('article')).toHaveCount(1);
    await page.getByRole('link', { name: 'مسح التصفية' }).click();
    await expect(page.getByRole('main').getByRole('article')).toHaveCount(3);
  });
});

test.describe('D/E — authors and tags', () => {
  test('article → author archive → another article by the author', async ({ page }) => {
    await page.goto(articlePath(JOY));
    await page.locator('header').filter({ hasText: 'فرح تحت المجهر' }).getByRole('link', { name: 'حنان زهر الدّين' }).click();
    await expectHeading(page, 'حنان زهر الدّين');
    const cards = page.getByRole('main').getByRole('article');
    await expect(cards).toHaveCount(6);
    await cards.filter({ hasText: 'المطالعة وقيمة الإنسان' }).getByRole('link', { name: 'المطالعة وقيمة الإنسان' }).click();
    await expectHeading(page, 'المطالعة وقيمة الإنسان');
  });

  test('article → tag → related article', async ({ page }) => {
    await page.goto(articlePath(JOY));
    for (const tag of ['تأملات', 'رسالة الكلمة', 'سعادة', 'عبرة الحياة', 'فرح']) {
      await expect(page.getByRole('link', { name: `#${tag}` })).toBeVisible();
    }
    await page.getByRole('link', { name: '#سعادة' }).click();
    await expectHeading(page, '#سعادة');
    await page.getByRole('main').getByRole('link', { name: 'هل تكفي الظّروف لنكون سعداء؟' }).click();
    await expectHeading(page, 'هل تكفي الظّروف لنكون سعداء؟');
  });
});

test.describe('F — newsletter', () => {
  test('validates, reports a disabled service honestly, and confirms real success', async ({ page }) => {
    await page.goto('/');
    const band = page.getByRole('region', { name: 'اشترك في نشرة رسالة الكلمة' });
    const email = band.getByLabel('البريد الإلكترونيّ');
    await email.fill('not-an-email');
    await band.getByRole('button', { name: /اشترك/ }).click();
    await expect(band.getByText('يرجى إدخال بريد إلكترونيّ صحيح')).toBeVisible();

    // No provider is configured in preview: the UI must say so, never fake success.
    await email.fill('reader@example.com');
    await band.getByRole('button', { name: /اشترك/ }).click();
    await expect(band.getByText('خدمة الاشتراك في النشرة غير مفعّلة حاليًا')).toBeVisible();
    await expect(band.getByText(/تمّ اشتراكك/)).toHaveCount(0);

    await page.route('**/api/newsletter/', (route) => route.fulfill({ status: 200, json: { message: 'تمّ اشتراكك بنجاح. شكرًا لك!' } }));
    await band.getByRole('button', { name: /اشترك/ }).click();
    await expect(band.getByText('تمّ اشتراكك بنجاح. شكرًا لك!')).toBeVisible();
  });
});

test.describe('G — contact', () => {
  test('validates fields and reports the real outcome', async ({ page }) => {
    await page.goto('/contact/');
    await expectHeading(page, 'يسعدنا أن نسمع منك');
    const form = page.getByRole('main');
    await form.getByRole('button', { name: /إرسال الرسالة/ }).click();
    await expect(page.getByText('يرجى كتابة اسمك.')).toBeVisible();
    await expect(page.getByText('يرجى إدخال بريد إلكترونيّ صحيح.')).toBeVisible();
    await expect(form.getByLabel('الاسم')).toBeFocused();

    await form.getByLabel('الاسم').fill('قارئ');
    await form.getByLabel('البريد الإلكترونيّ').fill('reader@example.com');
    await form.getByLabel('الموضوع').fill('اقتراح موضوع');
    await form.getByLabel('الرسالة').fill('أقترح مقالًا عن الرجاء المسيحيّ في الأزمات.');
    await form.getByRole('button', { name: /إرسال الرسالة/ }).click();
    await expect(form.getByRole('alert')).toContainText('نموذج الاتصال غير مفعّل حاليًا');

    await page.route('**/api/contact/', (route) => route.fulfill({ status: 200, json: { message: 'وصلت رسالتك إلى فريق التحرير.' } }));
    await form.getByRole('button', { name: /إرسال الرسالة/ }).click();
    await expect(page.getByText('وصلت رسالتك إلى فريق التحرير.')).toBeVisible();
  });
});

test.describe('H — previous / next', () => {
  test('matches the original article order', async ({ page }) => {
    await page.goto(articlePath(JOY));
    const nav = page.getByRole('navigation', { name: 'مقالات متتالية' });
    await expect(nav.getByRole('link', { name: /المقال السابق.*طوبى للودعاء/ })).toBeVisible();
    await nav.getByRole('link', { name: /المقال التالي.*الإدارة بالخوف/ }).click();
    await expectHeading(page, 'الإدارة بالخوف أم بالثّقة؟ سرّ القائد الحكيم');
    await page.getByRole('navigation', { name: 'مقالات متتالية' }).getByRole('link', { name: /المقال السابق/ }).click();
    await expectHeading(page, 'فرح تحت المجهر');
  });
});

test.describe('I — mobile navigation', () => {
  test('drawer → expand group → destination → back to menu', async ({ page }) => {
    test.skip(!isMobile(page), 'mobile only');
    await page.goto('/');
    let drawer = await openDrawer(page);
    const group = drawer.getByRole('button', { name: 'الحياة المسيحية' });
    await group.click();
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await drawer.getByRole('link', { name: 'الحياة والعائلة المسيحية' }).click();
    await expect(drawer).toBeHidden();
    await expectHeading(page, 'الحياة والعائلة المسيحية');

    drawer = await openDrawer(page);
    // The group holding the current page opens by itself, with the page marked.
    await expect(drawer.getByRole('link', { name: 'الحياة والعائلة المسيحية' })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });
});

test.describe('Reading tools', () => {
  test('bookmark persists and appears on the saved page', async ({ page }) => {
    await page.goto(articlePath(JOY));
    const save = page.getByRole('button', { name: 'حفظ المقال' }).first();
    await save.click();
    await expect(page.getByRole('button', { name: 'إزالة من المحفوظات' }).first()).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(page.getByRole('button', { name: 'إزالة من المحفوظات' }).first()).toBeVisible();
    await page.goto('/saved/');
    await expect(page.getByRole('link', { name: /فرح تحت المجهر/ })).toBeVisible();
    await page.getByRole('button', { name: 'إزالة «فرح تحت المجهر» من المحفوظات' }).click();
    await expect(page.getByText('لم تحفظ أيّ مقال بعد')).toBeVisible();
  });

  test('reading progress advances while scrolling', async ({ page }) => {
    await page.goto(articlePath(JOY));
    const bar = page.getByRole('progressbar', { name: 'تقدّم القراءة' });
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    await page.mouse.wheel(0, 1600);
    await expect.poll(async () => Number(await bar.getAttribute('aria-valuenow'))).toBeGreaterThan(20);
  });

  test('share offers copy-link fallback', async ({ page, context }) => {
    test.skip(isMobile(page), 'mobile uses the native share sheet');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(articlePath(JOY));
    await page.getByRole('complementary', { name: 'معلومات المقال' }).getByRole('button', { name: 'مشاركة المقال' }).click();
    await page.getByRole('menuitem', { name: 'نسخ الرابط' }).click();
    await expect(page.getByRole('menuitem', { name: 'تمّ نسخ الرابط' })).toBeVisible();
    expect(decodeURIComponent(await page.evaluate(() => navigator.clipboard.readText()))).toContain(JOY);
  });

  test('unknown pages return a helpful 404', async ({ page }) => {
    const res = await page.goto('/لا-يوجد-مقال-بهذا-الاسم/');
    expect(res?.status()).toBe(404);
    await expectHeading(page, 'لم نعثر على هذه الصفحة');
  });
});
