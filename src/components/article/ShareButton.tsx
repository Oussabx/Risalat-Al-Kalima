'use client';

import { ShareIcon } from '../icons';
import { canNativeShare, copyText, nativeShare } from './share';
import { Toast, useFlash } from './Toast';

/**
 * Compact share action: opens the native share sheet where the browser has
 * one, otherwise copies the article link and confirms it.
 */
export function ShareButton({ url, title, className = '' }: { url: string; title: string; className?: string }) {
  const [flash, show] = useFlash();

  const onClick = async () => {
    if (canNativeShare()) {
      const result = await nativeShare({ title, url });
      if (result !== 'failed') return;
    }
    const copied = await copyText(url);
    show(copied ? 'تمّ نسخ رابط المقال' : 'تعذّر نسخ الرابط', copied ? 'success' : 'error');
  };

  return (
    <>
      <button type="button" onClick={onClick} aria-label="مشاركة المقال" title="مشاركة المقال" className={`icon-btn ${className}`}>
        <ShareIcon width={22} height={22} />
      </button>
      <Toast flash={flash} />
    </>
  );
}
