import { NextResponse } from 'next/server';
import { clientKey, rateLimited } from '@/lib/rate-limit';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const reply = (status: number, message: string) => NextResponse.json({ message }, { status });

/**
 * Newsletter subscription. Responds with success only after the configured
 * provider accepts the address; with no provider configured it says so.
 */
export async function POST(req: Request) {
  if (rateLimited(`nl:${clientKey(req)}`)) return reply(429, 'محاولات كثيرة. يرجى المحاولة بعد دقيقة.');

  const body = (await req.json().catch(() => null)) as { email?: string; website?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? '';
  if (body?.website) return reply(400, 'تعذّر إتمام الطلب.');
  if (!EMAIL.test(email) || email.length > 254) return reply(422, 'يرجى إدخال بريد إلكترونيّ صحيح.');

  const provider = process.env.NEWSLETTER_PROVIDER;
  try {
    if (provider === 'mailchimp') {
      const key = process.env.MAILCHIMP_API_KEY ?? '';
      const list = process.env.MAILCHIMP_LIST_ID ?? '';
      const dc = key.split('-')[1];
      if (!key || !list || !dc) throw new Error('mailchimp not configured');
      const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${list}/members`, {
        method: 'POST',
        headers: { Authorization: `Basic ${Buffer.from(`any:${key}`).toString('base64')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_address: email, status: 'pending' }),
      });
      if (res.ok) return reply(200, 'شكرًا لك! أرسلنا رسالة تأكيد إلى بريدك، يرجى تأكيد الاشتراك.');
      const err = (await res.json().catch(() => ({}))) as { title?: string };
      if (err.title === 'Member Exists') return reply(200, 'أنت مشترك في النشرة مسبقًا.');
      throw new Error(`mailchimp ${res.status} ${err.title ?? ''}`);
    }

    if (provider === 'brevo') {
      const key = process.env.BREVO_API_KEY;
      const list = Number(process.env.BREVO_LIST_ID);
      if (!key || !list) throw new Error('brevo not configured');
      const res = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: { 'api-key': key, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, listIds: [list], updateEnabled: true }),
      });
      if (res.ok) return reply(200, 'تمّ اشتراكك بنجاح. شكرًا لك!');
      throw new Error(`brevo ${res.status}`);
    }

    if (provider === 'webhook') {
      const url = process.env.NEWSLETTER_WEBHOOK_URL;
      if (!url) throw new Error('webhook not configured');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'risalatalkalima-web', subscribedAt: new Date().toISOString() }),
      });
      if (res.ok) return reply(200, 'تمّ اشتراكك بنجاح. شكرًا لك!');
      throw new Error(`webhook ${res.status}`);
    }
  } catch (error) {
    console.error('[newsletter]', (error as Error).message);
    return reply(502, 'تعذّر إتمام الاشتراك الآن بسبب خطأ في خدمة البريد. حاول لاحقًا.');
  }

  return reply(503, 'خدمة الاشتراك في النشرة غير مفعّلة حاليًا. يرجى المحاولة لاحقًا.');
}
