import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleView } from '@/components/article/ArticleView';
import { StaticPageView } from '@/components/StaticPageView';
import { decodeSlug, stripHtml, truncate } from '@/lib/arabic';
import { content, getPostBySlug, getSiteInfo } from '@/lib/content';
import type { Post, PostSummary } from '@/lib/content/types';
import { routes } from '@/lib/routes';
import { site } from '@/lib/site';

type Params = Promise<{ slug: string }>;

export const revalidate = 600;

async function resolve(rawSlug: string) {
  const slug = decodeSlug(rawSlug);
  const post = await getPostBySlug(slug);
  if (post) return { kind: 'post' as const, post };
  const page = await content.getPageBySlug(slug);
  return page ? { kind: 'page' as const, page } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const found = await resolve((await params).slug);
  if (!found) return { title: 'الصفحة غير موجودة' };
  if (found.kind === 'page') {
    return { title: found.page.title, description: truncate(found.page.excerpt || stripHtml(found.page.contentHtml), 160), alternates: { canonical: routes.post(found.page.slug) } };
  }
  const { post } = found;
  const description = truncate(post.excerpt, 170);
  return {
    title: post.title,
    description,
    authors: [{ name: post.author.name, url: post.author.slug ? routes.author(post.author.slug) : undefined }],
    keywords: post.tags.map((t) => t.name),
    alternates: { canonical: routes.post(post.slug) },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url: routes.post(post.slug),
      publishedTime: post.date,
      modifiedTime: post.modified,
      authors: [post.author.name],
      section: post.categories[0]?.name,
      tags: post.tags.map((t) => t.name),
      images: post.image && !post.image.placeholder ? [{ url: post.image.src, width: post.image.width, height: post.image.height, alt: post.image.alt }] : undefined,
    },
    twitter: { card: 'summary_large_image', title: post.title, description },
  };
}

async function relatedFor(post: Post, avoid: number[]): Promise<PostSummary[]> {
  const exclude = [post.id, ...avoid];
  const out: PostSummary[] = [];
  const add = (items: PostSummary[]) => {
    for (const p of items) if (!exclude.includes(p.id) && !out.some((o) => o.id === p.id)) out.push(p);
  };
  if (post.categories[0]) add((await content.getPosts({ categoryId: post.categories[0].id, perPage: 8, exclude })).items);
  if (out.length < 4 && post.tags[0]) add((await content.getPosts({ tagId: post.tags[0].id, perPage: 8, exclude })).items);
  if (out.length < 4) add((await content.getPosts({ perPage: 8, exclude })).items);
  return out.slice(0, 4);
}

export default async function SlugPage({ params }: { params: Params }) {
  const found = await resolve((await params).slug);
  if (!found) notFound();
  if (found.kind === 'page') return <StaticPageView page={found.page} />;

  const { post } = found;
  const [{ previous, next }, byAuthorPage, info] = await Promise.all([
    content.getAdjacentPosts(post),
    post.author.id ? content.getPosts({ authorId: post.author.id, perPage: 3, exclude: [post.id] }) : Promise.resolve({ items: [] as PostSummary[] }),
    getSiteInfo(),
  ]);
  const byAuthor = byAuthorPage.items;
  const related = await relatedFor(post, [previous?.id, next?.id, ...byAuthor.map((p) => p.id)].filter((x): x is number => Boolean(x)));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    inLanguage: 'ar',
    datePublished: post.date,
    dateModified: post.modified,
    mainEntityOfPage: `${site.url}${routes.post(post.slug)}`,
    image: post.image && !post.image.placeholder ? [post.image.src] : undefined,
    articleSection: post.categories.map((c) => c.name),
    keywords: post.tags.map((t) => t.name).join('، '),
    wordCount: undefined,
    author: { '@type': 'Person', name: post.author.name, url: post.author.slug ? `${site.url}${routes.author(post.author.slug)}` : undefined },
    publisher: {
      '@type': 'Organization',
      name: site.fullName,
      url: site.url,
      logo: info.logo ? { '@type': 'ImageObject', url: info.logo.src } : undefined,
    },
  };

  return (
    <>
      <ArticleView post={post} previous={previous} next={next} related={related} byAuthor={byAuthor} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
