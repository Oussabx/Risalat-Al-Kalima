import type { Metadata } from 'next';
import { EmptyState } from '@/components/EmptyState';
import { CategorySection } from '@/components/home/CategorySection';
import { CtaBanner } from '@/components/home/CtaBanner';
import { loadHomepage } from '@/components/home/data';
import { EditorsPicks } from '@/components/home/EditorsPicks';
import { HomeHero } from '@/components/home/HomeHero';
import { LatestSection } from '@/components/home/LatestSection';
import { MissionCard } from '@/components/home/MissionCard';
import { VideoSection } from '@/components/home/VideoSection';
import { AlertIcon } from '@/components/icons';
import { JsonLd } from '@/components/JsonLd';
import { absoluteUrl, routes } from '@/lib/routes';
import { defaultOpenGraph, feedAlternates, site } from '@/lib/site';

export const revalidate = 600;

/** The home page owns the site-root canonical and og:url (the root layout sets none, so other pages never inherit '/'). */
export const metadata: Metadata = {
  alternates: { canonical: '/', types: feedAlternates },
  openGraph: { ...defaultOpenGraph, url: '/' },
};

export default async function HomePage() {
  const home = await loadHomepage();
  const listed = home.lead ? [home.lead, ...home.rail, ...home.latest] : [];

  return (
    <>
      <h1 className="sr-only">{site.fullName}</h1>
      <div className="flex flex-col gap-14 pb-16 sm:gap-20 sm:pb-20">
        {home.lead ? (
          <HomeHero lead={home.lead} rail={home.rail} />
        ) : (
          <div className="container-site pt-10 sm:pt-14">
            {home.unavailable ? (
              <EmptyState
                icon={<AlertIcon width={26} height={26} />}
                title="تعذّر تحميل المقالات حاليًّا"
                description="تعذّر الاتصال بمصدر المحتوى. يرجى المحاولة مجدّدًا بعد قليل."
              />
            ) : (
              <EmptyState title="لا توجد مقالات منشورة بعد" description="ستظهر هنا مقالات المجلّة فور نشرها." />
            )}
          </div>
        )}

        {home.latest.length ? <LatestSection articles={home.latest} /> : null}
        {home.picks.length ? <EditorsPicks articles={home.picks} /> : null}
        {home.sections.map((section) => (
          <CategorySection key={section.key} section={section} />
        ))}
        <MissionCard />
        {home.video ? <VideoSection category={home.video.category} articles={home.video.items} /> : null}
        <CtaBanner logo={home.identity.logo} />
      </div>

      {listed.length ? (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'مقالات الصفحة الرئيسيّة',
            itemListElement: listed.map((article, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: absoluteUrl(routes.article(article.slug), site.url),
              name: article.title,
            })),
          }}
        />
      ) : null}
    </>
  );
}
