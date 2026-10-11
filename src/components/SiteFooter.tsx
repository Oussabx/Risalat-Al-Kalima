import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { NewsletterForm } from '@/components/NewsletterForm';
import { socialIcons } from '@/components/icons';
import { categoriesByName, getSiteInfo } from '@/lib/content';
import { routes } from '@/lib/routes';
import { site, socialLinks } from '@/lib/site';

const footerCategories = [
  'تأملات',
  'الكتاب المقدس',
  'اللاهوت النظامي',
  'الحياة والعائلة المسيحية',
  'الكنيسة',
  'تاريخ وشخصيات',
  'مقابلة',
  'كتب مسيحية',
];

export async function SiteFooter() {
  const [info, cats] = await Promise.all([getSiteInfo(), categoriesByName(footerCategories)]);
  const year = new Date().getFullYear();

  return (
    <footer role="contentinfo" className="mt-20 border-t border-line bg-white">
      <div className="container-page grid gap-12 py-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Link href="/" aria-label="الصفحة الرئيسية" className="inline-block">
            <Logo logo={info.logo} className="h-11" />
          </Link>
          <p className="mt-5 max-w-sm text-[0.95rem] leading-8 text-muted">{site.description}</p>
          {socialLinks.length > 0 && (
            <ul className="mt-6 flex gap-2">
              {socialLinks.map((s) => {
                const Icon = socialIcons[s.key];
                return (
                  <li key={s.key}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-soft transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <Icon size={17} />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <nav aria-label="أقسام المجلة" className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-ink">الأقسام</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.95rem] lg:grid-cols-1">
            {cats.map((c) => (
              <li key={c.id}>
                <Link href={routes.category(c.slug)} className="text-muted transition hover:text-brand-700">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="روابط" className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">المجلة</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.95rem] lg:grid-cols-1">
            {[
              ['الرئيسية', routes.home],
              ['كل المقالات', routes.articles()],
              ['من نحن', routes.about],
              ['اتصل بنا', routes.contact],
              ['المقالات المحفوظة', routes.saved],
              ['البحث', routes.search()],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-muted transition hover:text-brand-700">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-ink">النشرة البريديّة</h2>
          <p className="mt-4 text-[0.95rem] leading-7 text-muted">جديد المجلّة في بريدك، بلا إزعاج.</p>
          <div className="mt-4">
            <NewsletterForm compact />
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.fullName}. جميع الحقوق محفوظة.
          </p>
          <p>مجلّة مُرخّصة من وزارة الإعلام اللبنانيّة</p>
        </div>
      </div>
    </footer>
  );
}
