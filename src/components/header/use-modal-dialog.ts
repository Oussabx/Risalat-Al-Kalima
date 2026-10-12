'use client';

import { useEffect, useEffectEvent, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Visible, tabbable elements inside `root`, in DOM order. */
export function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0 && !el.closest('[inert]'));
}

type Options = {
  onClose: () => void;
  /** Element focused when the dialog opens (defaults to the first focusable element). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Element focused when the dialog closes. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** Prefer the element that had focus before opening (e.g. after a keyboard shortcut) over `returnFocusRef`. */
  restorePrevious?: boolean;
};

/**
 * Modal behaviour for a dialog that is mounted only while open (rendered in a
 * portal directly under <body>): moves focus in, traps Tab, closes on Escape,
 * locks page scrolling, makes the rest of the page inert and restores focus.
 */
export function useModalDialog(rootRef: RefObject<HTMLElement | null>, { onClose, initialFocusRef, returnFocusRef, restorePrevious = false }: Options) {
  const close = useEffectEvent(onClose);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const active = document.activeElement;
    const previous = active instanceof HTMLElement && active !== document.body ? active : null;
    const returnTarget = returnFocusRef?.current ?? null;

    // Scroll lock. `scrollbar-gutter: stable` on <html> keeps the layout from shifting.
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = 'hidden';

    // Everything outside the dialog becomes inert (unreachable by keyboard, pointer and assistive tech).
    const inerted: HTMLElement[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el === root || !(el instanceof HTMLElement) || el instanceof HTMLScriptElement || el.inert) continue;
      el.inert = true;
      inerted.push(el);
    }

    (initialFocusRef?.current ?? focusableWithin(root)[0] ?? root).focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusableWithin(root);
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !root.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !root.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      html.style.overflow = previousOverflow;
      for (const el of inerted) el.inert = false;
      const candidates = restorePrevious ? [previous, returnTarget] : [returnTarget, previous];
      const target = candidates.find((el): el is HTMLElement => Boolean(el?.isConnected && el.getClientRects().length));
      target?.focus({ preventScroll: true });
    };
  }, [rootRef, initialFocusRef, returnFocusRef, restorePrevious]);
}
