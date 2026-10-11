'use client';

import { useEffect, useState } from 'react';
import type { Heading } from '@/lib/html';

/** Article outline with the current section highlighted while reading. */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string | null>(headings[0]?.id ?? null);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => Boolean(e));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -65% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;
  return (
    <nav aria-labelledby="toc-title">
      <p id="toc-title" className="mb-3 font-semibold text-ink">
        محتويات المقال
      </p>
      <ol className="relative space-y-1 border-s border-line">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? 'location' : undefined}
              className={`-ms-px block border-s-2 py-1.5 text-sm leading-6 transition ${h.level === 3 ? 'ps-7' : 'ps-4'} ${
                active === h.id ? 'border-brand-500 font-medium text-brand-700' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
