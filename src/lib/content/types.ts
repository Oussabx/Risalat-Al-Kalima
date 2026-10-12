/** Content model shared by every content source (WordPress in production, fixtures in preview). */

export type ImageRef = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** True for preview placeholders that must be replaced by real CMS images. */
  placeholder?: boolean;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  parent: number;
};

export type Tag = {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
};

export type Author = {
  id: number;
  name: string;
  slug: string;
  bio: string;
  avatar?: string;
};

export type ArticleSummary = {
  id: number;
  slug: string;
  title: string;
  /** Plain text, no HTML. */
  excerpt: string;
  /** Publication time in the site's local time (no zone): use it for the displayed day. */
  date: string;
  /** Last modification, site-local time (no zone). */
  modified: string;
  /** Publication instant, ISO 8601 UTC (`…Z`): use it for structured data, feeds and sitemaps. */
  published: string;
  /** Last modification instant, ISO 8601 UTC (`…Z`). */
  updated: string;
  /** `name` is empty when the CMS exposes no usable author; the byline is then omitted. */
  author: Author;
  categories: Category[];
  tags: Tag[];
  image?: ImageRef;
  sticky: boolean;
  readingMinutes: number;
};

export type Article = ArticleSummary & {
  /** Raw CMS HTML. Always pass through `prepareContent` before rendering. */
  contentHtml: string;
};

export type PageContent = {
  id: number;
  slug: string;
  title: string;
  contentHtml: string;
  modified: string;
  image?: ImageRef;
};

export type Paged<T> = {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
};

export type SortOrder = 'newest' | 'oldest' | 'title';

export type ArticleQuery = {
  page?: number;
  perPage?: number;
  categoryIds?: number[];
  tagId?: number;
  authorId?: number;
  /** Server-side keyword search (WordPress full text). */
  search?: string;
  order?: SortOrder;
  /** Only sticky (editor-featured) articles. */
  sticky?: boolean;
  exclude?: number[];
  include?: number[];
};

export type SiteIdentity = {
  name: string;
  description: string;
  /** The original logo file, when the CMS or configuration provides it. */
  logo?: ImageRef;
  icon?: string;
};

/** `modified` is ISO 8601 UTC when the source knows it. */
export type SitemapEntry = { slug: string; modified: string };

export interface ContentSource {
  readonly kind: 'wordpress' | 'fixtures';
  getIdentity(): Promise<SiteIdentity>;
  listArticles(query: ArticleQuery): Promise<Paged<ArticleSummary>>;
  getArticle(slug: string): Promise<Article | null>;
  /** previous = the next older article, next = the next newer one (WordPress semantics). */
  getAdjacent(article: ArticleSummary): Promise<{ previous: ArticleSummary | null; next: ArticleSummary | null }>;
  getCategories(): Promise<Category[]>;
  getTag(slug: string): Promise<Tag | null>;
  getAuthor(slug: string): Promise<Author | null>;
  getPage(slug: string): Promise<PageContent | null>;
  /** Lightweight records of recent articles used for Arabic-aware ranking. */
  getSearchIndex(): Promise<ArticleSummary[]>;
  /** Every published article and page, for the sitemap. */
  getSitemapEntries(): Promise<{ articles: SitemapEntry[]; pages: SitemapEntry[] }>;
}
