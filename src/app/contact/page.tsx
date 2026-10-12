import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactDetails } from '@/components/contact/ContactDetails';
import { ContactForm } from '@/components/contact/ContactForm';
import { contactPageHtml } from '@/components/contact/page-content';
import { SocialLinks } from '@/components/footer/SocialLinks';
import { ArrowLeftIcon, MailIcon } from '@/components/icons';
import { JsonLd } from '@/components/JsonLd';
import { getPage, type PageContent } from '@/lib/content';
import { absoluteUrl, routes } from '@/lib/routes';
import { contactDetails, site, socialLinks } from '@/lib/site';

export const revalidate = 600;

const TITLE = 'اتصل بنا';
const DESCRIPTION = `تواصل مع فريق تحرير ${site.fullName}: أرسل سؤالك أو ملاحظتك على مقال أو اقتراحك عبر نموذج الاتصال.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: routes.contact() },
  openGraph: { type: 'website', siteName: site.fullName, locale: site.locale, url: routes.contact(), title: `${TITLE} — ${site.fullName}`, description: DESCRIPTION },
};

async function loadPage(): Promise<PageContent | null> {
  try {
    return await getPage(site.contactPageSlug);
  } catch (error) {
    console.error('[contact] page', (error as Error).message);
    return null;
  }
}

export default async function ContactPage() {
  const page = await loadPage();
  const pageHtml = page ? contactPageHtml(page.contentHtml) : null;

  return (
    <>
      <header className="relative isolate overflow-hidden border-b border-line bg-gradient-to-b from-brand-100/80 via-brand-50 to-canvas">
        <div className="pointer-events-none absolute -end-24 -top-32 -z-10 size-80 rounded-full bg-brand-200/45 blur-3xl" aria-hidden="true" />
        <div className="container-site py-8 sm:py-12">
          <Breadcrumbs items={[{ label: TITLE }]} className="mb-6 sm:mb-8" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-(--shadow-card) ring-1 ring-brand-100 sm:size-16" aria-hidden="true">
              <MailIcon width={28} height={28} />
            </span>
            <div className="min-w-0">
              <p className="eyebrow mb-2">تواصل معنا</p>
              <h1 className="text-[1.75rem] leading-[1.45] font-bold text-ink sm:text-h1">{TITLE}</h1>
              <p className="mt-3 max-w-2xl text-base leading-[1.9] text-ink-soft">
                يسعد فريق تحرير «{site.name}» بتلقّي رسائلكم: سؤالًا، أو ملاحظةً على مقال، أو اقتراحًا لموضوع. اكتب رسالتك في النموذج أدناه.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container-site py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-8">
            {pageHtml ? (
              <section aria-label={page?.title || TITLE} className="card px-5 py-6 sm:px-8 sm:py-8">
                <div className="prose-ar" dangerouslySetInnerHTML={{ __html: pageHtml }} />
              </section>
            ) : null}

            <section aria-labelledby="contact-form-title" className="card px-5 py-7 sm:px-8 sm:py-9">
              <h2 id="contact-form-title" className="text-h2 font-bold text-ink">
                أرسل رسالة
              </h2>
              <ContactForm className="mt-2" />
            </section>
          </div>

          <aside aria-label="معلومات إضافيّة" className="flex flex-col gap-6">
            <ContactDetails details={contactDetails} />

            {socialLinks.length ? (
              <section aria-labelledby="contact-social" className="card p-6">
                <h2 id="contact-social" className="text-h3 font-bold text-ink">
                  تابعونا
                </h2>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">جديد المجلّة على حساباتها الرسميّة.</p>
                <SocialLinks links={socialLinks} className="mt-4" />
              </section>
            ) : null}

            <section aria-labelledby="contact-about" className="surface-soft p-6">
              <h2 id="contact-about" className="text-h3 font-bold text-ink">
                عن المجلّة
              </h2>
              <p className="mt-2 text-[0.9375rem] leading-[1.9] text-ink-soft">{site.shortDescription}</p>
              <Link href={routes.about()} className="group mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
                تعرّف إلى المجلّة
                <ArrowLeftIcon width={16} height={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
              </Link>
            </section>
          </aside>
        </div>
      </div>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: TITLE,
          url: absoluteUrl(routes.contact(), site.url),
          inLanguage: 'ar',
          isPartOf: { '@type': 'WebSite', name: site.fullName, url: site.url },
        }}
      />
    </>
  );
}
