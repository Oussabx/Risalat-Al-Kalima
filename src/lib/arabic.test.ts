import { describe, expect, it } from 'vitest';
import {
  articlesLabel,
  decodeEntities,
  decodeSlug,
  formatDate,
  isoDate,
  minutesLabel,
  normalizeArabic,
  readingMinutes,
  searchTokens,
  stripArticle,
  stripHtml,
  truncate,
} from '@/lib/arabic';

describe('normalizeArabic', () => {
  it('removes harakat, tanween and shadda', () => {
    expect(normalizeArabic('فَرَحٌ')).toBe('فرح');
    expect(normalizeArabic('الرّبّ')).toBe('الرب');
    expect(normalizeArabic('رَبِّ ابنك')).toBe('رب ابنك');
    expect(normalizeArabic('الحِمِلان')).toBe('الحملان');
  });

  it('removes superscript alef and Quranic marks', () => {
    expect(normalizeArabic('هٰذا')).toBe('هذا');
  });

  it('unifies hamza and alef forms', () => {
    expect(normalizeArabic('أحمد')).toBe('احمد');
    expect(normalizeArabic('إيمان')).toBe('ايمان');
    expect(normalizeArabic('آذار')).toBe('اذار');
    expect(normalizeArabic('ٱلله')).toBe('الله');
    expect(normalizeArabic('مؤمن')).toBe('مومن');
    expect(normalizeArabic('سائل')).toBe('سايل');
    expect(normalizeArabic('الإدارة')).toBe(normalizeArabic('الاداره'));
  });

  it('maps alef maqsura to ya and ta marbuta to ha', () => {
    expect(normalizeArabic('موسى')).toBe('موسي');
    expect(normalizeArabic('رسالة الكلمة')).toBe('رساله الكلمه');
  });

  it('removes tatweel', () => {
    expect(normalizeArabic('الكـــلمة')).toBe('الكلمه');
  });

  it('converts Arabic-Indic and Eastern Arabic-Indic digits to Western digits', () => {
    expect(normalizeArabic('٢٠٢٦')).toBe('2026');
    expect(normalizeArabic('۱۲۳')).toBe('123');
    expect(normalizeArabic('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('lower-cases Latin text, drops punctuation and collapses whitespace', () => {
    expect(normalizeArabic('  Hello,   WORLD!  ')).toBe('hello world');
    expect(normalizeArabic('الإدارة بالخوف أم بالثّقة؟ سرّ القائد')).toBe('الاداره بالخوف ام بالثقه سر القايد');
    expect(normalizeArabic('«فرح»، تحت المجهر')).toBe('فرح تحت المجهر');
  });

  it('returns an empty string for empty or punctuation-only input', () => {
    expect(normalizeArabic('')).toBe('');
    expect(normalizeArabic(' ؟!،. ')).toBe('');
  });
});

describe('stripArticle', () => {
  it('removes ال, وال, بال, فال, كال and لل', () => {
    expect(stripArticle('الكلمه')).toBe('كلمه');
    expect(stripArticle('والكلمه')).toBe('كلمه');
    expect(stripArticle('بالكلمه')).toBe('كلمه');
    expect(stripArticle('فالكلمه')).toBe('كلمه');
    expect(stripArticle('كالكلمه')).toBe('كلمه');
    expect(stripArticle('للكلمه')).toBe('كلمه');
  });

  it('leaves short words alone', () => {
    expect(stripArticle('الم')).toBe('الم');
    expect(stripArticle('فرح')).toBe('فرح');
  });
});

describe('searchTokens', () => {
  it('normalises and strips the definite article from each word', () => {
    expect(searchTokens('الإدارة بالخوف')).toEqual(['اداره', 'خوف']);
    expect(searchTokens('والكلمة')).toEqual(['كلمه']);
  });

  it('drops single letters but keeps digits', () => {
    expect(searchTokens('و فرح')).toEqual(['فرح']);
    expect(searchTokens('٥')).toEqual(['5']);
  });

  it('returns no tokens for an empty query', () => {
    expect(searchTokens('')).toEqual([]);
    expect(searchTokens('   ؟ ')).toEqual([]);
  });
});

describe('decodeEntities', () => {
  it('decodes named entities', () => {
    expect(decodeEntities('a &amp; b &lt;c&gt; &quot;d&quot; &apos;e&apos;')).toBe('a & b <c> "d" \'e\'');
    expect(decodeEntities('&laquo;فرح&raquo;&hellip;')).toBe('«فرح»…');
    expect(decodeEntities('&AMP;')).toBe('&');
  });

  it('decodes decimal and hexadecimal numeric entities', () => {
    expect(decodeEntities('&#1601;&#x631;&#X62D;')).toBe('فرح');
    expect(decodeEntities('&#8217;')).toBe('’');
  });

  it('leaves malformed or unknown entities untouched', () => {
    expect(decodeEntities('&unknown;')).toBe('&unknown;');
    expect(decodeEntities('&#0;')).toBe('&#0;');
    expect(decodeEntities('&#x110000;')).toBe('&#x110000;');
    expect(decodeEntities('&amp')).toBe('&amp');
    expect(decodeEntities('& plain')).toBe('& plain');
  });
});

describe('stripHtml', () => {
  it('removes tags and decodes entities', () => {
    expect(stripHtml('<p>فرح <strong>تحت</strong> المجهر &amp; أكثر</p>')).toBe('فرح تحت المجهر & أكثر');
  });

  it('separates block elements and line breaks with spaces', () => {
    expect(stripHtml('<p>أوّل</p><p>ثانٍ</p>')).toBe('أوّل ثانٍ');
    expect(stripHtml('سطر<br>سطر<br/>سطر')).toBe('سطر سطر سطر');
    expect(stripHtml('<h2>عنوان</h2><ul><li>أ</li><li>ب</li></ul>')).toBe('عنوان أ ب');
  });

  it('drops script and style contents entirely', () => {
    expect(stripHtml('<p>نص</p><script>alert("x")</script><style>p{color:red}</style>')).toBe('نص');
  });

  it('collapses whitespace and trims', () => {
    expect(stripHtml('  <p>\n  نص \t طويل </p>  ')).toBe('نص طويل');
    expect(stripHtml('')).toBe('');
  });
});

describe('truncate', () => {
  it('returns short text unchanged', () => {
    expect(truncate('فرح تحت المجهر', 50)).toBe('فرح تحت المجهر');
    expect(truncate('abc', 3)).toBe('abc');
  });

  it('cuts on a word boundary and appends an ellipsis', () => {
    const text = 'الفرح ليس مجرد لحظة عابرة بل هو ثقة راسخة في قلبنا';
    const out = truncate(text, 20);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(21);
    expect(text.startsWith(out.slice(0, -1))).toBe(true);
    expect(out).toBe('الفرح ليس مجرد لحظة…');
  });

  it('removes trailing punctuation before the ellipsis', () => {
    expect(truncate('كلمة، كلمة أخرى طويلة جدًا', 6)).toBe('كلمة…');
  });

  it('hard-cuts when there is no suitable word boundary', () => {
    expect(truncate('abcdefghijklmnopqrstuvwxyz', 10)).toBe('abcdefghij…');
  });
});

describe('formatDate / isoDate', () => {
  it('formats the reference article date in Levantine Arabic', () => {
    expect(formatDate('2026-09-08T09:00:00')).toBe('8 أيلول 2026');
  });

  it('names all twelve months', () => {
    const months = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
    months.forEach((name, i) => {
      const mm = String(i + 1).padStart(2, '0');
      expect(formatDate(`2026-${mm}-15T00:00:00`)).toBe(`15 ${name} 2026`);
    });
  });

  it('does not shift the date for timezones', () => {
    expect(formatDate('2026-01-01T00:30:00+05:00')).toBe('1 كانون الثاني 2026');
    expect(formatDate('2025-12-31T23:59:59Z')).toBe('31 كانون الأول 2025');
  });

  it('returns an empty string for invalid input', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate('not a date')).toBe('');
  });

  it('isoDate keeps only the date part', () => {
    expect(isoDate('2026-09-08T09:00:00')).toBe('2026-09-08');
    expect(isoDate('garbage')).toBe('garbage');
  });
});

