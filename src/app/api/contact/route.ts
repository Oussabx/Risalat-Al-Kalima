import { NextResponse } from 'next/server';
import { normalizeContact, validateContact, type ContactValues } from '@/components/contact/validation';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { site } from '@/lib/site';

/**
 * Contact form endpoint. Delivers the message through the provider chosen by
 * CONTACT_PROVIDER and reports success only when that provider confirmed it:
 *  - 'cf7'     → the Contact Form 7 REST endpoint of the WordPress site (CF7_FORM_ID)
 *  - 'webhook' → a JSON POST to CONTACT_WEBHOOK_URL (2xx = delivered)
 */

export const dynamic = 'force-dynamic';

const TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 32_000;

const MESSAGES = {
  sent: 'أُرسلت رسالتك إلى فريق التحرير. شكرًا لتواصلك معنا.',
  invalid: 'يرجى تصحيح الحقول المشار إليها ثمّ إعادة الإرسال.',
  badRequest: 'تعذّرت قراءة الطلب، ولم تُرسَل رسالتك.',
  rateLimited: 'أرسلت عدّة محاولات خلال وقت قصير. يرجى الانتظار دقيقة ثمّ المحاولة مجدّدًا.',
  disabled: 'نموذج الاتصال غير مفعّل حاليًا، ولم تُرسَل رسالتك. يرجى المحاولة لاحقًا.',
  providerFailed: 'تعذّر إرسال رسالتك إلى فريق التحرير بسبب خلل في خدمة البريد، ولم تصل الرسالة. يرجى المحاولة لاحقًا.',
};

const json = (status: number, body: Record<string, unknown>, headers?: HeadersInit) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

type Delivery = { ok: true } | { ok: false; status: 422 | 502; message: string; errors?: Record<string, string> };

export async function POST(request: Request) {
  const limit = rateLimit(`contact:${clientKey(request)}`, 3);
  if (!limit.ok) return json(429, { message: MESSAGES.rateLimited }, { 'Retry-After': String(limit.retryAfter) });

  const body = await readJson(request);
  if (!body) return json(400, { message: MESSAGES.badRequest });

  // Honeypot: people never see this field; anything in it means an automated submission.
  if (typeof body.website === 'string' && body.website.trim()) return json(400, { message: MESSAGES.badRequest });

  const values = normalizeContact(body);
  const errors = validateContact(values);
  if (Object.keys(errors).length) return json(422, { message: MESSAGES.invalid, errors });

  const provider = process.env.CONTACT_PROVIDER?.trim().toLowerCase();
  let result: Delivery;
  try {
    if (provider === 'cf7' && process.env.WP_API_URL && process.env.CF7_FORM_ID) result = await sendViaCf7(values);
    else if (provider === 'webhook' && process.env.CONTACT_WEBHOOK_URL) result = await sendViaWebhook(values, request);
    else return json(503, { message: MESSAGES.disabled });
  } catch (error) {
    console.error('[contact] provider error', (error as Error).message);
    return json(502, { message: MESSAGES.providerFailed });
  }

  if (!result.ok) return json(result.status, { message: result.message, ...(result.errors ? { errors: result.errors } : {}) });
  return json(200, { message: MESSAGES.sent });
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get('content-type')?.includes('application/json')) return null;
  const length = Number(request.headers.get('content-length'));
  if (length > MAX_BODY_BYTES) return null;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return null;
    const data: unknown = JSON.parse(text);
    return data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** CF7 field name → our field, for mapping its validation errors back onto the form. */
const CF7_FIELDS: Record<string, keyof ContactValues> = {
  'your-name': 'name',
  'your-email': 'email',
  'your-subject': 'subject',
  'your-message': 'message',
};

async function sendViaCf7(values: ContactValues): Promise<Delivery> {
  const api = process.env.WP_API_URL!.trim().replace(/\/$/, '');
  const formId = encodeURIComponent(process.env.CF7_FORM_ID!.trim());

  const form = new FormData();
  form.set('your-name', values.name);
  form.set('your-email', values.email);
  form.set('your-subject', values.subject);
  form.set('your-message', values.message);
  // CF7 5.8+ rejects submissions without a unit tag.
  form.set('_wpcf7_unit_tag', `wpcf7-f${formId}-o1`);

  const res = await fetch(`${api}/contact-form-7/v1/contact-forms/${formId}/feedback`, {
    method: 'POST',
    body: form,
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = (await res.json().catch(() => null)) as {
    status?: string;
    message?: string;
    invalid_fields?: { field?: string; into?: string; message?: string }[];
  } | null;

  if (res.ok && data?.status === 'mail_sent') return { ok: true };

  if (data?.status === 'validation_failed') {
    const errors: Record<string, string> = {};
    for (const item of data.invalid_fields ?? []) {
      // Newer CF7 sends `field`; older versions only `into`, e.g. span.wpcf7-form-control-wrap[data-name="your-name"].
      const name = item.field ?? item.into?.match(/data-name="([^"]+)"/)?.[1] ?? item.into?.replace(/^.*\./, '');
      const field = name ? CF7_FIELDS[name] : undefined;
      if (field && item.message) errors[field] = item.message;
    }
    return { ok: false, status: 422, message: data.message || MESSAGES.invalid, errors };
  }

  console.error('[contact] cf7 refused', res.status, data?.status ?? 'no-json');
  return { ok: false, status: 502, message: MESSAGES.providerFailed };
}

async function sendViaWebhook(values: ContactValues, request: Request): Promise<Delivery> {
  const res = await fetch(process.env.CONTACT_WEBHOOK_URL!.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      ...values,
      site: site.url,
      submittedAt: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.ok) return { ok: true };
  console.error('[contact] webhook refused', res.status);
  return { ok: false, status: 502, message: MESSAGES.providerFailed };
}
