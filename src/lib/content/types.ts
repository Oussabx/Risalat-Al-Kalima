export type Image = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** True for local preview art that must be replaced by real CMS media. */
  placeholder?: boolean;
};

export type Author = {
  id: number;
  slug: string;
  name: string;
  avatar?: string;
  bio?: string;
};

export type Term = {
  id: number;
  slug: string;
  name: string;
  description?: string;
  count?: number;
  parent?: number;
};

export type PostSummary = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  modified: string;
  author: Author;
  categories: Term[];
  tags: Term[];
  image?: Image;
  /** Known only when the body was fetched (article pages, fixtures). */
  readingMinutes?: number;
  sticky?: boolean;
};

export type Post = PostSummary & {
  contentHtml: string;
  readingMinutes: number;
};

export type Page = {
  id: number;
  slug: string;
  title: string;
  contentHtml: string;
  excerpt: string;
  image?: Image;
};

export type Paged<T> = {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
};

export type SortKey = 'newest' | 'oldest' | 'title';

export type PostQuery = {
  page?: number;
  perPage?: number;
  categoryId?: number;
  /** Posts in any of these categories. */
  categoryIds?: number[];
  tagId?: number;
  authorId?: number;
  sort?: SortKey;
  sticky?: boolean;
  exclude?: number[];
};

export type SiteInfo = {
  name: string;
  description: string;
  url: string;
  logo?: Image;
  icon?: string;
};

/** Lightweight record used by the Arabic-aware search (images are hydrated later). */
export type SearchDoc = {
  post: PostSummary;
  /** Plain text of the body when available (fixtures, or a CMS that exposes it). */
  body?: string;
};

export interface ContentSource {
  readonly kind: 'wordpress' | 'fixtures';
  getSiteInfo(): Promise<SiteInfo>;
  getPosts(query?: PostQuery): Promise<Paged<PostSummary>>;
  getPostBySlug(slug: string): Promise<Post | null>;
  getAdjacentPosts(post: PostSummary): Promise<{ previous: PostSummary | null; next: PostSummary | null }>;
  getPageBySlug(slug: string): Promise<Page | null>;
  getCategories(): Promise<Term[]>;
  getCategoryBySlug(slug: string): Promise<Term | null>;
  getTagBySlug(slug: string): Promise<Term | null>;
  getAuthorBySlug(slug: string): Promise<Author | null>;
  getSearchDocs(): Promise<SearchDoc[]>;
  /** Full summaries (with images) for ids, in the given order. */
  getPostsByIds(ids: number[]): Promise<PostSummary[]>;
  /** Server-side full-text search in the CMS, used to catch body matches. */
  searchBodies?(query: string): Promise<PostSummary[]>;
}
