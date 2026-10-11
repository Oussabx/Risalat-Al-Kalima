import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ArrowLeft } from '@/components/icons';
import { content } from '@/lib/content';
import { prepareContent } from '@/lib/html';
import { routes } from '@/lib/routes';
import { site } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'من نحن',
  description: site.description,
  alternates: { canonical: routes.about },
};

/**
 * Uses the «من نحن» page from WordPress when it exists. Otherwise it shows the
 * magazine's own statements as published on risalatalkalima.com (quoted, not
 * paraphrased).
 */
const facts = [
  { value: 'فصليّة', label: 'مجلّة مسيحيّة تصدر كلّ ثلاثة أشهر' },
  { value: '40', label: 'متطوّعًا يُعاونون رئيس التحرير' },
  { value: '70%', label: 'من المقالات للكتّاب الوطنيّين' },
  { value: '30%', label: 'للترجمة' },
];

export default async function AboutPage() {
  const page = await content.getPageBySlug(process.env.ABOUT_PAGE_SLUG ?? 'من-نحن').catch(() => null);

  return (
    <div className="container-page pt-6 sm:pt-8">
      <Breadcrumbs items={[{ label: 'من نحن' }]} />

      <section className="relative mt-6 overflow-hidden rounded-[1.5rem] bg-gradient-to-bl from-brand-700 via-brand-600 to-brand-800 px-6 py-14 text-white sm:px-12 sm:py-20" data-reveal>
        <div aria-hidden className="pointer-events-none absolute -end-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <p className="relative text-sm font-semibold text-brand-100">من نحن</p>
        <h1 className="relative mt-2 text-3xl font-bold leading-tight sm:text-5xl">رسالة الكلمة</h1>
        <p className="relative mt-5 max-w-3xl text-lg leading-9 text-white/90 sm:text-xl sm:leading-10">{site.description}</p>
      </section>

      {page ? (
        <div className="prose-ar mx-auto mt-12 max-w-3xl" dangerouslySetInnerHTML={{ __html: prepareContent(page.contentHtml).html }} />
      ) : (
        <>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((f) => (
              <li key={f.label} className="card p-6" data-reveal>
                <p className="text-3xl font-bold text-brand-600">{f.value}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{f.label}</p>
              </li>
            ))}
          </ul>

          <div className="mx-auto mt-14 max-w-3xl space-y-10">
            <section data-reveal>
              <h2 className="text-2xl font-bold text-ink">هويّتنا</h2>
              <div className="prose-ar mt-4">
                <p>
                  المجلّة مُرخّصة من وزارة الإعلام اللّبنانية وتصدر عن كنيسة لبنان الكتابيّة الإنجيليّة. مديرها المسؤول ورئيس تحريرها القسّيس د. ادكار طرابلسي، ويُعاونه فريق من 40 متطوّعًا.
                </p>
                <p>تُخصّص المجلّة 70% من مقالاتها للكتّاب الوطنيّين وتترك 30% للترجمة.</p>
              </div>
            </section>
            <section data-reveal>
              <h2 className="text-2xl font-bold text-ink">إيماننا</h2>
              <div className="prose-ar mt-4">
                <blockquote>
                  <p>تلتزم «رسالة الكلمة» الإيمان الإنجيليّ.</p>
                </blockquote>
              </div>
            </section>
          </div>
        </>
      )}

      <div className="mx-auto mt-14 flex max-w-3xl flex-col gap-3 sm:flex-row">
        <Link href={routes.articles()} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-7 font-semibold text-white transition hover:bg-brand-700">
          اقرأ المقالات <ArrowLeft size={18} />
        </Link>
        <Link href={routes.contact} className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-white px-7 font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700">
          تواصل معنا
        </Link>
      </div>
    </div>
  );
}
