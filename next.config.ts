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
      // WordPress conventions that should land on the equivalent pages here.
      { source: '/page/:n(\\d+)/', destination: '/articles/?page=:n', permanent: true },
      { source: '/category/:slug/page/:n(\\d+)/', destination: '/category/:slug/?page=:n', permanent: true },
      { source: '/tag/:slug/page/:n(\\d+)/', destination: '/tag/:slug/?page=:n', permanent: true },
      { source: '/author/:slug/page/:n(\\d+)/', destination: '/author/:slug/?page=:n', permanent: true },
      { source: '/articles/page/:n(\\d+)/', destination: '/articles/?page=:n', permanent: true },
      // WordPress search links (/?s=…) open the new search page.
      { source: '/', has: [{ type: 'query', key: 's', value: '(?<q>.+)' }], destination: '/search/?q=:q', permanent: true },
    ];
  },
};

export default nextConfig;
