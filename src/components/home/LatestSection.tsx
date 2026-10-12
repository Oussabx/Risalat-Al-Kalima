import { ArticleCard } from '@/components/ArticleCard';
import { Reveal } from '@/components/Reveal';
import type { ArticleSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { HomeSection } from './HomeSection';
import { cardRowClass, cardRowItemClass } from './styles';

/** «جديد المجلّة»: the newest articles after the hero, four to a row on desktop and swipeable on phones. */
export function LatestSection({ articles }: { articles: ArticleSummary[] }) {
  return (
    <HomeSection
      id="home-latest"
      title="جديد المجلّة"
      description="أحدث ما نُشر في المجلّة من مقالات."
      href={routes.articles()}
      linkLabel="كل المقالات"
      revealBody={false}
    >
      <ul className={cardRowClass(articles.length, 'sm:grid-cols-2 lg:grid-cols-4')}>
        {articles.map((article, i) => (
          <Reveal as="li" key={article.id} delay={(i % 4) * 80} className={cardRowItemClass(articles.length)}>
            <ArticleCard article={article} excerpt />
          </Reveal>
        ))}
      </ul>
    </HomeSection>
  );
}
