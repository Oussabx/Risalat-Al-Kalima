'use client';

import { useEffect } from 'react';

/**
 * Adds the gentle reveal-on-scroll to every [data-reveal] element. Content is
 * visible by default; it is only hidden once this script runs, so nothing
 * disappears without JavaScript or under reduced motion.
 */
export function RevealObserver() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const root = document.documentElement;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    const scan = () => {
      document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add('is-visible');
        else io.observe(el);
      });
    };
    scan();
    root.classList.add('js-reveal');
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
