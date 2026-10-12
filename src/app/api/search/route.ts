import { NextResponse, type NextRequest } from 'next/server';
import { toSearchHit, type SearchResponse } from '@/components/search/hits';
import { runSearch } from '@/lib/search-service';

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

/**
 * GET /api/search/?q=…&limit=… → { total, items: SearchHit[] }
 * Live results for the header search overlay; the full results page is /search/.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = (params.get('q') ?? '').trim().slice(0, 100);
  const requested = Number.parseInt(params.get('limit') ?? '', 10);
  const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, MAX_LIMIT) : DEFAULT_LIMIT;

  if (!q) return NextResponse.json<SearchResponse>({ total: 0, items: [] }, { headers: CACHE_HEADERS });

  try {
    const result = await runSearch(q, { perPage: limit });
    return NextResponse.json<SearchResponse>({ total: result.total, items: result.items.map(toSearchHit) }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('[api/search]', (error as Error).message);
    return NextResponse.json({ message: 'تعذّر إجراء البحث الآن. حاول مجدّدًا بعد قليل.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
