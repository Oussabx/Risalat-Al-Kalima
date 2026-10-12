'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';

/**
 * Horizontally scrollable row without a scrollbar. Without JavaScript it is a
 * plain scroll box (touch, trackpad, Tab). With JavaScript it brings the
 * current chip (`aria-current="page"`) into view and, from `sm` up, shows
 * arrow buttons at the edges for mouse users.
 */
export function ScrollRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Centre the active chip horizontally only; the page itself never scrolls.
    const active = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) {
      const a = active.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      if (a.left < box.left || a.right > box.right) el.scrollLeft += a.left + a.width / 2 - (box.left + box.width / 2);
    }
    // scrollLeft is 0 at the start edge and negative towards the end in RTL.
    const update = () => {
      const offset = Math.abs(el.scrollLeft);
      const max = el.scrollWidth - el.clientWidth;
      setEdges((prev) => {
        const next = { start: offset > 2, end: max - offset > 2 };
        return prev.start === next.start && prev.end === next.end ? prev : next;
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', update);
    };
  }, []);

  function scrollTowards(edge: 'start' | 'end') {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    const forward = (edge === 'end' ? 1 : -1) * (rtl ? -1 : 1);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: forward * el.clientWidth * 0.7, behavior: reduce ? 'auto' : 'smooth' });
  }

  const edgeButton = 'absolute inset-y-0 z-10 hidden items-center sm:flex';
  const arrow = 'inline-flex size-9 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow-sm transition-colors hover:text-brand-700';

  return (
    <div className={`relative ${className}`}>
      <div ref={ref} className="no-scrollbar -mx-4 overflow-x-auto overscroll-x-contain sm:mx-0">
        {children}
      </div>
      {/* Pointer-only helpers: keyboard users reach every chip with Tab, which scrolls it into view. */}
      {edges.start ? (
        <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => scrollTowards('start')} className={`${edgeButton} start-0 bg-gradient-to-l from-canvas from-55% to-transparent pe-8`}>
          <span className={arrow}>
            <ChevronRightIcon width={18} height={18} />
          </span>
        </button>
      ) : null}
      {edges.end ? (
        <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => scrollTowards('end')} className={`${edgeButton} end-0 bg-gradient-to-r from-canvas from-55% to-transparent ps-8`}>
          <span className={arrow}>
            <ChevronLeftIcon width={18} height={18} />
          </span>
        </button>
      ) : null}
    </div>
  );
}
