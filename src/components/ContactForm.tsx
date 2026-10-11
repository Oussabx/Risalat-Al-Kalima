'use client';

import { useState } from 'react';
import { AlertIcon, ArrowLeft, CheckIcon } from '@/components/icons';

type Fields = { name: string; email: string; subject: string; message: string; website: string };
type Errors = Partial<Record<keyof Fields, string>>;
type Status = { kind: 'idle' } | { kind: 'loading' } | { kind: 'success'; message: string } | { kind: 'error'; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = 'يرجى كتابة اسمك.';
  if (!EMAIL.test(f.email.trim())) e.email = 'يرجى إدخال بريد إلكترونيّ صحيح.';
  if (f.subject.trim().length < 3) e.subject = 'يرجى كتابة موضوع الرسالة.';
  if (f.message.trim().length < 10) e.message = 'الرسالة قصيرة جدًّا (10 أحرف على الأقلّ).';
  return e;
}

export function ContactForm() {
  const [fields, setFields] = useState<Fields>({ name: '', email: '', subject: '', message: '', website: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus({ kind: 'loading' });
    try {
      const res = await fetch('/api/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; errors?: Errors };
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.message || 'تعذّر إرسال رسالتك الآن.');
      }
      setStatus({ kind: 'success', message: data.message || 'وصلت رسالتك. شكرًا لتواصلك معنا!' });
      setFields({ name: '', email: '', subject: '', message: '', website: '' });
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error).message });
    }
  };

  if (status.kind === 'success') {
    return (
      <div role="status" className="py-10 text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckIcon size={28} />
        </span>
        <p className="mt-4 text-lg font-semibold text-ink">{status.message}</p>
        <button type="button" onClick={() => setStatus({ kind: 'idle' })} className="mt-6 text-sm font-medium text-brand-700 underline underline-offset-4">
          إرسال رسالة أخرى
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <h2 className="text-xl font-bold text-ink">أرسل رسالة</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="الاسم" name="name" value={fields.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        <Field label="البريد الإلكترونيّ" name="email" type="email" dir="ltr" value={fields.email} onChange={set('email')} error={errors.email} autoComplete="email" />
      </div>
      <Field label="الموضوع" name="subject" value={fields.subject} onChange={set('subject')} error={errors.subject} />
      <Field label="الرسالة" name="message" textarea value={fields.message} onChange={set('message')} error={errors.message} />
      {/* Honeypot: hidden from people, filled by bots. */}
      <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label>
          الموقع
          <input tabIndex={-1} autoComplete="off" name="website" value={fields.website} onChange={set('website')} />
        </label>
      </div>
      {status.kind === 'error' && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-800">
          <AlertIcon size={18} className="mt-0.5 shrink-0" /> {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={status.kind === 'loading'}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 font-semibold text-white transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {status.kind === 'loading' ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden /> جارٍ الإرسال…
          </>
        ) : (
          <>
            إرسال الرسالة <ArrowLeft size={18} />
          </>
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  textarea,
  ...props
}: {
  label: string;
  name: string;
  error?: string;
  textarea?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  dir?: string;
  autoComplete?: string;
}) {
  const id = `contact-${name}`;
  const cls = `w-full rounded-xl border bg-white px-4 text-[0.95rem] text-ink outline-none transition focus:ring-4 ${
    error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-line focus:border-brand-500 focus:ring-brand-100'
  }`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {textarea ? (
        <textarea id={id} name={name} rows={6} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} className={`${cls} py-3 leading-7`} {...props} />
      ) : (
        <input id={id} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} className={`${cls} h-12 ${props.dir === 'ltr' ? 'text-right' : ''}`} {...props} />
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
