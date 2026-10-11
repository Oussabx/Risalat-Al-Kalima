import { NextResponse, type NextRequest } from 'next/server';
import { runSearch } from '@/lib/search-service';

/** Quick results for the header search overlay. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 6) || 6, 20);
  try {
    const result = await runSearch(q, { perPage: limit });
    return NextResponse.json(
      {
        total: result.total,
        items: result.items.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          date: p.date,
          category: p.categories[0]?.name,
          image: p.image ? { src: p.image.src, alt: p.image.alt } : undefined,
        })),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch (error) {
    console.error('[search]', error);
    return NextResponse.json({ message: 'search_failed' }, { status: 502 });
  }
}
