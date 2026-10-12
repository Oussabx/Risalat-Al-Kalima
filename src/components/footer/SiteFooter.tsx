import Link from 'next/link';
import { getIdentity, getNavigation } from '@/lib/content';
import { routes } from '@/lib/routes';
import { contactDetails, site, socialLinks } from '@/lib/site';
import { Logo } from '../Logo';
import { NewsletterForm } from '../NewsletterForm';
import { MailIcon, MapPinIcon, PhoneIcon, RssIcon } from '../icons';
import { pageLinks } from '../header/nav';
import { SocialLinks } from './SocialLinks';

const headingClass = 'text-sm font-bold text-ink';
const linkClass = 'inline-flex min-h-11 items-center gap-2 text-[0.9375rem] text-ink-soft transition-colors duration-200 hover:text-brand-700 lg:min-h-9';

/** Site footer (server): newsletter, the magazine's description, navigation, social links and contact details. */
export async function SiteFooter() {
  const [identity, navigation] = await Promise.all([getIdentity(), getNavigation()]);
  const description = site.shortDescription || identity.description;
  // The leading categories of each menu group.
  const categories = navigation.groups.flatMap((group) => group.categories.slice(0, 2));
  const { email, phone, address } = contactDetails;
  const year = new Date().getFullYear();

  return (
    <footer data-site-footer className="border-t border-line bg-white">
      <div className="container-site">
        <section
          aria-labelledby="footer-newsletter"
          className="grid gap-6 border-b border-line py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-center lg:gap-16 lg:py-12"
        >
          <div className="flex items-start gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600" aria-hidden="true">
              <MailIcon width={22} height={22} />
            </span>
            <div className="min-w-0">
              <h2 id="footer-newsletter" className="text-h3 font-bold text-ink sm:text-h2">
                النشرة البريديّة
              </h2>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">اشترك ليصلك جديد «{site.name}» على بريدك الإلكترونيّ.</p>
            </div>
          </div>
          <NewsletterForm />
        </section>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:gap-x-12">
          <div className="col-span-2 lg:col-span-1">
            <Logo logo={identity.logo} />
            {description ? <p className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-muted">{description}</p> : null}
            {email || phone || address ? (
              <address className="mt-5 flex flex-col items-start not-italic">
                {email ? (
                  <a href={`mailto:${email}`} className={`${linkClass} max-w-full`}>
                    <MailIcon width={16} height={16} className="shrink-0 text-brand-600" />
                    <span dir="ltr" className="min-w-0 [overflow-wrap:anywhere]">
                      {email}
                    </span>
                  </a>
                ) : null}
                {phone ? (
                  <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className={linkClass}>
                    <PhoneIcon width={16} height={16} className="shrink-0 text-brand-600" />
                    <span dir="ltr">{phone}</span>
                  </a>
                ) : null}
                {address ? (
                  <p className="flex items-start gap-2 py-2 text-[0.9375rem] leading-relaxed text-ink-soft">
                    <MapPinIcon width={16} height={16} className="mt-1 shrink-0 text-brand-600" />
                    {address}
                  </p>
                ) : null}
              </address>
            ) : null}
            {socialLinks.length ? (
              <div className="mt-6">
                <p className={`${headingClass} mb-3`}>تابعونا</p>
                <SocialLinks links={socialLinks} />
              </div>
            ) : null}
          </div>

          <nav aria-labelledby="footer-browse">
            <h2 id="footer-browse" className={headingClass}>
              تصفّح
            </h2>
            <ul className="mt-2">
              {[pageLinks.home, pageLinks.articles, pageLinks.picks].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {categories.length ? (
            <nav aria-labelledby="footer-sections" className="order-last col-span-2 lg:order-none lg:col-span-1">
              <h2 id="footer-sections" className={headingClass}>
                أقسام مختارة
              </h2>
              <ul className="mt-2 grid grid-cols-2 gap-x-6 lg:grid-cols-1">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link href={routes.category(category.slug)} className={linkClass}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <nav aria-labelledby="footer-magazine">
            <h2 id="footer-magazine" className={headingClass}>
              المجلّة
            </h2>
            <ul className="mt-2">
              {[pageLinks.about, pageLinks.contact, pageLinks.saved].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                {/* A feed, not a page: a plain link so the browser requests the XML directly. */}
                <a href={routes.feed()} className={linkClass}>
                  <RssIcon width={16} height={16} className="text-brand-600" />
                  خلاصة RSS
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-site py-5">
          <p className="text-center text-meta text-muted sm:text-start">© {year} مجلة رسالة الكلمة. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
