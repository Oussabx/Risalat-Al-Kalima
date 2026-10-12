'use client';

import { useId, useRef, useState } from 'react';
import { AlertIcon, ArrowLeftIcon, CheckIcon } from '@/components/icons';
import {
  CONTACT_FIELDS,
  CONTACT_LIMITS,
  charCount,
  normalizeContact,
  pickContactErrors,
  validateContact,
  type ContactErrors,
  type ContactField,
  type ContactValues,
} from './validation';

type Status = { kind: 'idle' } | { kind: 'loading' } | { kind: 'success'; message: string } | { kind: 'error'; message: string };

const EMPTY: ContactValues = { name: '', email: '', subject: '', message: '' };
const ENDPOINT = '/api/contact/';

const FALLBACK: Record<number, string> = {
  429: 'أرسلت عدّة محاولات خلال وقت قصير. يرجى الانتظار دقيقة ثمّ المحاولة مجدّدًا.',
  503: 'نموذج الاتصال غير مفعّل حاليًا، ولم تُرسَل رسالتك. يرجى المحاولة لاحقًا.',
};
const GENERIC_ERROR = 'تعذّر إرسال رسالتك، ولم تصل إلى فريق التحرير. يرجى المحاولة لاحقًا.';
const NETWORK_ERROR = 'تعذّر الاتصال بالخادم، ولم تُرسَل رسالتك. تحقّق من اتصالك بالإنترنت وحاول مجدّدًا.';

/**
 * Contact form. Validates in the browser with the same rules as /api/contact,
 * shows per-field errors (including those returned by the server) and reports
 * success only when the API answered with a 2xx status. On error the input is
 * kept so nothing has to be typed again.
 */
