'use client';

import { useSyncExternalStore } from 'react';

/** Saved-articles store persisted in localStorage and synced across tabs. */

export type SavedArticle = {
  slug: string;
  title: string;
  date: string;
  author: string;
  category?: string;
  image?: string;
  savedAt: string;
};

const KEY = 'risala:saved:v1';
const EVENT = 'risala:saved-change';
const EMPTY: SavedArticle[] = [];
let cache: { raw: string | null; list: SavedArticle[] } = { raw: null, list: EMPTY };

function read(): SavedArticle[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.list;
    const parsed = raw ? (JSON.parse(raw) as SavedArticle[]) : EMPTY;
    cache = { raw, list: Array.isArray(parsed) ? parsed : EMPTY };
    return cache.list;
  } catch {
    return EMPTY;
  }
}

function write(list: SavedArticle[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage full or blocked (private mode): the toggle simply won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function useSaved() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    list,
    isSaved: (slug: string) => list.some((a) => a.slug === slug),
    toggle: (article: Omit<SavedArticle, 'savedAt'>) => {
      const current = read();
      write(
        current.some((a) => a.slug === article.slug)
          ? current.filter((a) => a.slug !== article.slug)
          : [{ ...article, savedAt: new Date().toISOString() }, ...current],
      );
    },
    remove: (slug: string) => write(read().filter((a) => a.slug !== slug)),
    clear: () => write([]),
  };
}
