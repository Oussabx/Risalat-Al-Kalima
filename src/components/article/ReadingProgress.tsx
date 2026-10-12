'use client';

import { useSyncExternalStore } from 'react';

/** id of the element holding the article text; progress is measured against it, not the whole page. */
export const ARTICLE_BODY_ID = 'article-body';

/** Approximate height of the sticky header: reading "starts" when the text reaches it. */
const TOP_OFFSET = 96;

/*
 * One shared, requestAnimationFrame-throttled scroll listener feeds every
 * progress bar on the page. Values are whole percentages, so bars re-render
 * at most 100 times over the whole article.
 */
let percent = 0;
let frame = 0;
let observed: Element | null = null;
let resizeObserver: ResizeObserver | null = null;
const listeners = new Set<() => void>();

function measure() {
  frame = 0;
  const body = document.getElementById(ARTICLE_BODY_ID);
  if (body !== observed && resizeObserver) {
    // Images and embeds change the text's height after load.
    if (observed) resizeObserver.unobserve(observed);
    if (body) resizeObserver.observe(body);
    observed = body;
  }
  let next = 0;
  if (body) {
    const rect = body.getBoundingClientRect();
    const viewport = window.innerHeight;
    const distance = rect.height - viewport + TOP_OFFSET;
    next = distance <= 0 ? (rect.top < viewport ? 100 : 0) : Math.round(Math.min(1, Math.max(0, (TOP_OFFSET - rect.top) / distance)) * 100);
  }
  if (next !== percent) {
    percent = next;
    for (const listener of listeners) listener();
  }
}

function schedule() {
  if (!frame) frame = window.requestAnimationFrame(measure);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    if ('ResizeObserver' in window) resizeObserver = new ResizeObserver(schedule);
    measure();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size) return;
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    resizeObserver?.disconnect();
    resizeObserver = null;
    observed = null;
    window.cancelAnimationFrame(frame);
    frame = 0;
    percent = 0;
  };
}

/** Reading progress through the article text, 0–100 (0 on the server). */
export function useReadingProgress(): number {
  return useSyncExternalStore(
    subscribe,
    () => percent,
    () => 0,
  );
}

function Fill({ value, className }: { value: number; className: string }) {
  return <div className={`h-full ltr:origin-left rtl:origin-right ${className}`} style={{ transform: `scaleX(${value / 100})` }} />;
}

/** Thin bar fixed to the top of the viewport. This one carries the progressbar semantics. */
export function TopReadingProgress() {
  const value = useReadingProgress();
  return (
    <div
      role="progressbar"
      aria-label="نسبة قراءة المقال"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value}%`}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] print:hidden"
    >
      <Fill value={value} className="bg-brand-500 transition-transform duration-150 ease-out" />
    </div>
  );
}

/**
 * Visual-only progress with a label and percentage (the sidebar and the
 * mobile row under the hero); hidden from assistive tech to avoid duplicates.
 */
export function InlineReadingProgress({ layout = 'sidebar', className = '' }: { layout?: 'sidebar' | 'mobile'; className?: string }) {
  const value = useReadingProgress();
  const bar = (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-100">
      <Fill value={value} className="rounded-full bg-brand-500 transition-transform duration-150 ease-out" />
    </div>
  );
  const number = <span className="text-sm font-semibold text-ink tabular-nums">{value}%</span>;

  if (layout === 'mobile') {
    return (
      <div aria-hidden="true" className={className}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-meta font-medium text-ink-soft">نسبة القراءة</span>
          {number}
        </div>
        <div className="flex">{bar}</div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={className}>
      <p className="mb-2 text-meta font-medium text-ink-soft">نسبة القراءة</p>
      <div className="flex items-center gap-3">
        {bar}
        <span className="min-w-[2.75rem] text-end">{number}</span>
      </div>
    </div>
  );
}
