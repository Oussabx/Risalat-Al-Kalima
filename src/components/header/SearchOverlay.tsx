'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { formatDate } from '@/lib/arabic';
import { routes } from '@/lib/routes';
import { PostImage } from '../PostImage';
import { AlertIcon, ArrowLeftIcon, CloseIcon, SearchIcon } from '../icons';
import { SEARCH_DIALOG_ID, type NavLink } from './nav';
import { useModalDialog } from './use-modal-dialog';

const DEBOUNCE_MS = 250;
const LIMIT = 6;

/** One row of GET /api/search/?q=&limit= (implemented by the archive builder). */
export type SearchHit = {
  slug: string;
  title: string;
  date: string;
  category?: string;
  author?: string;
  image?: { src: string; alt: string };
};

type SearchState = { status: 'idle' | 'loading' | 'done' | 'error'; query: string; items: SearchHit[]; total: number };

const IDLE: SearchState = { status: 'idle', query: '', items: [], total: 0 };

function resultsLabel(n: number): string {
  if (n === 1) return 'نتيجة واحدة';
  if (n === 2) return 'نتيجتان';
  if (n >= 3 && n <= 10) return `${n} نتائج`;
  return `${n} نتيجة`;
}

function displayDate(value: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? formatDate(value) : value;
}

function isHit(value: unknown): value is SearchHit {
  const hit = value as SearchHit | null;
  return Boolean(hit) && typeof hit?.slug === 'string' && typeof hit.title === 'string';
}

/** On the search page, the overlay opens with the current query. */
function readInitialQuery(): string {
  if (!window.location.pathname.startsWith(routes.search())) return '';
  return new URLSearchParams(window.location.search).get('q')?.slice(0, 100) ?? '';
}

/**
 * Site search dialog: debounced live results with stale requests aborted,
 * arrow-key navigation through the results, Enter for the full results page.
 * Mounted only while open.
 */
