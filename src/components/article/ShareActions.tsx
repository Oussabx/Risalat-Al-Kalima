'use client';

import { useSyncExternalStore } from 'react';
import { CheckIcon, FacebookIcon, LinkIcon, PrintIcon, ShareIcon, WhatsappIcon, XIcon } from '../icons';
import { canNativeShare, copyText, nativeShare, shareTargets, type ShareNetwork } from './share';
import { Toast, useFlash } from './Toast';

const NETWORK_ICONS: Record<ShareNetwork, typeof FacebookIcon> = { facebook: FacebookIcon, x: XIcon, whatsapp: WhatsappIcon };

const noopSubscribe = () => () => {};

const ROUND =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink-soft transition-colors duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700';

/** "Share this article" row: native share, copy link, Facebook, X, WhatsApp and print. */
export function ShareActions({ url, title, className = '' }: { url: string; title: string; className?: string }) {
  // The native share sheet only exists in some browsers; decided after hydration.
  const nativeAvailable = useSyncExternalStore(noopSubscribe, canNativeShare, () => false);
  const [flash, show] = useFlash(2200);
  const copied = flash?.tone === 'success';

  const onCopy = async () => {
    const ok = await copyText(url);
    show(ok ? 'تمّ النسخ' : 'تعذّر نسخ الرابط، انسخه من شريط العنوان.', ok ? 'success' : 'error');
  };

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 ${className}`}>
      <h2 className="text-base font-semibold text-ink">شارك المقال</h2>
      <ul className="flex flex-wrap items-center gap-2">
        {nativeAvailable ? (
          <li>
            <button type="button" onClick={() => void nativeShare({ title, url })} className="chip min-h-11">
              <ShareIcon width={18} height={18} />
              مشاركة
            </button>
          </li>
        ) : null}
        <li>
          <button type="button" onClick={onCopy} className={`chip min-h-11 ${copied ? 'border-success/40 text-success hover:text-success' : ''}`}>
            {copied ? <CheckIcon width={18} height={18} /> : <LinkIcon width={18} height={18} />}
            {copied ? 'تمّ النسخ' : 'نسخ الرابط'}
          </button>
        </li>
        {shareTargets(url, title).map((target) => {
          const Icon = NETWORK_ICONS[target.network];
          return (
            <li key={target.network}>
              <a href={target.href} target="_blank" rel="noopener noreferrer" aria-label={target.label} title={target.label} className={ROUND}>
                <Icon width={19} height={19} />
              </a>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={() => window.print()} aria-label="طباعة المقال" title="طباعة المقال" className={ROUND}>
            <PrintIcon width={19} height={19} />
          </button>
        </li>
      </ul>
      {/* The copy button's own label changes visibly; the live region announces it. */}
      <Toast flash={flash} visual={flash?.tone === 'error'} />
    </div>
  );
}
