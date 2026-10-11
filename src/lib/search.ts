import { normalizeArabic, tokenize } from '@/lib/arabic';
import type { PostSummary, SearchDoc } from '@/lib/content/types';

export type SearchHit = { post: PostSummary; score: number };

type Field = { text: string; weight: number };

function fieldsOf(doc: SearchDoc): Field[] {
  const p = doc.post;
  return [
    { text: normalizeArabic(p.title), weight: 10 },
    { text: normalizeArabic(p.author.name), weight: 6 },
    { text: normalizeArabic(p.categories.map((c) => c.name).join(' ')), weight: 5 },
    { text: normalizeArabic(p.tags.map((t) => t.name).join(' ')), weight: 5 },
    { text: normalizeArabic(p.excerpt), weight: 3 },
    { text: doc.body ? normalizeArabic(doc.body) : '', weight: 1 },
  ];
}

/** Variants of a token with and without the definite article / common prefixes. */
function variants(token: string): string[] {
  const out = new Set([token]);
  for (const prefix of ['وال', 'بال', 'فال', 'كال', 'ال', 'لل']) {
    if (token.startsWith(prefix) && token.length - prefix.length >= 2) out.add(token.slice(prefix.length));
  }
  return [...out];
}

/**
 * Ranks documents for an Arabic query. Every token must appear in some field
 * (AND semantics); title matches and exact phrases rank highest.
 */
export function searchDocs(docs: SearchDoc[], query: string, filter?: { categoryId?: number }): SearchHit[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const phrase = normalizeArabic(query);
  const hits: SearchHit[] = [];

  for (const doc of docs) {
    if (filter?.categoryId && !doc.post.categories.some((c) => c.id === filter.categoryId)) continue;
    const fields = fieldsOf(doc);
    let score = 0;
    let allMatched = true;
    for (const token of tokens) {
      const forms = variants(token);
      let best = 0;
      for (const f of fields) {
        if (f.text && forms.some((form) => f.text.includes(form))) best = Math.max(best, f.weight);
      }
      if (!best) {
        allMatched = false;
        break;
      }
      score += best;
    }
    if (!allMatched) continue;
    if (tokens.length > 1 && fields[0].text.includes(phrase)) score += 15;
    if (fields[0].text === phrase) score += 20;
    hits.push({ post: doc.post, score });
  }

  return hits.sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date));
}
