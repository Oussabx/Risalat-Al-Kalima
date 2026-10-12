'use client';

import { useEffect, useRef, useState } from 'react';
import type { Heading } from '@/lib/html';
import { ChevronDownIcon } from '../icons';

/** The heading currently being read: the last one that has passed the top zone of the viewport. */
function currentHeading(headings: Heading[], visible: Map<string, boolean>): string | null {
  const inZone = headings.find((h) => visible.get(h.id));
  if (inZone) return inZone.id;
  let last: string | null = null;
  for (const h of headings) {
    const el = document.getElementById(h.id);
    if (el && el.getBoundingClientRect().top < 140) last = h.id;
  }
  return last;
}

/**
 * "محتويات المقال": links to the article's h2/h3 headings with the heading
 * being read highlighted (IntersectionObserver), smooth scrolling (unless
 * reduced motion is requested) and focus moved to the target heading.
 *
 *  - list:        always open (desktop sidebar)
 *  - collapsible: a closed <details> above the text (phones and tablets)
 */
export function TableOfContents({ headings, variant = 'list', className = '' }: { headings: Heading[]; variant?: 'list' | 'collapsible'; className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!headings.length || !('IntersectionObserver' in window)) return;
    const visible = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
        setActive(currentHeading(headings, visible));
      },
      // A band across the upper part of the viewport, below the sticky header.
      { rootMargin: '-96px 0px -60% 0px' },
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    // Collapse the mobile list first so the measured position is final.
    if (detailsRef.current) detailsRef.current.open = false;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Only the heading's scroll-margin (clears the sticky header); scrollIntoView would add the page's scroll-padding too.
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - margin, behavior: reduce ? 'auto' : 'smooth' });
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
