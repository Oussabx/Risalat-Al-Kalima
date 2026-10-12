import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArticleView, type ArticleViewData } from '@/components/article/ArticleView';
import { StaticPageView } from '@/components/StaticPageView';
import { decodeSlug, stripHtml, truncate } from '@/lib/arabic';
import { getAdjacent, getArticle, getIdentity, getPage, getRelated, listArticles, type Article, type ArticleSummary } from '@/lib/content';
import { absoluteUrl, routes } from '@/lib/routes';
import { site } from '@/lib/site';

/** Articles and WordPress pages share the root permalink structure (/{slug}/). */

export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const { items } = await listArticles({ perPage: 12 });
    return items.map((article) => ({ slug: article.slug }));
  } catch (error) {
    console.error('[article] static params', (error as Error).message);
    return [];
  }
}

async function resolve(params: Props['params']) {
  const slug = decodeSlug((await params).slug);
  const article = await getArticle(slug);
  if (article) return { article, page: null };
  // The WordPress About/Contact pages live at /about/ and /contact/ here; never serve them twice.
  if (slug === site.aboutPageSlug) permanentRedirect(routes.about());
  if (slug === site.contactPageSlug) permanentRedirect(routes.contact());
  const page = await getPage(slug);
  return { article: null, page };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { article, page } = await resolve(params);

  if (article) {
    const url = routes.article(article.slug);
    const description = article.excerpt || site.shortDescription;
    const images = article.image ? [{ url: article.image.src, width: article.image.width, height: article.image.height, alt: article.image.alt }] : undefined;
    return {
      title: article.title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'article',
        siteName: site.fullName,
        locale: site.locale,
        url,
        title: article.title,
        description,
        images,
        publishedTime: article.date,
        modifiedTime: article.modified || article.date,
        authors: [article.author.slug ? absoluteUrl(routes.author(article.author.slug), site.url) : article.author.name],
        section: article.categories[0]?.name,
        tags: article.tags.map((t) => t.name),
      },
      twitter: { card: 'summary_large_image', title: article.title, description, images: article.image ? [article.image.src] : undefined },
    };
  }

  if (page) {
    const url = routes.article(page.slug);
    const description = truncate(stripHtml(page.contentHtml), 160) || site.shortDescription;
    return {
      title: page.title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'website',
        siteName: site.fullName,
        locale: site.locale,
        url,
        title: page.title,
        description,
        images: page.image ? [{ url: page.image.src, alt: page.image.alt }] : undefined,
      },
    };
  }

  return {};
}

/** Secondary blocks must never take the article down with them. */
async function settle<T>(label: string, promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(`[article] ${label}`, (error as Error).message);
    return fallback;
  }
}

async function loadArticleView(article: Article): Promise<ArticleViewData> {
  const [identity, adjacent, moreByAuthor] = await Promise.all([
    settle('identity', getIdentity(), { name: site.fullName, description: site.shortDescription }),
    settle('adjacent', getAdjacent(article), { previous: null, next: null }),
    settle(
      'author articles',
      listArticles({ authorId: article.author.id, exclude: [article.id], perPage: 3 }).then((r) => r.items),
      [] as ArticleSummary[],
    ),
  ]);
  const { previous, next } = adjacent;
  // Nothing already linked on the page (previous/next, the author's list) is repeated in the related cards.
  const exclude = [previous?.id, next?.id, ...moreByAuthor.map((a) => a.id)].filter((id): id is number => typeof id === 'number');
  const related = await settle('related', getRelated(article, 4, exclude), [] as ArticleSummary[]);
  return { article, identity, previous, next, moreByAuthor, related };
}

export default async function SlugPage({ params }: Props) {
  const { article, page } = await resolve(params);
  if (article) {
    const data = await loadArticleView(article);
    return <ArticleView {...data} />;
  }
  if (page) return <StaticPageView page={page} />;
  notFound();
}
