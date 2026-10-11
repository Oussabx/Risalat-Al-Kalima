import type { SortKey } from '@/lib/content/types';

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parsePage(v: string | string[] | undefined): number {
  const n = Number.parseInt(one(v) ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : 1;
}

export function parseSort(v: string | string[] | undefined): SortKey {
  const s = one(v);
  return s === 'oldest' || s === 'title' ? s : 'newest';
}
