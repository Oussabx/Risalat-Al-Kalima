'use client';

import { useId, useState } from 'react';
import { AlertIcon, ArrowLeftIcon, CheckIcon } from './icons';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type State = { status: 'idle' | 'loading' | 'success' | 'error'; message?: string };

/**
 * Newsletter sign-up. Posts to /api/newsletter, which reports success only
 * after the configured provider accepts the address.
 */
export function NewsletterForm({ tone = 'default', className = '' }: { tone?: 'default' | 'light'; className?: string }) {
  const id = useId();
  const [state, setState] = useState<State>({ status: 'idle' });
  const [email, setEmail] = useState('');
  const invalid = state.status === 'error' && state.message === 'invalid';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setState({ status: 'error', message: 'invalid' });
      return;
    }
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/newsletter/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, website: form.get('website') ?? '' }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (res.ok) {
        setState({ status: 'success', message: data.message ?? 'تمّ اشتراكك بنجاح.' });
        setEmail('');
      } else {
        setState({ status: 'error', message: data.message ?? 'تعذّر إتمام الاشتراك. حاول لاحقًا.' });
      }
    } catch {
      setState({ status: 'error', message: 'تعذّر الاتصال بالخادم. تحقّق من اتصالك وحاول مجدّدًا.' });
    }
  }

  const light = tone === 'light';
  const message = invalid ? 'يرجى إدخال بريد إلكترونيّ صحيح.' : state.message;

  return (
    <form onSubmit={onSubmit} noValidate className={className} aria-describedby={`${id}-status`}>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor={`${id}-email`} className="sr-only">
          البريد الإلكترونيّ
        </label>
        <input
          id={`${id}-email`}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state.status === 'error') setState({ status: 'idle' });
          }}
          aria-invalid={invalid || undefined}
          className={`field min-w-0 flex-1 text-start placeholder:text-end ${light ? 'border-white/30' : ''}`}
          required
        />
        {/* Honeypot: hidden from people, filled by bots. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <button type="submit" className={`${light ? 'btn-light' : 'btn-primary'} min-h-12 px-6`} disabled={state.status === 'loading'}>
          {state.status === 'loading' ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              جارٍ الاشتراك…
            </>
          ) : (
            <>
              اشترك
              <ArrowLeftIcon width={16} height={16} />
            </>
          )}
        </button>
      </div>
      <p
        id={`${id}-status`}
        role={state.status === 'error' ? 'alert' : 'status'}
        aria-live="polite"
        className={`mt-2.5 flex min-h-6 items-center gap-1.5 text-sm ${
          state.status === 'success' ? (light ? 'text-white' : 'text-success') : state.status === 'error' ? (light ? 'text-amber-100' : 'text-danger') : 'sr-only'
        }`}
      >
        {state.status === 'success' ? <CheckIcon width={16} height={16} /> : state.status === 'error' ? <AlertIcon width={16} height={16} /> : null}
        {state.status === 'success' || state.status === 'error' ? message : ''}
      </p>
    </form>
  );
}
