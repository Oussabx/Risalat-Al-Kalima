'use client';

import { useId, useState } from 'react';
import { AlertIcon, ArrowLeft, CheckIcon } from '@/components/icons';

type Status = { kind: 'idle' } | { kind: 'loading' } | { kind: 'success'; message: string } | { kind: 'error'; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Posts to /api/newsletter, which forwards to the configured provider. Success
 * is shown only when the provider confirms the subscription.
 */
export function NewsletterForm({ tone = 'light', compact = false }: { tone?: 'light' | 'dark'; compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const id = useId();
  const dark = tone === 'dark';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setStatus({ kind: 'error', message: 'يرجى إدخال بريد إلكترونيّ صحيح، مثل name@example.com' });
      return;
    }
    setStatus({ kind: 'loading' });
    try {
      const res = await fetch('/api/newsletter/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(data.message || 'تعذّر إتمام الاشتراك الآن. حاول لاحقًا.');
      setStatus({ kind: 'success', message: data.message || 'تمّ اشتراكك بنجاح. شكرًا لك!' });
      setEmail('');
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message || 'تعذّر الاتصال بالخادم.' });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <label htmlFor={id} className="sr-only">
        البريد الإلكترونيّ
      </label>
      <div className={`flex gap-2 ${compact ? 'flex-col sm:flex-row' : 'flex-col sm:flex-row'}`}>
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status.kind === 'error') setStatus({ kind: 'idle' });
          }}
          placeholder="name@example.com"
          aria-invalid={status.kind === 'error'}
          aria-describedby={`${id}-status`}
          className={`h-12 min-w-0 flex-1 rounded-xl border px-4 text-start text-[0.95rem] outline-none transition placeholder:text-start focus:ring-4 ${
            dark
              ? 'border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-white/60 focus:ring-white/15'
              : 'border-line bg-white text-ink placeholder:text-muted focus:border-brand-500 focus:ring-brand-100'
          } ${status.kind === 'error' ? (dark ? 'border-red-300' : 'border-red-400') : ''}`}
          style={{ textAlign: 'right' }}
        />
        <button
          type="submit"
          disabled={status.kind === 'loading'}
          className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 font-semibold transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 ${
            dark ? 'bg-white text-brand-800 hover:bg-brand-50' : 'bg-brand-600 text-white hover:bg-brand-700'
          }`}
        >
          {status.kind === 'loading' ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
              جارٍ الاشتراك…
            </>
          ) : (
            <>
              اشترك
              <ArrowLeft size={18} />
            </>
          )}
        </button>
      </div>
      <p id={`${id}-status`} role="status" aria-live="polite" className="min-h-6 pt-2 text-sm">
        {status.kind === 'success' && (
          <span className={`inline-flex items-center gap-1.5 ${dark ? 'text-emerald-200' : 'text-emerald-700'}`}>
            <CheckIcon size={16} /> {status.message}
          </span>
        )}
        {status.kind === 'error' && (
          <span className={`inline-flex items-center gap-1.5 ${dark ? 'text-red-200' : 'text-red-700'}`}>
            <AlertIcon size={16} /> {status.message}
          </span>
        )}
      </p>
    </form>
  );
}
