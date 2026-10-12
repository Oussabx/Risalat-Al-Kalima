import type { Metadata } from 'next';
import Link from 'next/link';
import { AboutFacts } from '@/components/about/AboutFacts';
import { AboutHero } from '@/components/about/AboutHero';
import { AboutSections } from '@/components/about/AboutSections';
import { ArrowLeftIcon, MailIcon } from '@/components/icons';
import { JsonLd } from '@/components/JsonLd';
import { PostImage } from '@/components/PostImage';
import { getNavigation, getPage, type PageContent } from '@/lib/content';
import { prepareContent } from '@/lib/html';
import { absoluteUrl, routes } from '@/lib/routes';
import { aboutFacts, site } from '@/lib/site';

export const revalidate = 600;

const TITLE = 'من نحن';

export const metadata: Metadata = {
  title: TITLE,
  description: site.description,
  alternates: { canonical: routes.about() },
  openGraph: { type: 'website', siteName: site.fullName, locale: site.locale, url: routes.about(), title: `${TITLE} — ${site.fullName}`, description: site.description },
};

async function loadPage(): Promise<PageContent | null> {
  try {
    return await getPage(site.aboutPageSlug);
  } catch (error) {
    console.error('[about] page', (error as Error).message);
    return null;
  }
}

export default async function AboutPage() {
  const [page, navigation] = await Promise.all([loadPage(), getNavigation()]);
  const pageHtml = page ? prepareContent(page.contentHtml).html.trim() : '';

  return (
    <>
      <AboutHero mission={aboutFacts.mission} />

      {pageHtml ? (
        <section aria-label={page?.title || TITLE} className="container-site pt-12 sm:pt-16">
          <div className="card mx-auto max-w-[46rem] px-5 py-7 sm:px-10 sm:py-10">
            {page?.image ? (
              <PostImage
                image={page.image}
                sizes="(min-width: 800px) 656px, calc(100vw - 4.5rem)"
                ratio="aspect-[16/9]"
                className="mb-8 rounded-xl"
              />
            ) : null}
            <div className="prose-ar" dangerouslySetInnerHTML={{ __html: pageHtml }} />
          </div>
        </section>
      ) : null}

      <AboutFacts points={aboutFacts.points} />

      <AboutSections groups={navigation.groups} />

      <section aria-labelledby="about-cta" className="container-site py-12 sm:py-16">
        <div className="surface-soft flex flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-12">
          <h2 id="about-cta" className="text-h2 font-bold text-ink sm:text-[1.5rem]">
            ابدأ القراءة أو راسلنا
          </h2>
          <p className="mt-2 max-w-xl text-base leading-[1.9] text-ink-soft">تصفّح أرشيف المقالات، أو اكتب إلى فريق التحرير بسؤالك أو ملاحظتك.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={routes.articles()} className="btn-primary min-h-12 px-7">
              تصفّح المقالات
              <ArrowLeftIcon width={18} height={18} />
            </Link>
            <Link href={routes.contact()} className="btn-outline min-h-12 px-7">
              <MailIcon width={18} height={18} />
              اتصل بنا
            </Link>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: TITLE,
          url: absoluteUrl(routes.about(), site.url),
          inLanguage: 'ar',
          description: site.description,
          about: { '@type': 'Periodical', name: site.fullName, url: site.url, inLanguage: 'ar' },
        }}
      />
    </>
  );
}
