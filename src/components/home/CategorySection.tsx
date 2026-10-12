import { ArticleCard } from '@/components/ArticleCard';
import { routes } from '@/lib/routes';
import type { HomeCategorySection } from './data';
import { HomeSection } from './HomeSection';
import { cardRowClass, cardRowItemClass, RULED_ITEM } from './styles';
import { WideCard } from './WideCard';

/**
 * One of the editorial sections configured in `homeSections` (site.ts):
 *  - feature: a large overlay story with up to three stories beside it (two
 *             stories side by side, or one wide card, when the category is short)
 *  - grid:    four standard cards (a swipeable row on phones)
 *  - list:    a compact two-column list
 */
export function CategorySection({ section }: { section: HomeCategorySection }) {
  return (
    <HomeSection id={`home-section-${section.key}`} title={section.title} description={section.description} href={routes.category(section.category.slug)}>
      {section.variant === 'feature' ? <FeatureLayout section={section} /> : section.variant === 'list' ? <ListLayout section={section} /> : <GridLayout section={section} />}
    </HomeSection>
  );
}

function FeatureLayout({ section }: { section: HomeCategorySection }) {
  const [first, ...rest] = section.items;
  if (!rest.length) return <WideCard article={first} sizes="(min-width: 640px) 42vw, 100vw" />;
  if (rest.length === 1) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
        {section.items.map((article) => (
          <ArticleCard key={article.id} article={article} variant="overlay" sizes="(min-width: 1280px) 590px, (min-width: 640px) 50vw, 100vw" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <ArticleCard article={first} variant="overlay" sizes="(min-width: 1280px) 690px, (min-width: 1024px) 58vw, 100vw" className="lg:col-span-7" />
      <ul className="card flex flex-col justify-center px-5 sm:px-6 lg:col-span-5">
        {rest.map((article) => (
          <li key={article.id} className="border-b border-line py-5 last:border-b-0">
            <ArticleCard article={article} variant="horizontal" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function GridLayout({ section }: { section: HomeCategorySection }) {
  return (
    <ul className={cardRowClass(section.items.length, 'sm:grid-cols-2 lg:grid-cols-4')}>
      {section.items.map((article) => (
        <li key={article.id} className={cardRowItemClass(section.items.length)}>
          <ArticleCard article={article} />
        </li>
      ))}
    </ul>
  );
}

function ListLayout({ section }: { section: HomeCategorySection }) {
  return (
    <div className="card px-5 py-1 sm:px-8 sm:py-2">
      <ul className="grid gap-x-12 md:grid-cols-2">
        {section.items.map((article) => (
          <li key={article.id} className={RULED_ITEM}>
            <ArticleCard article={article} variant="compact" />
          </li>
        ))}
      </ul>
    </div>
  );
}
