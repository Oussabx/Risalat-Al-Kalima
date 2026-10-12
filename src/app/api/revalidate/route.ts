import { timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * On-demand cache refresh, called by a WordPress webhook when content changes.
 * The secret must be sent in the `x-revalidate-secret` header or as
 * `Authorization: Bearer <secret>` — never in the query string, where it would
 * end up in access logs.
 */

export const dynamic = 'force-dynamic';

const json = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

function providedSecret(request: Request): string | null {
  const header = request.headers.get('x-revalidate-secret')?.trim();
  if (header) return header;
  const auth = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return auth || null;
}

function matches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual needs equal lengths; compare against itself to keep the timing uniform.
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_SECRET?.trim();
  const provided = providedSecret(request);
  if (!expected || !provided || !matches(provided, expected)) return json(401, { revalidated: false, message: 'Unauthorized' });

  // Every WordPress fetch is tagged 'wp'. 'max' = stale-while-revalidate: the next visit gets fresh content.
  revalidateTag('wp', 'max');
  revalidatePath('/', 'layout');
  return json(200, { revalidated: true, at: new Date().toISOString() });
}
