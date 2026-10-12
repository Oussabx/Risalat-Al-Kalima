/** Hosts whose images go through Next.js image optimisation (kept in sync with next.config.ts). */
const wpHost = (() => {
  try {
    return new URL(process.env.WP_API_URL ?? 'https://risalatalkalima.com/wp-json').hostname;
  } catch {
    return 'risalatalkalima.com';
  }
})();

const PATTERNS: RegExp[] = [
  new RegExp(`^${wpHost.replace(/\./g, '\\.')}$`),
  /^(.+\.)?risalatalkalima\.com$/,
  /^i[0-3]\.wp\.com$/,
  /^(.+\.)?gravatar\.com$/,
];

/** Local raster images and images on known CMS hosts are optimised; SVGs and unknown hosts are served as-is. */
export function canOptimize(src: string): boolean {
  if (/\.svg(\?|$)/i.test(src) || src.startsWith('data:')) return false;
  if (src.startsWith('/')) return true;
  try {
    const { hostname, protocol } = new URL(src);
    return protocol === 'https:' && PATTERNS.some((p) => p.test(hostname));
  } catch {
    return false;
  }
}
