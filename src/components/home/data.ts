import 'server-only';
import { getEditorsPicks, getFeatured, getIdentity, getSectionArticles, listArticles, tolerateOutage } from '@/lib/content';
import type { ArticleSummary, Category, SiteIdentity } from '@/lib/content/types';
import { homeSections, mediaCategoryNames, site } from '@/lib/site';

/** How many articles each homepage block shows. */
const LIMITS = {
  rail: 4,
  latest: 8,
  picks: 4,
  video: 3,
  section: { feature: 4, grid: 4, list: 6 },
} as const;

/**
 * Sections are fetched in parallel, so each one asks for a few extra articles;
 * duplicates across sections are then removed in page order.
 */
const OVERFETCH = 6;

export type HomeCategorySection = {
  key: string;
  title: string;
  description: string;
  variant: 'feature' | 'grid' | 'list';
  /** The first live category of the section; its archive is the "view all" target. */
  category: Category;
  items: ArticleSummary[];
};

export type HomeData = {
  identity: SiteIdentity;
  lead: ArticleSummary | null;
  /** «الأحدث» beside the lead story. */
  rail: ArticleSummary[];
  /** «جديد المجلّة». */
  latest: ArticleSummary[];
  picks: ArticleSummary[];
  sections: HomeCategorySection[];
  video: { category: Category; items: ArticleSummary[] } | null;
  /** True when the main article list could not be loaded (as opposed to an empty CMS). */
  unavailable: boolean;
};

/** Runs one content request; a failure is logged and the block is omitted instead of breaking the page. */
async function attempt<T>(label: string, task: () => Promise<T>): Promise<T | null> {
  try {
    return await task();
  } catch (error) {
    console.error(`[home] ${label}`, (error as Error).message);
    return null;
  }
}

/** Takes up to `limit` articles that are not on the page yet and marks them as shown. */
function take(pool: ArticleSummary[] | undefined, limit: number, shown: Set<number>): ArticleSummary[] {
  const out: ArticleSummary[] = [];
  for (const article of pool ?? []) {
    if (out.length >= limit) break;
    if (shown.has(article.id)) continue;
    shown.add(article.id);
    out.push(article);
  }
  return out;
}

/**
 * Everything the homepage renders. No article appears in two blocks. When the main
 * article list fails at runtime this throws, so Next keeps serving the last good page.
 */
export async function loadHomepage(): Promise<HomeData> {
  const shown = new Set<number>();

  const [identity, featured, recent, pickPool] = await Promise.all([
    attempt('identity', getIdentity),
    attempt('featured', getFeatured),
    // Enough for the rail and «جديد المجلّة» even when the lead and every pick are among the newest.
    attempt('latest', async () => (await listArticles({ perPage: 1 + LIMITS.picks + LIMITS.rail + LIMITS.latest })).items),
    // One extra in case the lead is itself a sticky post.
    attempt('editors picks', () => getEditorsPicks(LIMITS.picks + 1)),
  ]);

  if (recent === null && !tolerateOutage) throw new Error('[home] the article list is unavailable');

  // Lead first, then the editor's picks, so the curated block is never emptied by the newest-article blocks.
  const lead = featured ?? recent?.[0] ?? null;
  if (lead) shown.add(lead.id);
  const picks = take(pickPool ?? undefined, LIMITS.picks, shown);
  const rail = take(recent ?? undefined, LIMITS.rail, shown);
  const latest = take(recent ?? undefined, LIMITS.latest, shown);

  const exclude = [...shown];
  const [sectionPools, videoPool] = await Promise.all([
    Promise.all(
      homeSections.map((section) =>
        attempt(`section ${section.key}`, () => getSectionArticles(section.names, LIMITS.section[section.variant] + OVERFETCH, exclude)),
      ),
    ),
    attempt('video', () => getSectionArticles(mediaCategoryNames, LIMITS.video + OVERFETCH, exclude)),
  ]);

  const sections: HomeCategorySection[] = [];
  homeSections.forEach((section, i) => {
    const pool = sectionPools[i];
    const category = pool?.categories[0];
    if (!category) return;
    const items = take(pool.items, LIMITS.section[section.variant], shown);
    if (items.length) sections.push({ key: section.key, title: section.title, description: section.description, variant: section.variant, category, items });
  });

  const videoCategory = videoPool?.categories[0];
  const videoItems = videoCategory ? take(videoPool.items, LIMITS.video, shown) : [];

  return {
    identity: identity ?? { name: site.fullName, description: site.shortDescription },
    lead,
    rail,
    latest,
    picks,
    sections,
    video: videoCategory && videoItems.length ? { category: videoCategory, items: videoItems } : null,
    unavailable: !lead && recent === null,
  };
}
