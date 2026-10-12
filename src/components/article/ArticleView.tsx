import Link from 'next/link';
import { minutesLabel, readingMinutes } from '@/lib/arabic';
import type { Article, ArticleSummary, SiteIdentity } from '@/lib/content/types';
import type { SavedItem } from '@/lib/client/saved';
import { prepareContent } from '@/lib/html';
import { absoluteUrl, routes } from '@/lib/routes';
import { site } from '@/lib/site';
import { Breadcrumbs, type Crumb } from '../Breadcrumbs';
import { ClockIcon } from '../icons';
import { JsonLd } from '../JsonLd';
import { AdjacentNav } from './AdjacentNav';
import { ArticleAside } from './ArticleAside';
import { ArticleHero } from './ArticleHero';
import { AuthorBox } from './AuthorBox';
import { MobileActionBar } from './MobileActionBar';
import { ARTICLE_BODY_ID, InlineReadingProgress, TopReadingProgress } from './ReadingProgress';
import { RelatedArticles } from './RelatedArticles';
import { ShareActions } from './ShareActions';
import { TableOfContents } from './TableOfContents';

export type ArticleViewData = {
  article: Article;
  identity: SiteIdentity;
  previous: ArticleSummary | null;
  next: ArticleSummary | null;
  moreByAuthor: ArticleSummary[];
  related: ArticleSummary[];
};

/** Resolves a possibly relative media URL against the site URL (for structured data). */
function absoluteMedia(src: string): string {
  try {
    return new URL(src, site.url).toString();
  } catch {
    return src;
  }
}

function articleJsonLd({ article, identity }: ArticleViewData, url: string) {
  const author = article.author;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title.length > 110 ? `${article.title.slice(0, 109)}…` : article.title,
    description: article.excerpt || undefined,
    image: article.image ? [absoluteMedia(article.image.src)] : undefined,
    datePublished: article.date,
    dateModified: article.modified || article.date,
    author: {
      '@type': 'Person',
      name: author.name,
      url: author.slug ? absoluteUrl(routes.author(author.slug), site.url) : undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: site.fullName,
      url: site.url,
      logo: identity.logo ? { '@type': 'ImageObject', url: absoluteMedia(identity.logo.src) } : undefined,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    inLanguage: 'ar',
    articleSection: article.categories[0]?.name,
    keywords: article.tags.length ? article.tags.map((t) => t.name).join('، ') : undefined,
  };
}

/** The full article page: hero, reading column with sticky sidebar, author, navigation and related articles. */
export function ArticleView(data: ArticleViewData) {
  const { article, previous, next, moreByAuthor, related } = data;
  const { html, headings } = prepareContent(article.contentHtml);
  const category = article.categories[0];
  const minutes = article.readingMinutes > 0 ? article.readingMinutes : readingMinutes(article.contentHtml);
  const shareUrl = absoluteUrl(routes.article(article.slug), site.url);
  const saved: SavedItem = {
    slug: article.slug,
    title: article.title,
    image: article.image?.src,
    category: category?.name,
    date: article.date,
    author: article.author.name,
  };
  const crumbs: Crumb[] = [
    { label: 'المقالات', href: routes.articles() },
    ...(category ? [{ label: category.name, href: routes.category(category.slug) }] : []),
    { label: article.title },
  ];

  return (
    <>
      <TopReadingProgress />

      <article className="bg-surface pt-4 pb-12 sm:pt-6 sm:pb-16">
        <div className="container-site">
          <ArticleHero article={article} />

          {/* Slightly inset from the hero on wide screens, like the design. */}
          <div className="mx-auto max-w-[68rem]">
            <Breadcrumbs items={crumbs} className="mt-4 sm:mt-5" />

            <div className="print-full mt-6 grid gap-10 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12 xl:gap-14">
              <div className="min-w-0 lg:max-w-[46rem]">
                <div className="no-print mb-6 space-y-4 lg:hidden">
                  <p className="flex items-center gap-2 text-meta text-ink-soft">
                    <ClockIcon width={18} height={18} className="shrink-0 text-muted" />
                    مدّة القراءة: {minutesLabel(minutes)}
                  </p>
                  <InlineReadingProgress layout="mobile" />
                  {headings.length ? <TableOfContents headings={headings} variant="collapsible" /> : null}
                </div>

                <div id={ARTICLE_BODY_ID} className="prose-ar" dangerouslySetInnerHTML={{ __html: html }} />

                {article.tags.length ? (
                  <div className="mt-10 border-t border-line pt-6">
                    <h2 className="mb-3 text-base font-semibold text-ink">وسوم المقال</h2>
                    <ul className="flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <li key={tag.id}>
                          <Link href={routes.tag(tag.slug)} className="chip min-h-11">
                            <span aria-hidden="true" className="text-brand-500">
                              #
                            </span>
                            {tag.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <ShareActions url={shareUrl} title={article.title} className={`no-print ${article.tags.length ? 'mt-6' : 'mt-10 border-t border-line pt-6'}`} />

                <div className="no-print mt-10 space-y-6">
                  <AuthorBox author={article.author} more={moreByAuthor} />
                  <AdjacentNav previous={previous} next={next} />
                </div>
              </div>

              <ArticleAside article={article} minutes={minutes} headings={headings} saved={saved} shareUrl={shareUrl} />
            </div>
          </div>
        </div>
      </article>

      {related.length ? (
        <div className="no-print container-site py-12 sm:py-16">
          <RelatedArticles articles={related} viewAllHref={category ? routes.category(category.slug) : routes.articles()} />
        </div>
      ) : null}

      {/* Room for the mobile action bar so it never covers the last cards. */}
      <div aria-hidden="true" className="h-16 lg:hidden print:hidden" />
      <MobileActionBar
        saved={saved}
        shareUrl={shareUrl}
        title={article.title}
        next={next ? { href: routes.article(next.slug), title: next.title } : { href: routes.articles() }}
      />

      <JsonLd data={articleJsonLd(data, shareUrl)} />
    </>
  );
}
