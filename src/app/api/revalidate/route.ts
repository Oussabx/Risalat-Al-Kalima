import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

/** Called by WordPress (e.g. a "post published" webhook) to refresh cached pages immediately. */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.nextUrl.searchParams.get('secret') !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true, revalidated: true, at: new Date().toISOString() });
}
