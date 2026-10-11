'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { BookmarkIcon, CloseIcon } from '@/components/icons';
import { formatDate } from '@/lib/arabic';
import { useSaved } from '@/lib/client/saved';
import { routes } from '@/lib/routes';

const noop = () => () => {};

export function SavedList() {
  const { list, remove, clear } = useSaved();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);

  if (!hydrated) return <div className="skeleton mt-10 h-40 w-full rounded-2xl" aria-hidden />;

  if (!list.length) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <BookmarkIcon size={22} />
        </span>
        <p className="mt-4 text-lg font-semibold text-ink">لم تحفظ أيّ مقال بعد</p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-7 text-muted">اضغط زرّ الحفظ في أيّ مقال ليظهر هنا.</p>
        <Link href={routes.articles()} className="mt-6 inline-flex h-11 items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700">
          تصفّح المقالات
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-muted" role="status">
          {list.length} {list.length === 1 ? 'مقال محفوظ' : 'مقالات محفوظة'}
        </p>
        <button type="button" onClick={clear} className="text-sm font-medium text-muted underline underline-offset-4 hover:text-red-700">
          مسح الكلّ
        </button>
      </div>
      <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
        {list.map((a) => (
          <li key={a.slug} className="flex items-center gap-4 p-4 sm:p-5">
            <Link href={routes.post(a.slug)} className="group flex min-w-0 flex-1 items-center gap-4">
              <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                {a.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- stored snapshot URL
                  <img src={a.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
              </span>
              <span className="min-w-0">
                {a.category && <span className="block text-xs font-semibold text-brand-700">{a.category}</span>}
                <span className="mt-0.5 line-clamp-2 font-semibold leading-7 text-ink group-hover:text-brand-700">{a.title}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {a.author} · {formatDate(a.date)}
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => remove(a.slug)}
              aria-label={`إزالة «${a.title}» من المحفوظات`}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-red-50 hover:text-red-700"
            >
              <CloseIcon size={18} />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
