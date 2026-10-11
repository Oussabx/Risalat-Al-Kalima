import '@fontsource/ibm-plex-sans-arabic/300.css';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import './globals.css';

import type { Metadata, Viewport } from 'next';
import { PreviewBanner } from '@/components/PreviewBanner';
import { RevealObserver } from '@/components/Reveal';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/header/SiteHeader';
import { getSiteInfo, isPreview } from '@/lib/content';
import { routes } from '@/lib/routes';
import { site } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteInfo();
  return {
    metadataBase: new URL(site.url),
    title: { default: `${site.fullName} — ${site.tagline}`, template: `%s — ${site.fullName}` },
    description: site.description,
    applicationName: site.fullName,
    alternates: { canonical: '/', types: { 'application/rss+xml': `${site.url}/feed/` } },
    openGraph: { type: 'website', locale: site.locale, siteName: site.fullName, url: '/' },
    twitter: { card: 'summary_large_image' },
    icons: info.icon ? { icon: info.icon, apple: info.icon } : undefined,
    robots: isPreview ? { index: false, follow: false } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.fullName,
    url: site.url,
    inLanguage: 'ar',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${site.url}${routes.search()}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-dvh flex-col">
        {isPreview && <PreviewBanner />}
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <RevealObserver />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      </body>
    </html>
  );
}
