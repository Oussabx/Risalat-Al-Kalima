'use client';

import { useEffect, useRef, useState } from 'react';
import type { Heading } from '@/lib/html';
import { ChevronDownIcon } from '../icons';

/** Headings at or above this line (just below the sticky header) count as passed. */
const READ_LINE = 140;

/** The heading currently being read: the last one whose top has passed the reading line. */
function currentHeading(headings: Heading[]): string | null {
  let last: string | null = null;
  for (const h of headings) {
    const el = document.getElementById(h.id);
    if (!el) continue;
    if (el.getBoundingClientRect().top >= READ_LINE) break;
    last = h.id;
  }
  return last;
}

/** Space to leave above a heading: its own scroll-margin, else the page's scroll-padding (both clear the sticky header). */
function topOffset(target: HTMLElement): number {
  return parseFloat(getComputedStyle(target).scrollMarginTop) || parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
}

/**
 * "محتويات المقال": links to the article's h2/h3 headings with the heading
 * being read highlighted (recomputed on scroll, so jumps such as Home/End,
 * deep links and restored scroll positions are covered too), smooth
 * scrolling (unless reduced motion is requested) and focus moved to the
 * target heading.
 *
 *  - list:        always open (desktop sidebar)
 *  - collapsible: a closed <details> above the text (phones and tablets)
 */
export function TableOfContents({ headings, variant = 'list', className = '' }: { headings: Heading[]; variant?: 'list' | 'collapsible'; className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!headings.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      setActive(currentHeading(headings));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    // Once after mount for #hash links and restored scroll positions, then on every scroll (one measurement per frame).
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [headings]);

  if (!headings.length) return null;

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    // Collapse the mobile list first so the measured position is final.
    if (detailsRef.current) detailsRef.current.open = false;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // One offset only: scrollIntoView would add the heading's scroll-margin and the page's scroll-padding together.
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - topOffset(target), behavior: reduce ? 'auto' : 'smooth' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    window.history.replaceState(window.history.state, '', `#${encodeURIComponent(id)}`);
    setActive(id);
  };

  const list = (
    <ol className="relative border-s border-line">
      {headings.map((h) => {
        const isActive = h.id === active;
        return (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(event) => onClick(event, h.id)}
              aria-current={isActive ? 'location' : undefined}
              className={`relative flex min-h-10 items-center py-1.5 text-sm leading-relaxed transition-colors duration-200 ${h.level === 3 ? 'ps-8' : 'ps-5'} ${
                isActive ? 'font-semibold text-brand-700' : 'text-ink-soft hover:text-brand-700'
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-1/2 -translate-y-1/2 rounded-full transition-[background-color,transform] duration-200 ${
                  h.level === 3 ? '-start-[3.5px] size-1.5' : '-start-[4.5px] size-2'
                } ${isActive ? 'scale-125 bg-brand-500' : 'bg-line-strong'}`}
              />
              <span className="line-clamp-2">{h.text}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  if (variant === 'collapsible') {
    return (
      <nav aria-label="محتويات المقال" className={className}>
        <details ref={detailsRef} className="group rounded-(--radius-card) border border-line bg-surface-2/60">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
            محتويات المقال
            <ChevronDownIcon width={18} height={18} className="text-muted transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-3">{list}</div>
        </details>
      </nav>
    );
  }

  return (
    <nav aria-labelledby="toc-title" className={className}>
      <h2 id="toc-title" className="mb-3 text-base font-bold text-ink">
        محتويات المقال
      </h2>
      {list}
    </nav>
  );
}
