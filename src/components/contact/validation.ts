/**
 * Contact form rules, shared by the browser form (ContactForm) and the
 * /api/contact route so both always accept and reject exactly the same input.
 * Pure functions only: safe on the server and in client components.
 */

export const CONTACT_FIELDS = ['name', 'email', 'subject', 'message'] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];
export type ContactValues = Record<ContactField, string>;
export type ContactErrors = Partial<Record<ContactField, string>>;

export const CONTACT_LIMITS = {
  name: { min: 2, max: 120 },
  email: { max: 254 },
  subject: { min: 3, max: 200 },
  message: { min: 10, max: 5000 },
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/** Length as people count it: an emoji or any other astral character counts once. */
export function charCount(value: string): number {
  return Array.from(value).length;
}

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= CONTACT_LIMITS.email.max && EMAIL.test(email);
}

const asText = (value: unknown) => (typeof value === 'string' ? value : '');
/** Single-line fields: no control characters or line breaks (they would end up in mail headers). */
const asLine = (value: unknown) => asText(value).replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();

/** Normalises raw input (form state or a request body) before validation and delivery. */
export function normalizeContact(input: Partial<Record<ContactField, unknown>>): ContactValues {
  return {
    name: asLine(input.name),
    email: asLine(input.email).replace(/\s/g, ''),
    subject: asLine(input.subject),
    message: asText(input.message).replace(/\r\n?/g, '\n').replace(CONTROL, '').trim(),
  };
}

function lengthError(value: string, limits: { min: number; max: number }, messages: { empty: string; short: string; long: string }) {
  const n = charCount(value);
  if (n === 0) return messages.empty;
  if (n < limits.min) return messages.short;
  if (n > limits.max) return messages.long;
  return undefined;
}

/** Field → Arabic error message, for every invalid field (empty object when valid). */
export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};

  const name = lengthError(values.name, CONTACT_LIMITS.name, {
    empty: 'يرجى كتابة اسمك.',
    short: 'الاسم قصير جدًّا: حرفان على الأقلّ.',
    long: 'الاسم طويل جدًّا: 120 حرفًا على الأكثر.',
  });
  if (name) errors.name = name;

  if (!values.email) errors.email = 'يرجى كتابة بريدك الإلكترونيّ.';
  else if (!isValidEmail(values.email)) errors.email = 'يرجى إدخال بريد إلكترونيّ صحيح، مثل name@example.com.';

  const subject = lengthError(values.subject, CONTACT_LIMITS.subject, {
    empty: 'يرجى كتابة موضوع الرسالة.',
    short: 'الموضوع قصير جدًّا: 3 أحرف على الأقلّ.',
    long: 'الموضوع طويل جدًّا: 200 حرف على الأكثر.',
  });
  if (subject) errors.subject = subject;

  const message = lengthError(values.message, CONTACT_LIMITS.message, {
    empty: 'يرجى كتابة رسالتك.',
    short: 'الرسالة قصيرة جدًّا: 10 أحرف على الأقلّ.',
    long: 'الرسالة طويلة جدًّا: 5000 حرف على الأكثر.',
  });
  if (message) errors.message = message;

  return errors;
}

/** Keeps only known fields with string messages (for errors received from the server). */
export function pickContactErrors(value: unknown): ContactErrors {
  if (!value || typeof value !== 'object') return {};
  const errors: ContactErrors = {};
  for (const field of CONTACT_FIELDS) {
    const message = (value as Record<string, unknown>)[field];
    if (typeof message === 'string' && message.trim()) errors[field] = message.trim().slice(0, 300);
  }
  return errors;
}
