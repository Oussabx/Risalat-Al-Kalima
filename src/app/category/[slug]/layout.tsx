import { notFound } from 'next/navigation';
import { decodeSlug } from '@/lib/arabic';
import { getCategoryBySlug } from '@/lib/content';

type Props = { children: React.ReactNode; params: Promise<{ slug: string }> };

/**
 * Checks that the category exists before the segment's loading.tsx boundary
 * starts streaming: this layout renders outside that Suspense boundary, so an
 * unknown slug gets a real HTTP 404 instead of a streamed (200) not-found page.
 * The lookup reuses the request-cached category list the page reads anyway.
 */
export default async function CategoryLayout({ children, params }: Props) {
  const { slug } = await params;
  if (!(await getCategoryBySlug(decodeSlug(slug)))) notFound();
  return children;
}
