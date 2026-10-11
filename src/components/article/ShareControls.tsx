'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckIcon, FacebookIcon, LinkIcon, PrintIcon, ShareIcon, WhatsappIcon, XIcon } from '@/components/icons';

/**
 * Uses the native share sheet where available; otherwise opens a small menu
 * with copy-link, social share links and print.
 */
export function ShareControls({ title, url, variant = 'icon', align = 'start' }: { title: string; url: string; variant?: 'icon' | 'full'; align?: 'start' | 'end' }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const absolute = () => (url.startsWith('http') ? url : `${window.location.origin}${url}`);

  const share = async () => {
    const data = { title, url: absolute() };
    if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    setOpen((v) => !v);
  };

  const copy = async () => {
    const link = absolute();
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const input = document.createElement('textarea');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const enc = (s: string) => encodeURIComponent(s);
  const links = () => {
    const u = absolute();
    return [
      { label: 'فيسبوك', Icon: FacebookIcon, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(u)}` },
      { label: 'إكس', Icon: XIcon, href: `https://x.com/intent/post?text=${enc(title)}&url=${enc(u)}` },
      { label: 'واتساب', Icon: WhatsappIcon, href: `https://wa.me/?text=${enc(`${title} ${u}`)}` },
    ];
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={share}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={variant === 'icon' ? 'مشاركة المقال' : undefined}
        title="مشاركة"
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white text-ink-soft transition hover:border-brand-300 hover:text-brand-700 active:scale-95 ${
          variant === 'icon' ? 'h-11 w-11' : 'h-11 px-4 text-sm font-medium'
        }`}
      >
        <ShareIcon size={18} />
        {variant === 'full' && 'مشاركة'}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'تمّ نسخ الرابط' : ''}
      </span>
      {open && (
        <div
          role="menu"
          className={`absolute bottom-full z-30 mb-2 w-56 animate-fade-in rounded-2xl border border-line bg-white p-1.5 shadow-[var(--shadow-lift)] sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2 ${
            align === 'start' ? 'start-0' : 'end-0'
          }`}
        >
          <button type="button" role="menuitem" onClick={copy} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-brand-50">
            {copied ? <CheckIcon size={18} className="text-emerald-600" /> : <LinkIcon size={18} className="text-muted" />}
            {copied ? 'تمّ نسخ الرابط' : 'نسخ الرابط'}
          </button>
          {links().map(({ label, Icon, href }) => (
            <a key={label} role="menuitem" href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-brand-50">
              <Icon size={18} className="text-muted" />
              {label}
            </a>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              window.print();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-brand-50"
          >
            <PrintIcon size={18} className="text-muted" />
            طباعة المقال
          </button>
        </div>
      )}
    </div>
  );
}
