import type { NextConfig } from 'next';

const wpHost = (() => {
  try {
    return new URL(process.env.WP_API_URL ?? 'https://risalatalkalima.com/wp-json').hostname;
  } catch {
    return 'risalatalkalima.com';
  }
})();

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  // WordPress permalinks end with a slash; keep every URL identical.
  trailingSlash: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: wpHost },
      { protocol: 'https', hostname: 'risalatalkalima.com' },
      { protocol: 'https', hostname: '**.risalatalkalima.com' },
      { protocol: 'https', hostname: 'i0.wp.com' },
      { protocol: 'https', hostname: 'i1.wp.com' },
      { protocol: 'https', hostname: 'i2.wp.com' },
      { protocol: 'https', hostname: 'i3.wp.com' },
      { protocol: 'https', hostname: '**.gravatar.com' },
      { protocol: 'https', hostname: 'gravatar.com' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      // WordPress conventions that should land on the equivalent pages here. Order matters: the first match wins.
      // Per-archive and comment feeds → the site feed.
      { source: '/category/:path+/feed/', destination: '/feed/', permanent: true },
      { source: '/tag/:slug/feed/', destination: '/feed/', permanent: true },
      { source: '/author/:slug/feed/', destination: '/feed/', permanent: true },
      { source: '/comments/feed/', destination: '/feed/', permanent: true },
      // Sitemaps of WordPress core and SEO plugins → the generated sitemap.
      { source: '/sitemap_index.xml', destination: '/sitemap.xml', permanent: true },
      { source: '/wp-sitemap.xml', destination: '/sitemap.xml', permanent: true },
      { source: '/post-sitemap.xml', destination: '/sitemap.xml', permanent: true },
      { source: '/page-sitemap.xml', destination: '/sitemap.xml', permanent: true },
      // Paged archives.
      { source: '/page/:n(\\d+)/', destination: '/articles/?page=:n', permanent: true },
      { source: '/category/:slug/page/:n(\\d+)/', destination: '/category/:slug/?page=:n', permanent: true },
      { source: '/tag/:slug/page/:n(\\d+)/', destination: '/tag/:slug/?page=:n', permanent: true },
      { source: '/author/:slug/page/:n(\\d+)/', destination: '/author/:slug/?page=:n', permanent: true },
      { source: '/articles/page/:n(\\d+)/', destination: '/articles/?page=:n', permanent: true },
      // Nested category permalinks (/category/parent/child/) → the flat category URL used here.
      { source: '/category/:parent/:child/page/:n(\\d+)/', destination: '/category/:child/?page=:n', permanent: true },
      { source: '/category/:parent/:child/', destination: '/category/:child/', permanent: true },
      // WordPress search links (/?s=…) open the new search page. Next.js keeps the unmatched `s` key on the
      // destination; /search/ then redirects once more to the clean /search/?q=… URL.
      { source: '/', has: [{ type: 'query', key: 's', value: '(?<q>.+)' }], destination: '/search/?q=:q', permanent: true },
    ];
  },
};

export default nextConfig;
