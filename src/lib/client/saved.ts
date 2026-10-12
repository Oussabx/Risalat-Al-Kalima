import { useSyncExternalStore } from 'react';

/**
 * Saved articles ("المحفوظات"), kept in this browser's localStorage.
 *
 * A tiny external store read through useSyncExternalStore: the server snapshot
 * is always the empty list (no hydration mismatch), other tabs stay in sync
 * through the `storage` event, and when storage is unavailable (private mode,
 * blocked cookies, full quota) the list lives in memory for the session.
 */

export type SavedItem = {
  slug: string;
  title: string;
  /** Featured image URL. */
  image?: string;
  /** Name of the first category. */
  category?: string;
  /** ISO publication date. */
  date: string;
  /** Author name. */
  author: string;
};

const STORAGE_KEY = 'risala:saved:v1';
const MAX_ITEMS = 300;
const EMPTY: readonly SavedItem[] = Object.freeze([]);

const listeners = new Set<() => void>();
let memory: string | null = null;
let memoryOnly = false;
let cachedRaw: string | null | undefined;
let cached: readonly SavedItem[] = EMPTY;

function readRaw(): string | null {
  if (!memoryOnly) {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      memoryOnly = true;
    }
  }
  return memory;
}

function writeRaw(raw: string) {
  memory = raw;
  if (memoryOnly) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    memoryOnly = true;
  }
}

const text = (value: unknown, max = 500): string | undefined => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined);

/** Stored data is untrusted (other versions, manual edits): keep only well-formed items. */
function toItem(value: unknown): SavedItem | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const slug = text(record.slug);
  const title = text(record.title);
  // Slugs become internal paths (/{slug}/): no separators or query/fragment characters.
  if (!slug || !title || /[/\\?#]/.test(slug) || slug.startsWith('.')) return null;
  const image = text(record.image, 2000);
  return {
    slug,
    title,
    image: image && /^(https?:\/\/|\/(?!\/))/i.test(image) ? image : undefined,
    category: text(record.category),
    date: text(record.date, 40) ?? '',
    author: text(record.author) ?? '',
  };
}

function parse(raw: string | null): readonly SavedItem[] {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return EMPTY;
    const seen = new Set<string>();
    const items: SavedItem[] = [];
    for (const entry of data) {
      const item = toItem(entry);
      if (item && !seen.has(item.slug)) {
        seen.add(item.slug);
        items.push(item);
      }
    }
    return items;
  } catch {
    return EMPTY;
  }
}

/** Current list (newest first). Returns the same reference until the stored value changes. */
function getSnapshot(): readonly SavedItem[] {
  if (typeof window === 'undefined') return EMPTY;
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
}

const getServerSnapshot = (): readonly SavedItem[] => EMPTY;

function emit() {
  for (const listener of listeners) listener();
}

function commit(items: readonly SavedItem[]) {
  writeRaw(JSON.stringify(items.slice(0, MAX_ITEMS)));
  emit();
}

function onStorage(event: StorageEvent) {
  // `key` is null when another tab cleared the whole storage.
  if (event.key === null || event.key === STORAGE_KEY) emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

/** Saved articles, newest first. Empty during server rendering and hydration. */
export function useSaved(): readonly SavedItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Whether one article is saved (re-renders only when that answer changes). */
export function useIsSaved(slug: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isSaved(slug),
    () => false,
  );
}

export function isSaved(slug: string): boolean {
  return getSnapshot().some((item) => item.slug === slug);
}

/** Saves the article, or removes it when already saved. Returns the new state. */
export function toggleSaved(item: SavedItem): boolean {
  const items = getSnapshot();
  if (items.some((i) => i.slug === item.slug)) {
    commit(items.filter((i) => i.slug !== item.slug));
    return false;
  }
  const clean = toItem(item);
  if (!clean) return false;
  commit([clean, ...items]);
  return true;
}

export function removeSaved(slug: string) {
  const items = getSnapshot();
  if (items.some((i) => i.slug === slug)) commit(items.filter((i) => i.slug !== slug));
}

export function clearSaved() {
  commit(EMPTY);
}
