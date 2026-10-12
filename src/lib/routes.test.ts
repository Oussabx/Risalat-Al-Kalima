import { describe, expect, it } from 'vitest';
import { absoluteUrl, parsePage, parseSort, parseString, routes } from '@/lib/routes';

const BASE = 'https://risalatalkalima.com';

describe('routes', () => {
  it('builds static paths with trailing slashes', () => {
    expect(routes.home()).toBe('/');
    expect(routes.picks()).toBe('/picks/');
    expect(routes.saved()).toBe('/saved/');
    expect(routes.about()).toBe('/about/');
    expect(routes.contact()).toBe('/contact/');
    expect(routes.feed()).toBe('/feed/');
  });

  it('builds article paths from Arabic slugs without encoding them', () => {
    expect(routes.article('فرح-تحت-المجهر')).toBe('/فرح-تحت-المجهر/');
    expect(routes.article('risala210')).toBe('/risala210/');
  });

  it('builds archive paths with trailing slashes', () => {
    expect(routes.category('تأملات')).toBe('/category/تأملات/');
    expect(routes.tag('رسالة-الكلمة')).toBe('/tag/رسالة-الكلمة/');
    expect(routes.author('risala210')).toBe('/author/risala210/');
    expect(routes.articles()).toBe('/articles/');
    expect(routes.search()).toBe('/search/');
  });

  it('drops default query values (page=1, sort=newest, empty strings)', () => {
    expect(routes.category('تأملات', { page: 1, sort: 'newest' })).toBe('/category/تأملات/');
    expect(routes.tag('فرح', { page: 1 })).toBe('/tag/فرح/');
    expect(routes.author('a', { page: 0 })).toBe('/author/a/');
    expect(routes.articles({ q: '', category: '', sort: 'newest', page: 1 })).toBe('/articles/');
    expect(routes.search({ q: '' })).toBe('/search/');
  });

  it('keeps non-default query values', () => {
    expect(routes.category('تأملات', { page: 2 })).toBe('/category/تأملات/?page=2');
    expect(routes.category('تأملات', { sort: 'oldest', page: 3 })).toBe('/category/تأملات/?sort=oldest&page=3');
    expect(routes.tag('فرح', { page: 4 })).toBe('/tag/فرح/?page=4');
    expect(routes.author('a', { page: 2 })).toBe('/author/a/?page=2');
  });

  it('encodes Arabic and special characters in query strings', () => {
    const url = routes.search({ q: 'فرح & سلام', category: 'تأملات', page: 2 });
    expect(url.startsWith('/search/?')).toBe(true);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('q')).toBe('فرح & سلام');
    expect(params.get('category')).toBe('تأملات');
    expect(params.get('page')).toBe('2');
    expect(url).not.toMatch(/ /);

    const articles = new URLSearchParams(routes.articles({ q: 'الصلاة', sort: 'title' }).split('?')[1]);
    expect(articles.get('q')).toBe('الصلاة');
    expect(articles.get('sort')).toBe('title');
    expect(articles.has('page')).toBe(false);
  });
});

describe('parsePage', () => {
  it('accepts positive integers', () => {
    expect(parsePage('2')).toBe(2);
    expect(parsePage('17')).toBe(17);
    expect(parsePage(['3', '9'])).toBe(3);
  });

  it('falls back to 1 for missing, invalid or non-positive values', () => {
    for (const v of [undefined, '', '1', '0', '-3', '2.5', 'abc', 'NaN', 'Infinity', '1e', [] as string[]]) {
      expect(parsePage(v)).toBe(1);
    }
  });

  it('caps absurdly large pages', () => {
    expect(parsePage('999999')).toBe(1000);
  });
});

describe('parseSort', () => {
  it('accepts known orders', () => {
    expect(parseSort('oldest')).toBe('oldest');
    expect(parseSort('title')).toBe('title');
    expect(parseSort('newest')).toBe('newest');
    expect(parseSort(['title', 'oldest'])).toBe('title');
  });

  it('defaults to newest', () => {
    for (const v of [undefined, '', 'random', 'OLDEST', 'views', [] as string[]]) expect(parseSort(v)).toBe('newest');
  });
});

describe('parseString', () => {
  it('trims and takes the first value', () => {
    expect(parseString('  فرح  ')).toBe('فرح');
    expect(parseString(['أ', 'ب'])).toBe('أ');
  });

  it('returns an empty string when missing', () => {
    expect(parseString(undefined)).toBe('');
    expect(parseString([])).toBe('');
    expect(parseString('   ')).toBe('');
  });
});

describe('absoluteUrl', () => {
  it('joins a path to the base', () => {
    expect(absoluteUrl('/about/', BASE)).toBe(`${BASE}/about/`);
    expect(absoluteUrl('/', `${BASE}/`)).toBe(`${BASE}/`);
  });

  it('percent-encodes Arabic paths once', () => {
    const url = absoluteUrl('/فرح-تحت-المجهر/', BASE);
    expect(url).toBe(`${BASE}/${encodeURIComponent('فرح-تحت-المجهر')}/`);
    expect(decodeURI(url)).toBe(`${BASE}/فرح-تحت-المجهر/`);
  });

  it('does not double-encode an already encoded path', () => {
    const encoded = `/${encodeURIComponent('فرح-تحت-المجهر')}/`;
    expect(absoluteUrl(encoded, BASE)).toBe(absoluteUrl('/فرح-تحت-المجهر/', BASE));
  });

  it('keeps query strings', () => {
    expect(absoluteUrl('/category/تأملات/?page=2', BASE)).toBe(`${BASE}/category/${encodeURIComponent('تأملات')}/?page=2`);
  });

  // FOUNDATION BUG (src/lib/routes.ts): absoluteUrl calls decodeURI() unguarded, so a path containing a stray '%'
  // (e.g. a malformed slug that decodeSlug() passed through unchanged) throws URIError instead of returning a URL.
  // Fix: wrap decodeURI in try/catch and fall back to the raw path. Remove `.fails` once fixed.
  it('does not throw on a malformed percent sequence', () => {
    expect(() => absoluteUrl('/100%/', BASE)).not.toThrow();
  });
});
