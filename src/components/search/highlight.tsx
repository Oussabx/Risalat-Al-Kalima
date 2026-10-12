import { normalizeArabic, searchTokens, stripArticle } from '@/lib/arabic';

const WORD = /[\p{L}\p{M}\p{N}]+/gu;

/** Same rule as the ranking in lib/search.ts: exact word, prefix for 3+ letters, inside a word for 4+. */
function matches(token: string, word: string): boolean {
  return word === token || (token.length >= 3 && word.startsWith(token)) || (token.length >= 4 && word.includes(token));
}

/**
 * Wraps the words of `text` that match the query in <mark>. Matching ignores
 * diacritics, hamza forms and the definite article, like the search itself.
 */
export function highlight(text: string, query: string): React.ReactNode {
  const tokens = searchTokens(query);
  if (!tokens.length || !text) return text;
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(WORD)) {
    const word = stripArticle(normalizeArabic(match[0]).replace(/\s/g, ''));
    if (!word || !tokens.some((token) => matches(token, word))) continue;
    const start = match.index;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <mark key={start} className="rounded-[3px] bg-brand-100 px-0.5 font-semibold text-inherit">
        {match[0]}
      </mark>,
    );
    last = start + match[0].length;
  }
  if (!parts.length) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
