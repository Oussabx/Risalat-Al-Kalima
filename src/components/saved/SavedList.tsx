'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { articlesLabel, formatDate, isoDate } from '@/lib/arabic';
import { clearSaved, removeSaved, useSaved, type SavedItem } from '@/lib/client/saved';
import { routes } from '@/lib/routes';
import { Toast, useFlash } from '../article/Toast';
import { EmptyState } from '../EmptyState';
import { ArrowLeftIcon, BookmarkIcon, CloseIcon } from '../icons';
import { PostImage } from '../PostImage';

const noopSubscribe = () => () => {};

function SavedCard({ item, onRemove, buttonRef }: { item: SavedItem; onRemove: () => void; buttonRef: (el: HTMLButtonElement | null) => void }) {
  const date = formatDate(item.date);
  return (
    <article className="group relative flex items-center gap-4 rounded-(--radius-card) border border-line bg-surface p-3 shadow-(--shadow-card) transition-shadow duration-300 hover:shadow-(--shadow-lift) has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand-500 sm:p-4">
      <PostImage
        image={item.image ? { src: item.image, alt: '' } : undefined}
        sizes="(min-width: 640px) 144px, 112px"
        ratio="aspect-[4/3]"
        className="w-28 shrink-0 rounded-xl sm:w-36"
        zoom
      />
      <div className="min-w-0 flex-1">
        {item.category ? <p className="eyebrow mb-1">{item.category}</p> : null}
        <h2 className="line-clamp-3 text-[1rem] leading-[1.65] font-semibold text-ink transition-colors group-hover:text-brand-700 sm:text-[1.0625rem]">
          <Link href={routes.article(item.slug)} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {item.title}
          </Link>
        </h2>
        {item.author || date ? (
          <p className="mt-1.5 flex min-w-0 items-center gap-x-2.5 text-meta text-muted">
            {item.author ? <span className="truncate font-medium text-ink-soft">{item.author}</span> : null}
            {item.author && date ? (
              <span aria-hidden="true" className="text-line-strong">
                |
              </span>
            ) : null}
            {date ? (
              <time dateTime={isoDate(item.date)} className="shrink-0 whitespace-nowrap">
                {date}
              </time>
            ) : null}
          </p>
        ) : null}
      </div>
      <button
        ref={buttonRef}
        type="button"
        onClick={onRemove}
        aria-label={`إزالة «${item.title}» من المحفوظات`}
        title="إزالة من المحفوظات"
        className="icon-btn relative z-10 -me-1 self-start hover:bg-red-50 hover:text-danger"
      >
        <CloseIcon width={20} height={20} />
      </button>
    </article>
  );
}

/** The reader's saved articles with per-item removal and a confirmed "clear all". */
export function SavedList({ className = '' }: { className?: string }) {
  const items = useSaved();
  // localStorage is only readable after hydration; until then a skeleton keeps the layout stable.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const [confirming, setConfirming] = useState(false);
  const [flash, show] = useFlash();
  const regionRef = useRef<HTMLDivElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  // Where focus goes after the list changes: a slug's remove button, or the region itself (null).
  const pendingFocus = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (pendingFocus.current === undefined) return;
    const target = pendingFocus.current ? removeButtons.current.get(pendingFocus.current) : undefined;
    (target ?? regionRef.current)?.focus();
    pendingFocus.current = undefined;
  }, [items]);

  useEffect(() => {
    if (confirming) cancelButtonRef.current?.focus();
  }, [confirming]);

  const remove = (index: number) => {
    const item = items[index];
    pendingFocus.current = (items[index + 1] ?? items[index - 1])?.slug ?? null;
    removeSaved(item.slug);
    show('أُزيل المقال من المحفوظات');
  };

  const cancelClear = () => {
    setConfirming(false);
    // The "clear all" button is rendered again on the next commit.
    window.requestAnimationFrame(() => clearButtonRef.current?.focus());
  };

  const clearAll = () => {
    pendingFocus.current = null;
    setConfirming(false);
    clearSaved();
    show('تمّ مسح كل المحفوظات');
  };

  let content: React.ReactNode;
  if (!hydrated) {
    content = (
      <ul className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="card flex items-center gap-4 p-3 sm:p-4">
            <div className="skeleton aspect-[4/3] w-28 shrink-0 rounded-xl sm:w-36" />
            <div className="flex-1 space-y-2.5">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton h-4 w-[90%]" />
              <div className="skeleton h-3 w-32" />
            </div>
          </li>
        ))}
      </ul>
    );
  } else if (!items.length) {
    content = (
      <EmptyState
        icon={<BookmarkIcon width={26} height={26} />}
        title="لا توجد مقالات محفوظة بعد"
        description="اضغط على أيقونة الحفظ في أيّ مقال ليظهر هنا، فتعود إليه متى شئت."
        action={
          <Link href={routes.articles()} className="btn-primary">
            تصفّح المقالات
            <ArrowLeftIcon width={16} height={16} />
          </Link>
        }
      />
    );
  } else {
    content = (
      <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink-soft">{articlesLabel(items.length)} في المحفوظات</p>
          {confirming ? (
            <div
              role="group"
              aria-labelledby="clear-saved-question"
              onKeyDown={(event) => {
                if (event.key === 'Escape') cancelClear();
              }}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 animate-pop-in"
            >
              <p id="clear-saved-question" className="px-1 text-sm font-medium text-danger">
                هل تريد إزالة كل المقالات المحفوظة؟
              </p>
              <button type="button" onClick={clearAll} className="btn min-h-11 bg-danger px-4 text-white hover:bg-red-800">
                نعم، امسح الكل
              </button>
              <button ref={cancelButtonRef} type="button" onClick={cancelClear} className="btn-ghost px-4">
                إلغاء
              </button>
            </div>
          ) : (
            <button ref={clearButtonRef} type="button" onClick={() => setConfirming(true)} className="btn-outline">
              <CloseIcon width={16} height={16} />
              مسح الكل
            </button>
          )}
        </div>
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((item, index) => (
            <li key={item.slug}>
              <SavedCard
                item={item}
                onRemove={() => remove(index)}
                buttonRef={(el) => {
                  if (el) removeButtons.current.set(item.slug, el);
                  else removeButtons.current.delete(item.slug);
                }}
              />
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <div ref={regionRef} tabIndex={-1} aria-label="المقالات المحفوظة" role="region" className={`outline-none ${className}`}>
      {content}
      <Toast flash={flash} />
    </div>
  );
}
