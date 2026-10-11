import { describe, expect, it } from 'vitest';
import { createFixtureSource } from './content/fixtures';
import { searchDocs } from './search';

describe('searchDocs', async () => {
  const docs = await createFixtureSource().getSearchDocs();

  it('matches titles regardless of shadda and hamza', () => {
    const titles = searchDocs(docs, 'الظروف').map((h) => h.post.title);
    expect(titles[0]).toBe('هل تكفي الظّروف لنكون سعداء؟');
  });

  it('ranks an exact title first', () => {
    expect(searchDocs(docs, 'فرح تحت المجهر')[0].post.title).toBe('فرح تحت المجهر');
  });

  it('finds by author and by tag', () => {
    expect(searchDocs(docs, 'ماكنتاير').length).toBeGreaterThan(3);
    expect(searchDocs(docs, 'سعادة').some((h) => h.post.slug === 'فرح-تحت-المجهر')).toBe(true);
  });

  it('matches without the definite article', () => {
    expect(searchDocs(docs, 'صلاة').some((h) => h.post.title === 'الصّلاة الربّانيّة')).toBe(true);
  });

  it('returns nothing for empty or unknown queries', () => {
    expect(searchDocs(docs, '  ')).toEqual([]);
    expect(searchDocs(docs, 'كلمةغيرموجودة')).toEqual([]);
  });

  it('filters by category', () => {
    const hits = searchDocs(docs, 'الصلاة', { categoryId: 107 });
    expect(hits.every((h) => h.post.categories.some((c) => c.id === 107))).toBe(true);
  });
});
