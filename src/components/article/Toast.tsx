'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertIcon, CheckIcon } from '../icons';

export type Flash = { id: number; text: string; tone: 'success' | 'error' } | null;

/** A short confirmation message that clears itself after `duration` ms. */
export function useFlash(duration = 2600) {
  const [flash, setFlash] = useState<Flash>(null);
  const timer = useRef<number | undefined>(undefined);
  const counter = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = useCallback(
    (text: string, tone: 'success' | 'error' = 'success') => {
      window.clearTimeout(timer.current);
      counter.current += 1;
      setFlash({ id: counter.current, text, tone });
      timer.current = window.setTimeout(() => setFlash(null), duration);
    },
    [duration],
  );

  return [flash, show] as const;
}

/**
 * Announces a flash message through a polite live region and, unless `visual`
 * is false, shows it as a small floating toast. The toast is portalled to
 * <body> so transformed ancestors (sliding bars) cannot misplace it.
 */
export function Toast({ flash, visual = true }: { flash: Flash; visual?: boolean }) {
  return (
    <>
      <span role="status" aria-live="polite" className="sr-only">
        {/* A fresh key re-announces repeated messages. */}
        {flash ? <span key={flash.id}>{flash.text}</span> : null}
      </span>
      {visual && flash
        ? createPortal(
            <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 lg:bottom-8 print:hidden">
              <div
                key={flash.id}
                className="inline-flex animate-pop-in items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-(--shadow-lift)"
              >
                {flash.tone === 'error' ? (
                  <AlertIcon width={16} height={16} className="text-amber-300" />
                ) : (
                  <CheckIcon width={16} height={16} className="text-brand-300" />
                )}
                {flash.text}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
