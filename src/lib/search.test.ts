import { describe, expect, it } from 'vitest';
import type { ArticleSummary } from '@/lib/content/types';
import { rankArticles, scoreArticle } from '@/lib/search';

let nextId = 1;

/** Minimal ArticleSummary factory: neutral fields that never match the test queries. */
function makeArticle(over: { title?: string; author?: string; categories?: string[]; tags?: string[]; excerpt?: string; date?: string; slug?: string } = {}): ArticleSummary {
  const id = nextId++;
  return {
    id,
    slug: over.slug ?? `article-${id}`,
    title: over.title ?? 'عنوان محايد',
    excerpt: over.excerpt ?? 'مقتطف محايد',
    date: over.date ?? '2026-01-01T09:00:00',
    modified: over.date ?? '2026-01-01T09:00:00',
    author: { id: 1, name: over.author ?? 'كاتب مجهول', slug: 'writer', bio: '' },
    categories: (over.categories ?? []).map((name, i) => ({ id: i + 1, name, slug: name, description: '', count: 1, parent: 0 })),
    tags: (over.tags ?? []).map((name, i) => ({ id: 100 + i, name, slug: name, description: '', count: 1 })),
    sticky: false,
    readingMinutes: 3,
  };
}

const slugs = (results: ReturnType<typeof rankArticles>) => results.map((r) => r.article.slug);

describe('rankArticles — field weights', () => {
  it('ranks title > author > terms > excerpt', () => {
    const inExcerpt = makeArticle({ slug: 'excerpt', excerpt: 'حديث عن السلام في القلب' });
    const inTerms = makeArticle({ slug: 'terms', tags: ['السلام'] });
    const inAuthor = makeArticle({ slug: 'author', author: 'سلام خوري' });
    const inTitle = makeArticle({ slug: 'title', title: 'بناء السلام' });
    const none = makeArticle({ slug: 'none' });
    const results = rankArticles([inExcerpt, none, inTerms, inAuthor, inTitle], 'سلام');
    expect(slugs(results)).toEqual(['title', 'author', 'terms', 'excerpt']);
    expect(results[0].score).toBeGreaterThan(results[1].score);
    expect(results[1].score).toBeGreaterThan(results[2].score);
    expect(results[2].score).toBeGreaterThan(results[3].score);
  });

  it('counts category names as terms', () => {
    const a = makeArticle({ slug: 'cat', categories: ['تأملات'] });
    expect(slugs(rankArticles([a], 'تأملات'))).toEqual(['cat']);
  });

  it('prefers an exact word over a prefix match in the same field', () => {
    const exact = makeArticle({ slug: 'exact', title: 'السلام' });
    const prefix = makeArticle({ slug: 'prefix', title: 'السلامة' });
    expect(slugs(rankArticles([prefix, exact], 'سلام'))).toEqual(['exact', 'prefix']);
  });

  it('gives a bonus for a phrase match in the title', () => {
    const phrase = makeArticle({ slug: 'phrase', title: 'فرح تحت المجهر' });
    const scattered = makeArticle({ slug: 'scattered', title: 'المجهر والفرح تحت الضوء' });
    expect(slugs(rankArticles([scattered, phrase], 'فرح تحت المجهر'))).toEqual(['phrase', 'scattered']);
  });
});

describe('rankArticles — Arabic-aware matching', () => {
  it('ignores diacritics in both the query and the content', () => {
    const a = makeArticle({ slug: 'a', title: 'فَرَحٌ دائم' });
    expect(slugs(rankArticles([a], 'فرح'))).toEqual(['a']);
    const b = makeArticle({ slug: 'b', title: 'فرح دائم' });
    expect(slugs(rankArticles([b], 'فَرَح'))).toEqual(['b']);
  });

  it('ignores shadda', () => {
    const a = makeArticle({ slug: 'a', title: 'الموتى المطوّبون في الرّبّ' });
    expect(slugs(rankArticles([a], 'الرب'))).toEqual(['a']);
  });

  it('ignores hamza forms and ta marbuta', () => {
    const a = makeArticle({ slug: 'a', title: 'الإدارة بالخوف أم بالثّقة؟' });
    expect(slugs(rankArticles([a], 'الاداره'))).toEqual(['a']);
    expect(slugs(rankArticles([a], 'إدارة'))).toEqual(['a']);
  });

  it('ignores the definite article and attached prepositions', () => {
    const a = makeArticle({ slug: 'a', title: 'الإدارة بالخوف' });
    expect(slugs(rankArticles([a], 'خوف'))).toEqual(['a']);
    expect(slugs(rankArticles([a], 'الخوف'))).toEqual(['a']);
    const b = makeArticle({ slug: 'b', title: 'خوف' });
    expect(slugs(rankArticles([b], 'والخوف'))).toEqual(['b']);
  });

  it('matches Arabic-Indic digits against Western digits', () => {
    const a = makeArticle({ slug: 'a', title: 'كبريانوس القرطاجيّ (200م-258م)' });
    expect(slugs(rankArticles([a], '٢٥٨م'))).toEqual(['a']);
  });
});

describe('rankArticles — query semantics', () => {
  it('requires every token of a multi-word query to match', () => {
    const both = makeArticle({ slug: 'both', title: 'الصلاة الربانية', excerpt: 'عن الحياة' });
    const one = makeArticle({ slug: 'one', title: 'الصلاة وحدها' });
    const split = makeArticle({ slug: 'split', title: 'الصلاة', tags: ['ربانية'] });
    expect(slugs(rankArticles([one, both, split], 'صلاة ربانية'))).toEqual(['both', 'split']);
    expect(scoreArticle(one, 'صلاة ربانية')).toBe(0);
  });

  it('returns nothing for an empty or punctuation-only query', () => {
    const a = makeArticle({ title: 'فرح' });
    expect(rankArticles([a], '')).toEqual([]);
    expect(rankArticles([a], '   ')).toEqual([]);
    expect(rankArticles([a], '؟!')).toEqual([]);
    expect(scoreArticle(a, '')).toBe(0);
  });

  it('returns nothing when no article matches', () => {
    expect(rankArticles([makeArticle(), makeArticle()], 'غير موجود')).toEqual([]);
  });

  it('breaks ties in favour of the newer article', () => {
    const older = makeArticle({ slug: 'older', title: 'الصلاة', date: '2026-01-03T09:00:00' });
    const newer = makeArticle({ slug: 'newer', title: 'الصلاة', date: '2026-05-16T09:00:00' });
    const middle = makeArticle({ slug: 'middle', title: 'الصلاة', date: '2026-03-01T09:00:00' });
    const results = rankArticles([older, newer, middle], 'صلاة');
    expect(results.map((r) => r.score)).toEqual([results[0].score, results[0].score, results[0].score]);
    expect(slugs(results)).toEqual(['newer', 'middle', 'older']);
  });

  it('does not mutate the input array', () => {
    const list = [makeArticle({ slug: 'x', title: 'سلام', date: '2025-01-01' }), makeArticle({ slug: 'y', title: 'سلام', date: '2026-01-01' })];
    const before = list.map((a) => a.slug);
    rankArticles(list, 'سلام');
    expect(list.map((a) => a.slug)).toEqual(before);
  });
});
