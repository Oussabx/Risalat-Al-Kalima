import '@fontsource/ibm-plex-sans-arabic/300.css';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import './globals.css';

import type { Metadata, Viewport } from 'next';
import { SiteFooter } from '@/components/footer/SiteFooter';
import { SiteHeader } from '@/components/header/SiteHeader';
import { JsonLd } from '@/components/JsonLd';
import { PreviewBanner } from '@/components/PreviewBanner';
import { getIdentity, isPreview } from '@/lib/content';
import { defaultOpenGraph, feedAlternates, site } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const identity = await getIdentity();
  return {
    metadataBase: new URL(site.url),
    title: { default: `${site.fullName} — ${identity.description || site.shortDescription}`, template: `%s — ${site.fullName}` },
    description: site.description,
    applicationName: site.fullName,
    // No canonical or og:url here: every page would inherit '/'. Pages set their own (the home page included).
    alternates: { types: feedAlternates },
    openGraph: defaultOpenGraph,
    twitter: { card: 'summary_large_image' },
    icons: identity.icon ? { icon: identity.icon, apple: identity.icon } : undefined,
    robots: isPreview ? { index: false, follow: false } : { index: true, follow: true },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Enables scroll-reveal styles only when JavaScript runs. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[100] focus:rounded-full focus:bg-brand-600 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          تخطَّ إلى المحتوى
        </a>
        <PreviewBanner />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SiteFooter />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: site.fullName,
            url: site.url,
            inLanguage: 'ar',
            potentialAction: {
              '@type': 'SearchAction',
              target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/search/?q={search_term_string}` },
              'query-input': 'required name=search_term_string',
            },
          }}
        />
      </body>
    </html>
  );
}
