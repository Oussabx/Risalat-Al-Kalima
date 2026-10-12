import { describe, expect, it } from 'vitest';
import { formatDate, isoDate } from '@/lib/arabic';
import { fixtureArticles } from './fixtures-data';
import { fixtureStore, fixturesSource as source } from './fixtures';

const REFERENCE_SLUG = 'فرح-تحت-المجهر';
const { articles, categories, tags, authors } = fixtureStore;
const TOTAL = articles.length;

const byName = <T extends { name: string }>(list: T[], name: string): T => {
  const found = list.find((x) => x.name === name);
  if (!found) throw new Error(`missing fixture: ${name}`);
  return found;
};

describe('fixtures data integrity', () => {
  it('has one article per fixture entry, with unique ids and slugs', () => {
    expect(TOTAL).toBe(fixtureArticles.length);
    expect(new Set(articles.map((a) => a.id)).size).toBe(TOTAL);
    expect(new Set(articles.map((a) => a.slug)).size).toBe(TOTAL);
  });

  it('is sorted newest first', () => {
    const dates = articles.map((a) => a.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it('resolves every fixture author and category', () => {
    for (const f of fixtureArticles) {
      const a = articles.find((x) => x.slug === f.slug)!;
      expect(a.author.name).toBe(f.author);
      expect(a.categories.map((c) => c.name)).toEqual(f.categories);
      expect(a.tags.map((t) => t.name)).toEqual(f.tags ?? []);
    }
  });

  it('marks every image as a placeholder', () => {
    for (const a of articles) {
      expect(a.image, a.slug).toBeDefined();
      expect(a.image!.placeholder, a.slug).toBe(true);
      expect(a.image!.alt).toContain('مؤقتة');
    }
  });

  it('labels every placeholder body as preview text', () => {
    for (const a of articles) {
      expect(a.contentHtml, a.slug).toContain('نصّ تجريبيّ');
      for (const src of a.contentHtml.matchAll(/<img[^>]*src="([^"]+)"/g)) expect(src[1]).toMatch(/^\/placeholders\//);
    }
  });

  it('exposes UTC publication and update instants for feeds and structured data', () => {
    for (const a of articles) {
      expect(a.published, a.slug).toMatch(/Z$/);
      expect(Number.isNaN(Date.parse(a.published)), a.slug).toBe(false);
      expect(isoDate(a.published)).toBe(isoDate(a.date));
      expect(Date.parse(a.updated)).toBeGreaterThanOrEqual(Date.parse(a.published));
    }
  });

  it('category and tag counts match the articles', () => {
    for (const c of categories) expect(c.count, c.name).toBe(articles.filter((a) => a.categories.some((x) => x.id === c.id)).length);
    for (const t of tags) expect(t.count, t.name).toBe(articles.filter((a) => a.tags.some((x) => x.id === t.id)).length);
  });
});

describe('the reference article', () => {
  it('matches the verified facts', async () => {
    const article = await source.getArticle(REFERENCE_SLUG);
    expect(article).not.toBeNull();
    expect(article!.title).toBe('فرح تحت المجهر');
    expect(article!.author.name).toBe('حنان زهر الدّين');
    expect(isoDate(article!.date)).toBe('2026-09-08');
    expect(formatDate(article!.date)).toBe('8 أيلول 2026');
    expect(article!.categories.map((c) => c.name)).toEqual(['تأملات']);
    expect(article!.tags.map((t) => t.name).sort()).toEqual(['تأملات', 'رسالة الكلمة', 'سعادة', 'عبرة الحياة', 'فرح'].sort());
  });

  it('has the verified previous and next articles', async () => {
    const article = (await source.getArticle(REFERENCE_SLUG))!;
    const { previous, next } = await source.getAdjacent(article);
    expect(previous?.title).toBe('طوبى للودعاء: قوّة تحت السّيطرة وميراث أبديّ');
    expect(next?.title).toBe('الإدارة بالخوف أم بالثّقة؟ سرّ القائد الحكيم');
    expect(previous).not.toHaveProperty('contentHtml');
    expect(next).not.toHaveProperty('contentHtml');
  });

  it('returns null for an unknown slug', async () => {
    expect(await source.getArticle('لا-يوجد')).toBeNull();
  });
});

describe('getAdjacent edges', () => {
  it('the newest article has no next, the oldest has no previous', async () => {
    const newest = await source.getAdjacent(articles[0]);
    expect(newest.next).toBeNull();
    expect(newest.previous?.id).toBe(articles[1].id);
    const oldest = await source.getAdjacent(articles[TOTAL - 1]);
    expect(oldest.previous).toBeNull();
    expect(oldest.next?.id).toBe(articles[TOTAL - 2].id);
  });
});

describe('listArticles honours ArticleQuery', () => {
  it('defaults to page 1, 12 per page, newest first', async () => {
    const res = await source.listArticles({});
    expect(res.page).toBe(1);
    expect(res.perPage).toBe(12);
    expect(res.total).toBe(TOTAL);
    expect(res.totalPages).toBe(Math.ceil(TOTAL / 12));
    expect(res.items.map((a) => a.id)).toEqual(articles.slice(0, 12).map((a) => a.id));
    expect(res.items[0]).not.toHaveProperty('contentHtml');
  });

  it('paginates with correct totals', async () => {
    const perPage = 5;
    const pages = Math.ceil(TOTAL / perPage);
    const seen: number[] = [];
    for (let page = 1; page <= pages; page++) {
      const res = await source.listArticles({ page, perPage });
      expect(res.total).toBe(TOTAL);
      expect(res.totalPages).toBe(pages);
      expect(res.page).toBe(page);
      seen.push(...res.items.map((a) => a.id));
    }
    expect(seen).toEqual(articles.map((a) => a.id));
    expect((await source.listArticles({ page: pages + 1, perPage })).items).toEqual([]);
    expect((await source.listArticles({ page: 0, perPage })).page).toBe(1);
  });

  it('filters by category (any of several ids)', async () => {
    const taamulat = byName(categories, 'تأملات');
    const res = await source.listArticles({ categoryIds: [taamulat.id], perPage: 100 });
    expect(res.total).toBe(taamulat.count);
    expect(res.total).toBeGreaterThan(0);
    for (const a of res.items) expect(a.categories.some((c) => c.id === taamulat.id)).toBe(true);

    const bible = byName(categories, 'الكتاب المقدس');
    const both = await source.listArticles({ categoryIds: [taamulat.id, bible.id], perPage: 100 });
    const expected = articles.filter((a) => a.categories.some((c) => c.id === taamulat.id || c.id === bible.id)).length;
    expect(both.total).toBe(expected);
    expect(both.total).toBeLessThan(taamulat.count + bible.count); // «طوبى للودعاء» is in both and counted once
  });

  it('filters by tag', async () => {
    const joy = byName(tags, 'فرح');
    const res = await source.listArticles({ tagId: joy.id, perPage: 100 });
    expect(res.total).toBe(joy.count);
    expect(res.items.map((a) => a.slug)).toContain(REFERENCE_SLUG);
    for (const a of res.items) expect(a.tags.some((t) => t.id === joy.id)).toBe(true);
  });

  it('filters by author', async () => {
    const hanan = byName(authors, 'حنان زهر الدّين');
    const res = await source.listArticles({ authorId: hanan.id, perPage: 100 });
    expect(res.total).toBe(articles.filter((a) => a.author.id === hanan.id).length);
    for (const a of res.items) expect(a.author.name).toBe('حنان زهر الدّين');
  });

  it('returns only sticky articles when asked', async () => {
    const res = await source.listArticles({ sticky: true, perPage: 100 });
    expect(res.total).toBe(fixtureArticles.filter((f) => f.sticky).length);
    expect(res.total).toBeGreaterThan(0);
    for (const a of res.items) expect(a.sticky).toBe(true);
  });

  it('excludes and includes by id', async () => {
    const [first, second, third] = articles;
    const excluded = await source.listArticles({ exclude: [first.id, second.id], perPage: 100 });
    expect(excluded.total).toBe(TOTAL - 2);
    expect(excluded.items.map((a) => a.id)).not.toContain(first.id);
    expect(excluded.items[0].id).toBe(third.id);

    const included = await source.listArticles({ include: [third.id, first.id], perPage: 100 });
    expect(included.items.map((a) => a.id).sort()).toEqual([first.id, third.id].sort());

    const both = await source.listArticles({ include: [first.id, second.id], exclude: [first.id] });
    expect(both.items.map((a) => a.id)).toEqual([second.id]);
  });

  it('orders oldest first', async () => {
    const res = await source.listArticles({ order: 'oldest', perPage: 100 });
    expect(res.items.map((a) => a.id)).toEqual([...articles].reverse().map((a) => a.id));
  });

  it('orders by title (Arabic collation)', async () => {
    const res = await source.listArticles({ order: 'title', perPage: 100 });
    const titles = res.items.map((a) => a.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'ar')));
    expect(res.total).toBe(TOTAL);
  });

  it('newest order does not mutate the store between queries', async () => {
    await source.listArticles({ order: 'oldest' });
    await source.listArticles({ order: 'title' });
    const res = await source.listArticles({ perPage: 100 });
    expect(res.items.map((a) => a.id)).toEqual(articles.map((a) => a.id));
  });

  it('searches title and body text ignoring diacritics', async () => {
    const res = await source.listArticles({ search: 'فرح تحت المجهر', perPage: 100 });
    expect(res.items.map((a) => a.slug)).toContain(REFERENCE_SLUG);
    const diacritics = await source.listArticles({ search: 'فَرَح تحت المِجهر', perPage: 100 });
    expect(diacritics.items.map((a) => a.slug)).toContain(REFERENCE_SLUG);
  });

  it('combines filters', async () => {
    const taamulat = byName(categories, 'تأملات');
    const hanan = byName(authors, 'حنان زهر الدّين');
    const res = await source.listArticles({ categoryIds: [taamulat.id], authorId: hanan.id, perPage: 100 });
    expect(res.items.length).toBeGreaterThan(0);
    for (const a of res.items) {
      expect(a.author.id).toBe(hanan.id);
      expect(a.categories.some((c) => c.id === taamulat.id)).toBe(true);
    }
  });
});

describe('lookups', () => {
  it('finds tags and authors by slug', async () => {
    const joy = byName(tags, 'فرح');
    expect(await source.getTag(joy.slug)).toEqual(joy);
    expect(await source.getTag('missing')).toBeNull();
    expect((await source.getAuthor('risala210'))?.name).toBe('بيتر ماكنتاير');
    expect(await source.getAuthor('missing')).toBeNull();
  });

  it('search index and sitemap cover every article', async () => {
    const index = await source.getSearchIndex();
    expect(index).toHaveLength(TOTAL);
    expect(index[0]).not.toHaveProperty('contentHtml');
    const sitemap = await source.getSitemapEntries();
    expect(sitemap.articles.map((e) => e.slug).sort()).toEqual(articles.map((a) => a.slug).sort());
  });

  it('has no CMS pages in preview', async () => {
    expect(await source.getPage('about')).toBeNull();
  });
});
