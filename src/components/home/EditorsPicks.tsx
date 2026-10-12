import { Reveal } from '@/components/Reveal';
import { SectionHeader } from '@/components/SectionHeader';
import type { ArticleSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { WideCard } from './WideCard';

/**
 * «مختارات المحرّر»: articles the editors pinned in WordPress (sticky posts).
 * This is an editorial selection, not a popularity ranking, so it is never numbered.
 */
export function EditorsPicks({ articles }: { articles: ArticleSummary[] }) {
  return (
    <section aria-labelledby="home-picks" className="container-site">
      <Reveal className="surface-soft rounded-[1.5rem] px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
        <SectionHeader id="home-picks" title="مختارات المحرّر" description="مقالات اختارتها هيئة التحرير" href={routes.picks()} linkLabel="كل المختارات" />
        <ul className={`grid gap-5 lg:gap-6 ${articles.length > 1 ? 'lg:grid-cols-2' : ''}`}>
          {articles.map((article) => (
            <li key={article.id}>
              <WideCard article={article} sizes={articles.length > 1 ? undefined : '(min-width: 640px) 42vw, 100vw'} />
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
