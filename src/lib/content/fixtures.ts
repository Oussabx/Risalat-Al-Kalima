import { normalizeArabic, readingMinutes, stripHtml, truncate } from '@/lib/arabic';
import { allCategoryNames, site } from '@/lib/site';
import { fixtureArticles, fixtureAuthors } from './fixtures-data';
import type { Article, ArticleSummary, Author, Category, ContentSource, Paged, Tag } from './types';

/**
 * Preview content source (CONTENT_SOURCE=fixtures). Same behaviour as the
 * WordPress source, backed by the labelled preview data in fixtures-data.ts.
 */

const COVER_COUNT = 8;
const PREVIEW_NOTE = 'نصّ تجريبيّ لمعاينة التصميم';

function slugify(name: string): string {
  return name.trim().replace(/\s+/g, '-');
}

/** A placeholder body that announces itself and exercises every content style. */
export function placeholderBody(title: string, cover: string): string {
  return [
    `<p><strong>${PREVIEW_NOTE}.</strong> هذه الفقرات تحجز مكان نصّ مقال «${title}» إلى أن يُقرأ نصّه الأصليّ من ووردبريس. لا تنقل هذه الصفحة شيئًا من مضمون المقال، بل تُظهر كيف ستبدو القراءة: طول السطر، والمسافات بين الفقرات، وتسلسل العناوين.</p>`,
    `<p>تُعرض المقالات في عمود قراءة مريح، بخطّ عربيّ واضح وتباعد سخيّ بين الأسطر. وتظهر علامات الترقيم العربيّة، مثل الفاصلة «،» والفاصلة المنقوطة «؛» وعلامة الاستفهام «؟»، في مكانها الصحيح من اليمين إلى اليسار.</p>`,
    `<h2>عنوان فرعيّ تجريبيّ</h2>`,
    `<p>كلّ عنوان فرعيّ في المقال الأصليّ يظهر تلقائيًّا في جدول المحتويات الجانبيّ، ويمكن الانتقال إليه مباشرة. ويُحسب شريط تقدّم القراءة من موضع القارئ داخل نصّ المقال نفسه.</p>`,
    `<blockquote><p>هنا يظهر الاقتباس عندما يتضمّن المقال الأصليّ اقتباسًا أو آية كتابيّة، بتنسيق مميّز يلفت النظر دون أن يقطع القراءة.</p></blockquote>`,
    `<p>${PREVIEW_NOTE}: يُستبدل هذا النصّ كاملًا بمحتوى المقال كما نشرته هيئة التحرير، من دون اختصار أو إعادة صياغة.</p>`,
    `<figure><img src="${cover}" alt="صورة مؤقتة داخل المقال" width="1600" height="900" /><figcaption>صورة مؤقتة — تظهر هنا صور المقال الأصليّة.</figcaption></figure>`,
    `<h2>عنوان فرعيّ تجريبيّ ثانٍ</h2>`,
    `<p>تُعرض القوائم كما في المقال الأصليّ:</p>`,
    `<ul><li>عنصر أوّل في قائمة تجريبيّة.</li><li>عنصر ثانٍ في قائمة تجريبيّة.</li><li>عنصر ثالث في قائمة تجريبيّة.</li></ul>`,
    `<h3>عنوان من المستوى الثالث</h3>`,
    `<p>${PREVIEW_NOTE}. تنتهي المعاينة هنا، وتليها الوسوم ومعلومات الكاتب والمقالات السابقة والتالية والمقالات ذات الصلة.</p>`,
  ].join('\n');
}

const categories: Category[] = allCategoryNames.map((name, i) => ({
  id: i + 1,
  name,
  slug: slugify(name),
  description: '',
  count: fixtureArticles.filter((a) => a.categories.includes(name)).length,
  parent: 0,
}));

const authors: Author[] = fixtureAuthors.map((a, i) => ({ id: i + 1, name: a.name, slug: a.slug, bio: '' }));

