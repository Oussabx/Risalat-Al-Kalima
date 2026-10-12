/** Arabic text helpers: normalisation for search, HTML-to-text, dates and reading time. */

const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;
const ARABIC_INDIC_DIGITS = /[٠-٩]/g;
const EASTERN_DIGITS = /[۰-۹]/g;

/**
 * Normalises Arabic for matching: removes diacritics (including shadda) and
 * tatweel, unifies hamza/alef forms, ى→ي, ة→ه, ؤ→و, ئ→ي, converts Arabic-Indic
 * digits to Western digits, lower-cases Latin text and collapses punctuation.
 */
export function normalizeArabic(input: string): string {
  return input
    .normalize('NFC')
    .replace(DIACRITICS, '')
    .replace(TATWEEL, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(ARABIC_INDIC_DIGITS, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(EASTERN_DIGITS, (d) => String(d.charCodeAt(0) - 0x06f0))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Removes the definite article (ال / وال / بال / فال / كال / لل) from a single normalised word. */
export function stripArticle(word: string): string {
  if (word.length > 4 && /^(وال|بال|فال|كال)/.test(word)) return word.slice(3);
  if (word.length > 3 && word.startsWith('ال')) return word.slice(2);
  if (word.length > 3 && word.startsWith('لل')) return word.slice(2);
  return word;
}

/** Normalised word stems for matching, without the definite article. */
export function searchTokens(input: string): string[] {
  return normalizeArabic(input)
    .split(' ')
    .filter(Boolean)
    .map(stripArticle)
    .filter((w) => w.length > 1 || /\d/.test(w));
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  laquo: '«',
  raquo: '»',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  zwnj: '‌',
  zwj: '‍',
  rlm: '‏',
  lrm: '‎',
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** HTML → readable plain text (tags removed, entities decoded, whitespace collapsed). */
export function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1\s*>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|h[1-6]|li|blockquote|figure)>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/** Shortens text on a word boundary. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s،,.؛:]+$/, '')}…`;
}

/** Levantine month names, as used by the magazine. */
const MONTHS = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];

/** "8 أيلول 2026". Uses the date as published (no timezone shift). */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return '';
  const [, y, m, d] = match;
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

/** Machine-readable date for <time dateTime>. */
export function isoDate(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}/.exec(iso)?.[0] ?? iso;
}

/** Estimated reading time in minutes for Arabic prose (~180 words per minute). */
export function readingMinutes(html: string): number {
  const words = stripHtml(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

/** "دقيقة واحدة" / "دقيقتان" / "3 دقائق" / "11 دقيقة". */
export function minutesLabel(n: number): string {
  if (n <= 1) return 'دقيقة واحدة';
  if (n === 2) return 'دقيقتان';
  if (n <= 10) return `${n} دقائق`;
  return `${n} دقيقة`;
}

/** "مقال واحد" / "مقالان" / "5 مقالات" / "24 مقالًا". */
export function articlesLabel(n: number): string {
  if (n === 0) return 'لا مقالات';
  if (n === 1) return 'مقال واحد';
  if (n === 2) return 'مقالان';
  if (n <= 10) return `${n} مقالات`;
  return `${n} مقالًا`;
}

/** Decodes a route parameter that may arrive percent-encoded. */
export function decodeSlug(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
