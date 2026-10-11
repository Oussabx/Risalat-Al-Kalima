import { NextResponse } from 'next/server';
import { clientKey, rateLimited } from '@/lib/rate-limit';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WP_API = (process.env.WP_API_URL ?? 'https://risalatalkalima.com/wp-json').replace(/\/$/, '');

type Payload = { name?: string; email?: string; subject?: string; message?: string; website?: string };

const reply = (status: number, message: string, extra: Record<string, unknown> = {}) => NextResponse.json({ message, ...extra }, { status });

/**
 * Contact form relay: Contact Form 7 on the existing WordPress site, or a
 * webhook. Success is reported only when the receiving service confirms.
 */
export async function POST(req: Request) {
  if (rateLimited(`ct:${clientKey(req)}`, 3)) return reply(429, 'محاولات كثيرة. يرجى المحاولة بعد دقيقة.');

  const body = ((await req.json().catch(() => null)) ?? {}) as Payload;
  if (body.website) return reply(400, 'تعذّر إرسال الرسالة.');
  const data = {
    name: body.name?.trim() ?? '',
    email: body.email?.trim() ?? '',
    subject: body.subject?.trim() ?? '',
    message: body.message?.trim() ?? '',
  };
  const errors: Record<string, string> = {};
  if (data.name.length < 2 || data.name.length > 120) errors.name = 'يرجى كتابة اسمك.';
  if (!EMAIL.test(data.email)) errors.email = 'يرجى إدخال بريد إلكترونيّ صحيح.';
  if (data.subject.length < 3 || data.subject.length > 200) errors.subject = 'يرجى كتابة موضوع الرسالة.';
  if (data.message.length < 10 || data.message.length > 5000) errors.message = 'يرجى كتابة رسالة بين 10 و5000 حرف.';
  if (Object.keys(errors).length) return reply(422, 'يرجى تصحيح الحقول المشار إليها.', { errors });

  const provider = process.env.CONTACT_PROVIDER;
  try {
    if (provider === 'cf7') {
      const id = process.env.CF7_FORM_ID;
      if (!id) throw new Error('CF7_FORM_ID missing');
      const form = new FormData();
      form.set('your-name', data.name);
      form.set('your-email', data.email);
      form.set('your-subject', data.subject);
      form.set('your-message', data.message);
      form.set('_wpcf7_unit_tag', `wpcf7-f${id}-o1`);
      const res = await fetch(`${WP_API}/contact-form-7/v1/contact-forms/${id}/feedback`, { method: 'POST', body: form });
      const out = (await res.json().catch(() => ({}))) as { status?: string; message?: string };
      if (out.status === 'mail_sent') return reply(200, 'وصلت رسالتك إلى فريق التحرير. شكرًا لتواصلك معنا!');
      if (out.status === 'validation_failed') return reply(422, out.message || 'يرجى مراجعة الحقول.');
      throw new Error(`cf7 ${res.status} ${out.status ?? ''}`);
    }

    if (provider === 'webhook') {
      const url = process.env.CONTACT_WEBHOOK_URL;
      if (!url) throw new Error('CONTACT_WEBHOOK_URL missing');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source: 'risalatalkalima-web', sentAt: new Date().toISOString() }),
      });
      if (res.ok) return reply(200, 'وصلت رسالتك إلى فريق التحرير. شكرًا لتواصلك معنا!');
      throw new Error(`webhook ${res.status}`);
    }
  } catch (error) {
    console.error('[contact]', (error as Error).message);
    return reply(502, 'تعذّر إرسال رسالتك الآن بسبب خطأ في الخادم. حاول لاحقًا.');
  }

  return reply(503, 'نموذج الاتصال غير مفعّل حاليًا، ولم تُرسَل رسالتك. يرجى المحاولة لاحقًا.');
}
