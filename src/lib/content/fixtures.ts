import { readingMinutes, stripHtml, truncate } from '@/lib/arabic';
import { site } from '@/lib/site';
import { fixtureArticles, fixtureAuthors, fixtureCategoryNames, placeholderBody } from './fixtures-data';
import type { Author, ContentSource, Paged, Post, PostQuery, PostSummary, SearchDoc, Term } from './types';

/** In-memory preview source. See fixtures-data.ts for what is verified vs. placeholder. */

const toSlug = (name: string) => name.trim().replace(/\s+/g, '-');

const categories: Term[] = fixtureCategoryNames.map((name, i) => ({
  id: 100 + i,
  name,
  slug: toSlug(name),
  description: undefined,
}));

const tagNames = [...new Set(fixtureArticles.flatMap((a) => a.tags ?? []))];
const tags: Term[] = tagNames.map((name, i) => ({ id: 500 + i, name, slug: toSlug(name) }));

const authors: Author[] = fixtureAuthors.map((a, i) => ({ id: 10 + i, name: a.name, slug: a.slug }));

const posts: Post[] = fixtureArticles.map((a, i) => {
  const html = placeholderBody(a.title);
  const text = stripHtml(html);
  const cats = a.categories.map((n) => categories.find((c) => c.name === n)!).filter(Boolean);
  return {
    id: 1000 + i,
    slug: a.slug,
    title: a.title,
    excerpt: truncate(text.replace(/^نص معاينة:\s*/, ''), 150),
    date: a.date,
    modified: a.date,
    author: authors.find((x) => x.name === a.author)!,
    categories: cats,
    tags: (a.tags ?? []).map((n) => tags.find((t) => t.name === n)!),
    image: { src: `/placeholders/cover-${(i % 8) + 1}.svg`, alt: `صورة مؤقتة لمقال ${a.title}`, width: 1200, height: 750, placeholder: true },
    sticky: a.sticky,
    contentHtml: html,
    readingMinutes: readingMinutes(text),
  };
});

for (const c of categories) c.count = posts.filter((p) => p.categories.some((x) => x.id === c.id)).length;
for (const t of tags) t.count = posts.filter((p) => p.tags.some((x) => x.id === t.id)).length;

const summary = (p: Post): PostSummary => {
  const { contentHtml: _content, ...rest } = p;
  void _content;
  return rest;
};

function sorted(list: Post[], sort: PostQuery['sort'] = 'newest') {
  const copy = [...list];
  if (sort === 'title') return copy.sort((a, b) => a.title.localeCompare(b.title, 'ar'));
  copy.sort((a, b) => a.date.localeCompare(b.date));
  return sort === 'oldest' ? copy : copy.reverse();
}

export function createFixtureSource(): ContentSource {
  return {
    kind: 'fixtures',
    async getSiteInfo() {
      // No logo asset is bundled: the real one is read from WordPress.
      return { name: site.name, description: site.description, url: site.url };
    },
    async getPosts(query: PostQuery = {}): Promise<Paged<PostSummary>> {
      const perPage = query.perPage ?? 12;
      const page = Math.max(1, query.page ?? 1);
      let list = posts;
      if (query.categoryId) list = list.filter((p) => p.categories.some((c) => c.id === query.categoryId));
      if (query.categoryIds?.length) list = list.filter((p) => p.categories.some((c) => query.categoryIds!.includes(c.id)));
      if (query.tagId) list = list.filter((p) => p.tags.some((t) => t.id === query.tagId));
      if (query.authorId) list = list.filter((p) => p.author.id === query.authorId);
      if (query.sticky !== undefined) list = list.filter((p) => Boolean(p.sticky) === query.sticky);
      if (query.exclude?.length) list = list.filter((p) => !query.exclude!.includes(p.id));
      const all = sorted(list, query.sort);
      return {
        items: all.slice((page - 1) * perPage, page * perPage).map(summary),
        total: all.length,
        totalPages: Math.ceil(all.length / perPage),
        page,
      };
    },
    async getPostBySlug(slug) {
      return posts.find((p) => p.slug === slug) ?? null;
    },
    async getAdjacentPosts(post) {
      const byDate = sorted(posts, 'oldest');
      const i = byDate.findIndex((p) => p.id === post.id);
      return {
        previous: i > 0 ? summary(byDate[i - 1]) : null,
        next: i >= 0 && i < byDate.length - 1 ? summary(byDate[i + 1]) : null,
      };
    },
    async getPageBySlug() {
      return null;
    },
    async getCategories() {
      return categories.filter((c) => (c.count ?? 0) > 0);
    },
    async getCategoryBySlug(slug) {
      return categories.find((c) => c.slug === slug) ?? null;
    },
    async getTagBySlug(slug) {
      return tags.find((t) => t.slug === slug) ?? null;
    },
    async getAuthorBySlug(slug) {
      return authors.find((a) => a.slug === slug) ?? null;
    },
    async getSearchDocs(): Promise<SearchDoc[]> {
      return sorted(posts).map((p) => ({ post: summary(p), body: stripHtml(p.contentHtml) }));
    },
    async getPostsByIds(ids) {
      return ids.map((id) => posts.find((p) => p.id === id)).filter((p): p is Post => Boolean(p)).map(summary);
    },
  };
}
