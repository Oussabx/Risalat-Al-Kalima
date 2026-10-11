'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AlertIcon, ArrowLeft, CloseIcon, SearchIcon } from '@/components/icons';
import { formatDate } from '@/lib/arabic';
import { routes } from '@/lib/routes';
import { useDialog } from './useDialog';

type QuickResult = {
  id: number;
  slug: string;
  title: string;
  date: string;
  category?: string;
  image?: { src: string; alt: string };
};

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; items: QuickResult[]; total: number }
  | { status: 'error' };

type Response = { query: string } & ({ status: 'done'; items: QuickResult[]; total: number } | { status: 'error' });

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<Response | null>(null);
  useDialog(open, onClose, panelRef, inputRef);

  const q = query.trim();
  const active = open && q.length >= 2;
  const state: State = !active ? { status: 'idle' } : response?.query === q ? response : { status: 'loading' };

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/?q=${encodeURIComponent(q)}&limit=6`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { items: QuickResult[]; total: number };
        setResponse({ query: q, status: 'done', items: data.items, total: data.total });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setResponse({ query: q, status: 'error' });
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, active]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q) return;
    onClose();
    router.push(routes.search({ q }));
  };

  return (
    <div className={`no-print fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-slate-900/45 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="البحث في المجلة"
        inert={!open}
        className={`relative mx-auto mt-0 w-full max-w-2xl transition duration-200 ease-[var(--ease-out-soft)] sm:mt-[10vh] sm:px-4 ${
          open ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
        }`}
      >
        <div className="overflow-hidden bg-white shadow-2xl sm:rounded-2xl">
          <form role="search" onSubmit={submit} className="flex items-center gap-2 border-b border-line px-4">
            <SearchIcon size={22} className="shrink-0 text-brand-600" />
            <label htmlFor="overlay-search" className="sr-only">
              ابحث في المقالات
            </label>
            <input
              ref={inputRef}
              id="overlay-search"
              type="search"
              dir="rtl"
              autoComplete="off"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن مقال، كاتب، قسم أو وسم…"
              className="h-16 min-w-0 flex-1 bg-transparent text-lg text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="rounded-md px-2 py-1 text-sm text-muted hover:text-ink"
              >
                مسح
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"
              aria-label="إغلاق البحث"
            >
              <CloseIcon size={20} />
            </button>
          </form>

          <div className="max-h-[65vh] overflow-y-auto" aria-live="polite">
            {state.status === 'idle' && (
              <p className="px-5 py-6 text-sm leading-7 text-muted">
                اكتب كلمتين على الأقل للبحث في عناوين المقالات ومقتطفاتها وأسماء الكتّاب والأقسام. اضغط <kbd className="rounded border border-line bg-canvas px-1.5 font-sans text-xs">Enter</kbd> لعرض كل النتائج.
              </p>
            )}

            {state.status === 'loading' && (
              <ul className="space-y-1 p-3" aria-label="جارٍ البحث">
                {Array.from({ length: 3 }, (_, i) => (
                  <li key={i} className="flex items-center gap-3 p-2">
                    <div className="skeleton h-14 w-20 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-3/4" />
                      <div className="skeleton h-3 w-1/3" />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {state.status === 'error' && (
              <p className="flex items-center gap-2 px-5 py-6 text-sm text-red-700">
                <AlertIcon size={18} /> تعذّر إجراء البحث الآن. حاول مجددًا بعد قليل.
              </p>
            )}

            {state.status === 'done' && state.items.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="font-medium text-ink">لا توجد نتائج لـ «{query.trim()}»</p>
                <p className="mt-1 text-sm text-muted">جرّب كلمة أقصر أو مرادفًا، أو تصفّح الأقسام من القائمة.</p>
              </div>
            )}

            {state.status === 'done' && state.items.length > 0 && (
              <>
                <ul className="p-2">
                  {state.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={routes.post(item.slug)}
                        onClick={onClose}
                        className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-brand-50 focus-visible:bg-brand-50"
                      >
                        <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-100">
                          {item.image && (
                            // eslint-disable-next-line @next/next/no-img-element -- tiny thumbnails in a transient overlay
                            <img src={item.image.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 font-medium leading-7 text-ink group-hover:text-brand-700">{item.title}</span>
                          <span className="mt-0.5 block text-xs text-muted">
                            {item.category && <span className="text-brand-700">{item.category}</span>}
                            {item.category && ' · '}
                            {formatDate(item.date)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={routes.search({ q: query.trim() })}
                  onClick={onClose}
                  className="flex items-center justify-between border-t border-line px-5 py-3.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                >
                  عرض كل النتائج ({state.total})
                  <ArrowLeft size={18} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
