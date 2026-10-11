import type { NextConfig } from 'next';

function hostOf(url: string | undefined, fallback: string) {
  try {
    return url ? new URL(url).hostname : fallback;
  } catch {
    return fallback;
  }
}

const wpHost = hostOf(process.env.WP_API_URL, 'risalatalkalima.com');

const nextConfig: NextConfig = {
  // WordPress permalinks end with a slash; keeping it preserves every existing URL.
  trailingSlash: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { hostname: wpHost },
      { hostname: `www.${wpHost}` },
      { protocol: 'https', hostname: '*.wp.com' },
      { protocol: 'https', hostname: 'secure.gravatar.com' },
    ],
  },
};

export default nextConfig;
