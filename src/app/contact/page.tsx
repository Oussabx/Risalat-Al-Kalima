import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContactForm } from '@/components/ContactForm';
import { MailIcon, PhoneIcon, socialIcons } from '@/components/icons';
import { content } from '@/lib/content';
import { prepareContent } from '@/lib/html';
import { routes } from '@/lib/routes';
import { contactDetails, socialLinks } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'اتصل بنا',
  description: 'راسل فريق تحرير مجلّة رسالة الكلمة: اقتراحات، أسئلة، أو مشاركة مقال.',
  alternates: { canonical: routes.contact },
};

export default async function ContactPage() {
  const page = await content.getPageBySlug(process.env.CONTACT_PAGE_SLUG ?? 'اتصل-بنا').catch(() => null);
  const hasDetails = contactDetails.email || contactDetails.phone || socialLinks.length > 0;

  return (
    <div className="container-page pt-6 sm:pt-8">
      <Breadcrumbs items={[{ label: 'اتصل بنا' }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div data-reveal>
          <p className="text-sm font-semibold text-brand-700">تواصل معنا</p>
          <h1 className="mt-1 text-3xl font-bold leading-tight text-ink sm:text-4xl">يسعدنا أن نسمع منك</h1>
          <p className="mt-4 leading-8 text-muted">لاقتراح موضوع، أو طرح سؤال، أو مشاركة ملاحظة على مقال، اكتب لنا عبر النموذج وسيصل إلى فريق التحرير.</p>

          {page && <div className="prose-ar mt-6 text-base" dangerouslySetInnerHTML={{ __html: prepareContent(page.contentHtml).html }} />}

          {hasDetails && (
            <ul className="mt-8 space-y-3">
              {contactDetails.email && (
                <li>
                  <a href={`mailto:${contactDetails.email}`} className="inline-flex items-center gap-3 text-ink-soft hover:text-brand-700">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                      <MailIcon size={18} />
                    </span>
                    <span dir="ltr">{contactDetails.email}</span>
                  </a>
                </li>
              )}
              {contactDetails.phone && (
                <li>
                  <a href={`tel:${contactDetails.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-3 text-ink-soft hover:text-brand-700">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                      <PhoneIcon size={18} />
                    </span>
                    <span dir="ltr">{contactDetails.phone}</span>
                  </a>
                </li>
              )}
              {socialLinks.length > 0 && (
                <li className="flex gap-2 pt-2">
                  {socialLinks.map((s) => {
                    const Icon = socialIcons[s.key];
                    return (
                      <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-soft hover:border-brand-300 hover:text-brand-700">
                        <Icon size={17} />
                      </a>
                    );
                  })}
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="card p-6 sm:p-8" data-reveal>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
