'use client';

import { useEffect, useState } from 'react';

/** Share of the article body that has scrolled past the reader, 0–100. */
export function useReadingProgress(targetId = 'article-body') {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const passed = -rect.top + window.innerHeight * 0.25;
      setProgress(Math.round(Math.min(100, Math.max(0, (passed / Math.max(total, 1)) * 100))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetId]);
  return progress;
}

/** Thin bar pinned to the top edge of the viewport. */
export function ReadingProgressBar() {
  const progress = useReadingProgress();
  return (
    <div
      className="no-print fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent"
      role="progressbar"
      aria-label="تقدّم القراءة"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      <div className="h-full origin-right bg-brand-500 transition-transform duration-150 ease-out" style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}

/** Labelled percentage used in the sidebar and the mobile action bar. */
export function ReadingProgressMeter({ compact = false }: { compact?: boolean }) {
  const progress = useReadingProgress();
  return (
    <div className={compact ? 'flex items-center gap-2' : ''}>
      {!compact && (
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span>نسبة القراءة</span>
          <span className="font-semibold tabular-nums text-ink">{progress}%</span>
        </div>
      )}
      <div className={`overflow-hidden rounded-full bg-brand-100 ${compact ? 'h-1.5 w-16' : 'h-1.5'}`} aria-hidden>
        <div className="h-full rounded-full bg-brand-500 transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>
      {compact && <span className="text-xs font-semibold tabular-nums text-ink-soft">{progress}%</span>}
    </div>
  );
}
