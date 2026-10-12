import { NextResponse } from 'next/server';
import { isValidEmail } from '@/components/contact/validation';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { site } from '@/lib/site';

/**
 * Newsletter sign-up. Subscribes the address with the provider chosen by
 * NEWSLETTER_PROVIDER and reports success only when that provider accepted it:
 *  - 'mailchimp'          → Mailchimp Marketing API, double opt-in (status 'pending')
 *  - 'brevo'              → Brevo contacts API (adds the contact to BREVO_LIST_ID)
 *  - 'mailpoet' | 'webhook' → a JSON POST to NEWSLETTER_WEBHOOK_URL (e.g. a MailPoet bridge on WordPress)
 * Response shape: { message }.
 */

export const dynamic = 'force-dynamic';

const TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 4_000;

const MESSAGES = {
  subscribed: 'تمّ اشتراكك في النشرة البريديّة. شكرًا لك!',
  confirm: 'شكرًا لك! أرسلنا رسالة تأكيد إلى بريدك الإلكترونيّ؛ يرجى فتحها وتأكيد الاشتراك.',
  exists: 'أنت مشترك مسبقًا في النشرة البريديّة.',
  invalid: 'يرجى إدخال بريد إلكترونيّ صحيح.',
  badRequest: 'تعذّرت قراءة الطلب، ولم يتمّ الاشتراك.',
  rateLimited: 'أرسلت عدّة محاولات خلال وقت قصير. يرجى الانتظار دقيقة ثمّ المحاولة مجدّدًا.',
  disabled: 'خدمة الاشتراك غير مفعّلة حاليًا، ولم يُسجَّل بريدك. يرجى المحاولة لاحقًا.',
  providerFailed: 'تعذّر إتمام الاشتراك بسبب خلل في خدمة النشرة البريديّة، ولم يُسجَّل بريدك. يرجى المحاولة لاحقًا.',
};

const json = (status: number, message: string, headers?: HeadersInit) =>
  NextResponse.json({ message }, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

type Outcome = { ok: true; message: string } | { ok: false; message: string };

export async function POST(request: Request) {
  const limit = rateLimit(`newsletter:${clientKey(request)}`, 5);
  if (!limit.ok) return json(429, MESSAGES.rateLimited, { 'Retry-After': String(limit.retryAfter) });

  const body = await readJson(request);
  if (!body) return json(400, MESSAGES.badRequest);
  if (typeof body.website === 'string' && body.website.trim()) return json(400, MESSAGES.badRequest);

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(email)) return json(422, MESSAGES.invalid);

  const provider = process.env.NEWSLETTER_PROVIDER?.trim().toLowerCase();
  let outcome: Outcome;
  try {
    if (provider === 'mailchimp' && process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_LIST_ID) outcome = await subscribeMailchimp(email);
    else if (provider === 'brevo' && process.env.BREVO_API_KEY && process.env.BREVO_LIST_ID) outcome = await subscribeBrevo(email);
    else if ((provider === 'mailpoet' || provider === 'webhook') && process.env.NEWSLETTER_WEBHOOK_URL) outcome = await subscribeWebhook(email);
    else return json(503, MESSAGES.disabled);
  } catch (error) {
    console.error('[newsletter] provider error', (error as Error).message);
    return json(502, MESSAGES.providerFailed);
  }

  return outcome.ok ? json(200, outcome.message) : json(502, outcome.message);
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get('content-type')?.includes('application/json')) return null;
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) return null;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return null;
    const data: unknown = JSON.parse(text);
    return data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function subscribeMailchimp(email: string): Promise<Outcome> {
  const key = process.env.MAILCHIMP_API_KEY!.trim();
  const dc = key.split('-').at(-1);
  if (!dc || dc === key || !/^[a-z]+\d+$/i.test(dc)) {
    console.error('[newsletter] MAILCHIMP_API_KEY must end with the data-centre suffix, e.g. -us21');
    return { ok: false, message: MESSAGES.providerFailed };
  }
  const list = encodeURIComponent(process.env.MAILCHIMP_LIST_ID!.trim());
  const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${list}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`anystring:${key}`).toString('base64')}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    // 'pending' = double opt-in: Mailchimp emails a confirmation link before the address is subscribed.
    body: JSON.stringify({ email_address: email, status: 'pending' }),
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.ok) return { ok: true, message: MESSAGES.confirm };

  const data = (await res.json().catch(() => null)) as { title?: string; detail?: string } | null;
  if (data?.title === 'Member Exists') return { ok: true, message: MESSAGES.exists };
  if (data?.title === 'Invalid Resource' && /fake|valid/i.test(data.detail ?? '')) return { ok: false, message: MESSAGES.invalid };
  console.error('[newsletter] mailchimp refused', res.status, data?.title ?? 'no-json');
  return { ok: false, message: MESSAGES.providerFailed };
}

async function subscribeBrevo(email: string): Promise<Outcome> {
  const listId = Number(process.env.BREVO_LIST_ID);
  if (!Number.isInteger(listId) || listId <= 0) {
    console.error('[newsletter] BREVO_LIST_ID must be a numeric list id');
    return { ok: false, message: MESSAGES.providerFailed };
  }
  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY!.trim(), 'Content-Type': 'application/json', Accept: 'application/json' },
    // updateEnabled: an existing contact is added to the list instead of failing as a duplicate.
    body: JSON.stringify({ email, listIds: [listId], updateEnabled: true }),
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.ok) return { ok: true, message: MESSAGES.subscribed };
  const data = (await res.json().catch(() => null)) as { code?: string } | null;
  console.error('[newsletter] brevo refused', res.status, data?.code ?? 'no-json');
  return { ok: false, message: MESSAGES.providerFailed };
}

async function subscribeWebhook(email: string): Promise<Outcome> {
  const res = await fetch(process.env.NEWSLETTER_WEBHOOK_URL!.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, site: site.url, subscribedAt: new Date().toISOString() }),
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.ok) {
    // A bridge may return its own (already localised) confirmation text.
    const data = (await res.json().catch(() => null)) as { message?: unknown } | null;
    const message = typeof data?.message === 'string' && data.message.trim() ? data.message.trim().slice(0, 300) : MESSAGES.subscribed;
    return { ok: true, message };
  }
  console.error('[newsletter] webhook refused', res.status);
  return { ok: false, message: MESSAGES.providerFailed };
}