const tagNames = Array.from(new Set(fixtureArticles.flatMap((a) => a.tags ?? [])));
const tags: Tag[] = tagNames.map((name, i) => ({
  id: 1000 + i,
  name,
  slug: slugify(name),
  description: '',
  count: fixtureArticles.filter((a) => a.tags?.includes(name)).length,
}));

const articles: Article[] = fixtureArticles
  .map((f, i): Article => {
    const cover = `/placeholders/cover-${(i % COVER_COUNT) + 1}.svg`;
    const contentHtml = placeholderBody(f.title, `/placeholders/cover-${((i + 3) % COVER_COUNT) + 1}.svg`);
    return {
      id: i + 1,
      slug: f.slug,
      title: f.title,
      excerpt: truncate(stripHtml(contentHtml).replace(`${PREVIEW_NOTE}. `, ''), 180),
      date: f.date,
      modified: f.date,
      // Preview dates carry no zone; treat them as UTC.
      published: `${f.date}Z`,
      updated: `${f.date}Z`,
      author: authors.find((a) => a.name === f.author) ?? authors[0],
      categories: f.categories.map((name) => categories.find((c) => c.name === name)).filter((c): c is Category => Boolean(c)),
      tags: (f.tags ?? []).map((name) => tags.find((t) => t.name === name)).filter((t): t is Tag => Boolean(t)),
      image: { src: cover, alt: 'صورة مؤقتة', width: 1600, height: 900, placeholder: true },
      sticky: Boolean(f.sticky),
      readingMinutes: readingMinutes(contentHtml),
      contentHtml,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

function summary(article: Article): ArticleSummary {
  const rest: Partial<Article> = { ...article };
  delete rest.contentHtml;
  return rest as ArticleSummary;
}

export const fixturesSource: ContentSource = {
  kind: 'fixtures',

  async getIdentity() {
    return {
      name: site.fullName,
      description: site.shortDescription,
      logo: site.logoUrl ? { src: site.logoUrl, alt: site.fullName } : undefined,
    };
  },

  async listArticles(query): Promise<Paged<ArticleSummary>> {
    const page = Math.max(1, query.page ?? 1);
    const perPage = query.perPage ?? 12;
    const needle = query.search ? normalizeArabic(query.search) : '';
    let list = articles.filter(
      (a) =>
        (!query.categoryIds?.length || a.categories.some((c) => query.categoryIds!.includes(c.id))) &&
        (!query.tagId || a.tags.some((t) => t.id === query.tagId)) &&
        (!query.authorId || a.author.id === query.authorId) &&
        (!query.sticky || a.sticky) &&
        (!query.exclude?.length || !query.exclude.includes(a.id)) &&
        (!query.include?.length || query.include.includes(a.id)) &&
        (!needle || normalizeArabic(`${a.title} ${stripHtml(a.contentHtml)}`).includes(needle)),
    );
    if (query.order === 'oldest') list = [...list].sort((a, b) => a.date.localeCompare(b.date));
    if (query.order === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'ar'));
    const total = list.length;
    return {
      items: list.slice((page - 1) * perPage, page * perPage).map(summary),
      total,
      totalPages: Math.ceil(total / perPage),
      page,
      perPage,
    };
  },

  async getArticle(slug) {
    return articles.find((a) => a.slug === slug) ?? null;
  },

  async getAdjacent(article) {
    const older = articles.filter((a) => a.date < article.date)[0];
    const newer = articles.filter((a) => a.date > article.date).at(-1);
    return { previous: older ? summary(older) : null, next: newer ? summary(newer) : null };
  },

  async getCategories() {
    return categories;
  },

  async getTag(slug) {
    return tags.find((t) => t.slug === slug) ?? null;
  },

  async getAuthor(slug) {
    return authors.find((a) => a.slug === slug) ?? null;
  },

  async getPage() {
    return null;
  },

  async getSearchIndex() {
    return articles.map(summary);
  },

  async getSitemapEntries() {
    return { articles: articles.map((a) => ({ slug: a.slug, modified: a.updated })), pages: [] };
  },
};

/** Exposed for tests. */
export const fixtureStore = { articles, categories, tags, authors };
