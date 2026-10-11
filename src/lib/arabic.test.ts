import { describe, expect, it } from 'vitest';
import { decodeEntities, formatDate, normalizeArabic, readingLabel, stripHtml, tokenize } from './arabic';

describe('normalizeArabic', () => {
  it('drops diacritics such as shadda so unvoweled queries match', () => {
    expect(normalizeArabic('الظّروف')).toBe(normalizeArabic('الظروف'));
    expect(normalizeArabic('المسيحيّة')).toBe('المسيحيه');
  });
  it('folds hamza, alef maqsura, taa marbuta and tatweel', () => {
    expect(normalizeArabic('إيمان')).toBe('ايمان');
    expect(normalizeArabic('آذار')).toBe('اذار');
    expect(normalizeArabic('مستشفى')).toBe('مستشفي');
    expect(normalizeArabic('الكـلمة')).toBe('الكلمه');
  });
  it('strips punctuation and Arabic-Indic digits', () => {
    expect(normalizeArabic('فرح، تحت المجهر؟ ٢٠٢٦')).toBe('فرح تحت المجهر 2026');
  });
  it('tokenizes', () => {
    expect(tokenize('  فرحٌ   تحت ')).toEqual(['فرح', 'تحت']);
  });
});

describe('formatting', () => {
  it('formats dates with Levantine month names', () => {
    expect(formatDate('2026-09-08T10:00:00')).toBe('8 أيلول 2026');
  });
  it('labels reading time in Arabic', () => {
    expect(readingLabel(1)).toBe('دقيقة واحدة');
    expect(readingLabel(2)).toBe('دقيقتان');
    expect(readingLabel(4)).toBe('4 دقائق');
    expect(readingLabel(12)).toBe('12 دقيقة');
  });
  it('decodes WordPress entities and strips html', () => {
    expect(decodeEntities('&#8220;فرح&#8221; &amp; سلام&hellip;')).toBe('“فرح” & سلام…');
    expect(stripHtml('<p>مرحبًا <strong>بكم</strong></p>[caption]')).toBe('مرحبًا بكم');
  });
});