describe('readingMinutes', () => {
  const words = (n: number) => Array.from({ length: n }, () => 'كلمة').join(' ');

  it('is at least one minute', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('<p>كلمة</p>')).toBe(1);
  });

  it('estimates about 180 words per minute and ignores markup', () => {
    expect(readingMinutes(`<p>${words(360)}</p>`)).toBe(2);
    expect(readingMinutes(`<p>${words(900)}</p>`)).toBe(5);
    expect(readingMinutes(`<p>${words(180)}</p><script>${words(5000)}</script>`)).toBe(1);
  });
});

describe('minutesLabel', () => {
  it('uses the correct Arabic plural forms', () => {
    expect(minutesLabel(0)).toBe('دقيقة واحدة');
    expect(minutesLabel(1)).toBe('دقيقة واحدة');
    expect(minutesLabel(2)).toBe('دقيقتان');
    expect(minutesLabel(3)).toBe('3 دقائق');
    expect(minutesLabel(10)).toBe('10 دقائق');
    expect(minutesLabel(11)).toBe('11 دقيقة');
    expect(minutesLabel(25)).toBe('25 دقيقة');
  });
});

describe('articlesLabel', () => {
  it('uses the correct Arabic plural forms', () => {
    expect(articlesLabel(0)).toBe('لا مقالات');
    expect(articlesLabel(1)).toBe('مقال واحد');
    expect(articlesLabel(2)).toBe('مقالان');
    expect(articlesLabel(5)).toBe('5 مقالات');
    expect(articlesLabel(10)).toBe('10 مقالات');
    expect(articlesLabel(11)).toBe('11 مقالًا');
    expect(articlesLabel(24)).toBe('24 مقالًا');
  });
});

describe('decodeSlug', () => {
  it('decodes percent-encoded Arabic slugs', () => {
    expect(decodeSlug(encodeURIComponent('فرح-تحت-المجهر'))).toBe('فرح-تحت-المجهر');
    expect(decodeSlug('%D9%81%D8%B1%D8%AD')).toBe('فرح');
  });

  it('returns plain slugs unchanged', () => {
    expect(decodeSlug('فرح-تحت-المجهر')).toBe('فرح-تحت-المجهر');
    expect(decodeSlug('risala210')).toBe('risala210');
  });

  it('returns malformed input unchanged instead of throwing', () => {
    expect(decodeSlug('%E0%A4%A')).toBe('%E0%A4%A');
    expect(decodeSlug('100%')).toBe('100%');
  });
});