export function ContactForm({ className = '' }: { className?: string }) {
  const id = useId();
  const [values, setValues] = useState<ContactValues>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const fields = useRef<Partial<Record<ContactField, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const honeypot = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const loading = status.kind === 'loading';
  const ids = (field: ContactField) => ({ input: `${id}-${field}`, error: `${id}-${field}-error` });
  const errorFor = (next: ContactValues, field: ContactField) => validateContact(normalizeContact(next))[field];

  function change(field: ContactField, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Re-check live only once the field has been visited or flagged, so typing is never interrupted early.
    if (touched[field] || errors[field]) setErrors((prev) => ({ ...prev, [field]: errorFor(next, field) }));
    if (status.kind === 'success' || status.kind === 'error') setStatus({ kind: 'idle' });
  }

  function blur(field: ContactField) {
    if (!values[field].trim()) return; // Tabbing through empty fields is not an error yet.
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: errorFor(values, field) }));
  }

  function focusFirstInvalid(found: ContactErrors) {
    const first = CONTACT_FIELDS.find((field) => found[field]);
    if (first) fields.current[first]?.focus();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const data = normalizeContact(values);
    const found = validateContact(data);
    setTouched({ name: true, email: true, subject: true, message: true });
    setErrors(found);
    if (Object.keys(found).length) {
      setStatus({ kind: 'idle' });
      focusFirstInvalid(found);
      return;
    }

    setStatus({ kind: 'loading' });
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...data, website: honeypot.current?.value ?? '' }),
      });
      const body = (await res.json().catch(() => null)) as { message?: unknown; errors?: unknown } | null;
      const message = typeof body?.message === 'string' && body.message.trim() ? body.message : '';

      if (res.ok) {
        setValues(EMPTY);
        setErrors({});
        setTouched({});
        setStatus({ kind: 'success', message: message || 'أُرسلت رسالتك إلى فريق التحرير. شكرًا لتواصلك معنا.' });
        requestAnimationFrame(() => successRef.current?.focus());
        return;
      }

      const serverErrors = res.status === 422 ? pickContactErrors(body?.errors) : {};
      setStatus({ kind: 'error', message: message || FALLBACK[res.status] || GENERIC_ERROR });
      if (Object.keys(serverErrors).length) {
        setErrors(serverErrors);
        requestAnimationFrame(() => focusFirstInvalid(serverErrors));
      } else {
        requestAnimationFrame(() => errorRef.current?.focus());
      }
    } catch {
      setStatus({ kind: 'error', message: NETWORK_ERROR });
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  const messageCount = charCount(values.message);
  const counterId = `${id}-message-count`;
  const overLimit = messageCount > CONTACT_LIMITS.message.max;

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={loading} className={`relative ${className}`}>
      <p className="mb-6 text-meta text-muted">جميع الحقول مطلوبة.</p>

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldShell label="الاسم" ids={ids('name')} error={errors.name}>
          <input
            ref={(el) => {
              fields.current.name = el;
            }}
            id={ids('name').input}
            name="name"
            type="text"
            autoComplete="name"
            required
            value={values.name}
            onChange={(e) => change('name', e.target.value)}
            onBlur={() => blur('name')}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? ids('name').error : undefined}
            className="field"
          />
        </FieldShell>

        <FieldShell label="البريد الإلكترونيّ" ids={ids('email')} error={errors.email}>
          <input
            ref={(el) => {
              fields.current.email = el;
            }}
            id={ids('email').input}
            name="email"
            type="email"
            dir="ltr"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="name@example.com"
            value={values.email}
            onChange={(e) => change('email', e.target.value)}
            onBlur={() => blur('email')}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? ids('email').error : undefined}
            className="field text-end"
          />
        </FieldShell>

        <FieldShell label="الموضوع" ids={ids('subject')} error={errors.subject} className="sm:col-span-2">
          <input
            ref={(el) => {
              fields.current.subject = el;
            }}
            id={ids('subject').input}
            name="subject"
            type="text"
            required
            value={values.subject}
            onChange={(e) => change('subject', e.target.value)}
            onBlur={() => blur('subject')}
            aria-invalid={errors.subject ? true : undefined}
            aria-describedby={errors.subject ? ids('subject').error : undefined}
            className="field"
          />
        </FieldShell>

        <FieldShell label="الرسالة" ids={ids('message')} error={errors.message} className="sm:col-span-2">
          <textarea
            ref={(el) => {
              fields.current.message = el;
            }}
            id={ids('message').input}
            name="message"
            rows={7}
            required
            value={values.message}
            onChange={(e) => change('message', e.target.value)}
            onBlur={() => blur('message')}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={[errors.message ? ids('message').error : '', counterId].filter(Boolean).join(' ')}
            className="field min-h-44 resize-y leading-relaxed"
          />
          <p id={counterId} className={`mt-1.5 flex justify-between gap-3 text-meta ${overLimit ? 'font-semibold text-danger' : 'text-muted'}`}>
            <span>بين {CONTACT_LIMITS.message.min} و{CONTACT_LIMITS.message.max} حرف.</span>
            <span className="tabular-nums">
              <span className="sr-only">عدد الأحرف: </span>
              {messageCount} من {CONTACT_LIMITS.message.max}
            </span>
          </p>
        </FieldShell>
      </div>

      {/* Honeypot: invisible to people and assistive technology, filled in by bots. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor={`${id}-website`}>موقعك الإلكترونيّ</label>
        <input ref={honeypot} id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div role="status" aria-live="polite" aria-atomic="true">
        {status.kind === 'success' ? (
          <div
            ref={successRef}
            tabIndex={-1}
            className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-[0.9375rem] leading-relaxed text-success outline-none focus-visible:ring-2 focus-visible:ring-green-300"
          >
            <CheckIcon width={20} height={20} className="mt-0.5 shrink-0" />
            <p>{status.message}</p>
          </div>
        ) : null}
      </div>
      <div role="alert" aria-atomic="true">
        {status.kind === 'error' ? (
          <div
            ref={errorRef}
            tabIndex={-1}
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-[0.9375rem] leading-relaxed text-danger outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            <AlertIcon width={20} height={20} className="mt-0.5 shrink-0" />
            <p>{status.message}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary min-h-12 px-7" disabled={loading}>
          {loading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              جارٍ الإرسال…
            </>
          ) : (
            <>
              أرسل الرسالة
              <ArrowLeftIcon width={18} height={18} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function FieldShell({
  label,
  ids,
  error,
  className = '',
  children,
}: {
  label: string;
  ids: { input: string; error: string };
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={ids.input} className="field-label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={ids.error} className="field-error flex items-start gap-1.5">
          <AlertIcon width={16} height={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