export function SearchOverlay({ suggestions, onClose, returnFocusRef }: { suggestions: NavLink[]; onClose: () => void; returnFocusRef: RefObject<HTMLElement | null> }) {
  const router = useRouter();
  const uid = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(readInitialQuery);
  const [state, setState] = useState<SearchState>(() => (query.trim() ? { ...IDLE, status: 'loading', query: query.trim() } : IDLE));
  const [attempt, setAttempt] = useState(0);
  const q = query.trim();

  useModalDialog(rootRef, { onClose, initialFocusRef: inputRef, returnFocusRef, restorePrevious: true });

  // A prefilled query is selected so typing replaces it.
  useEffect(() => {
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q, limit: String(LIMIT) });
        const res = await fetch(`/api/search/?${params}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { total?: unknown; items?: unknown };
        const items = Array.isArray(data.items) ? data.items.filter(isHit).slice(0, LIMIT) : [];
        const total = typeof data.total === 'number' && data.total >= items.length ? data.total : items.length;
        setState({ status: 'done', query: q, items, total });
      } catch {
        if (!controller.signal.aborted) setState((s) => ({ ...s, status: 'error', query: q }));
      }
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [q, attempt]);

  function onChange(value: string) {
    setQuery(value);
    const next = value.trim();
    if (!next) setState(IDLE);
    else if (next !== q) setState((s) => ({ ...s, status: 'loading' }));
  }

  function clear() {
    onChange('');
    inputRef.current?.focus();
  }

  function retry() {
    setState((s) => ({ ...s, status: 'loading' }));
    setAttempt((n) => n + 1);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!q) {
      inputRef.current?.focus();
      return;
    }
    router.push(routes.search({ q }));
    onClose();
  }

  function navItems(): HTMLElement[] {
    return Array.from(resultsRef.current?.querySelectorAll<HTMLElement>('[data-search-item]') ?? []);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'ArrowDown') return;
    const first = navItems()[0];
    if (first) {
      event.preventDefault();
      first.focus();
    }
  }

  function onResultsKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const items = navItems();
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (index === -1 || event.altKey || event.ctrlKey || event.metaKey) return;
    let target: HTMLElement | null | undefined;
    if (event.key === 'ArrowDown') target = items[Math.min(index + 1, items.length - 1)];
    else if (event.key === 'ArrowUp') target = index === 0 ? inputRef.current : items[index - 1];
    else if (event.key === 'Home') target = items[0];
    else if (event.key === 'End') target = items[items.length - 1];
    else if (event.key.length === 1 && event.key !== ' ') {
      // Typing from a result goes back to the field (the character lands there).
      inputRef.current?.focus();
      return;
    }
    if (!target) return;
    event.preventDefault();
    target.focus();
  }

  const loading = state.status === 'loading';
  const hasItems = state.items.length > 0;
  const announcement =
    state.status === 'loading'
      ? 'جارٍ البحث…'
      : state.status === 'error'
        ? 'تعذّر إجراء البحث.'
        : state.status === 'done'
          ? state.total
            ? `${resultsLabel(state.total)} لـ «${state.query}»`
            : `لا نتائج لـ «${state.query}»`
          : '';

  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[70] flex justify-center sm:items-start sm:px-6 sm:pt-[10vh]">
      <div className="absolute inset-0 animate-fade-in bg-ink/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        id={SEARCH_DIALOG_ID}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        tabIndex={-1}
        className="relative flex h-full w-full animate-pop-in flex-col overflow-hidden bg-white outline-none sm:h-auto sm:max-h-[min(44rem,82vh)] sm:max-w-2xl sm:rounded-2xl sm:shadow-(--shadow-lift)"
      >
        <h2 id={`${uid}-title`} className="sr-only">
          البحث في المجلّة
        </h2>

        <form role="search" action={routes.search()} method="get" onSubmit={onSubmit} className="flex shrink-0 items-center gap-2 border-b border-line p-3 sm:p-4">
          <div className="relative flex min-w-0 flex-1 items-center">
            <SearchIcon width={22} height={22} className="pointer-events-none absolute start-4 text-brand-600" />
            <label htmlFor={`${uid}-q`} className="sr-only">
              ابحث في المقالات
            </label>
            <input
              ref={inputRef}
              id={`${uid}-q`}
              name="q"
              type="search"
              value={query}
              maxLength={100}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onInputKeyDown}
              autoComplete="off"
              enterKeyHint="search"
              placeholder="ابحث عن مقال أو كاتب أو موضوع…"
              aria-describedby={`${uid}-hint`}
              aria-controls={`${uid}-results`}
              className="h-14 w-full min-w-0 rounded-xl border border-transparent bg-surface-2 ps-12 pe-12 text-lg text-ink transition-[border-color,background-color,box-shadow] duration-200 outline-none placeholder:text-muted focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100 sm:text-xl [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query ? (
              <button
                type="button"
                onClick={clear}
                aria-label="مسح نصّ البحث"
                className="absolute end-1.5 inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <CloseIcon width={18} height={18} />
              </button>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="btn-ghost shrink-0 px-3 sm:px-4">
            إغلاق
            <kbd className="hidden rounded-md border border-line bg-white px-1.5 font-sans text-[0.6875rem] leading-5 text-muted sm:inline-block" aria-hidden="true">
              Esc
            </kbd>
          </button>
        </form>

        <p id={`${uid}-hint`} className="sr-only">
          تظهر النتائج أثناء الكتابة. استخدم السهمين للتنقّل بين النتائج، واضغط Enter لعرض كل النتائج.
        </p>
        <p role="status" className="sr-only">
          {announcement}
        </p>

        <div ref={resultsRef} id={`${uid}-results`} onKeyDown={onResultsKeyDown} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
          {state.status === 'idle' ? (
            <div className="px-2">
              <p className="text-[0.9375rem] leading-relaxed text-muted">اكتب كلمة أو أكثر للبحث في مقالات المجلّة.</p>
              {suggestions.length ? (
                <>
                  <h3 className="mt-6 mb-3 text-meta font-semibold text-ink">تصفّح الأقسام</h3>
                  <ul className="flex flex-wrap gap-2">
                    {suggestions.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} onClick={onClose} className="chip">
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : state.status === 'error' ? (
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <span className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-red-50 text-danger" aria-hidden="true">
                <AlertIcon width={24} height={24} />
              </span>
              <p className="font-semibold text-ink">تعذّر إجراء البحث الآن.</p>
              <p className="mt-1 text-sm text-muted">تحقّق من اتصالك ثمّ حاول مجدّدًا.</p>
              <button type="button" onClick={retry} className="btn-outline mt-5">
                إعادة المحاولة
              </button>
            </div>
          ) : loading && !hasItems ? (
            <ul className="space-y-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center gap-3 p-2">
                  <div className="skeleton aspect-[4/3] w-16 shrink-0 sm:w-20" />
                  <div className="flex-1 space-y-2.5">
                    <div className="skeleton h-4 w-4/5" />
                    <div className="skeleton h-3 w-2/5" />
                  </div>
                </li>
              ))}
            </ul>
          ) : !hasItems ? (
            <div className="px-4 py-10 text-center">
              <p className="font-semibold text-ink">لا نتائج لـ «{state.query}»</p>
              <p className="mt-1 text-sm text-muted">جرّب كلمات أخرى أو صيغة أقصر.</p>
            </div>
          ) : (
            <div aria-busy={loading || undefined} className={`transition-opacity duration-200 ${loading ? 'opacity-60' : ''}`}>
              <h3 className="mb-1 px-2 text-meta font-semibold text-muted">{resultsLabel(state.total)}</h3>
              <ul aria-label="نتائج البحث" className="space-y-0.5">
                {state.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      data-search-item
                      href={routes.article(item.slug)}
                      onClick={onClose}
                      className="group flex items-center gap-3 rounded-xl p-2 transition-colors duration-150 hover:bg-surface-2 focus-visible:bg-brand-50"
                    >
                      <PostImage
                        image={item.image?.src ? { src: item.image.src, alt: '' } : undefined}
                        sizes="80px"
                        ratio="aspect-[4/3]"
                        className="w-16 shrink-0 rounded-lg sm:w-20"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[0.9375rem] leading-relaxed font-semibold text-ink group-hover:text-brand-700 sm:text-base">
                          {item.title}
                        </span>
                        <span className="meta mt-0.5 block truncate">{[item.category, item.date ? displayDate(item.date) : ''].filter(Boolean).join(' · ')}</span>
                      </span>
                      <ArrowLeftIcon
                        width={16}
                        height={16}
                        className="hidden shrink-0 text-brand-600 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link data-search-item href={routes.search({ q: q || state.query })} onClick={onClose} className="btn-outline mt-4 w-full">
                عرض كل النتائج
                <ArrowLeftIcon width={16} height={16} />
              </Link>
            </div>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-5 border-t border-line px-5 py-2.5 text-meta text-muted sm:flex" aria-hidden="true">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-line bg-surface-2 px-1.5 font-sans leading-5 text-ink-soft">↑</kbd>
            <kbd className="rounded border border-line bg-surface-2 px-1.5 font-sans leading-5 text-ink-soft">↓</kbd>
            للتنقّل
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-line bg-surface-2 px-1.5 font-sans leading-5 text-ink-soft">Enter</kbd>
            لكل النتائج
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-line bg-surface-2 px-1.5 font-sans leading-5 text-ink-soft">Esc</kbd>
            للإغلاق
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
