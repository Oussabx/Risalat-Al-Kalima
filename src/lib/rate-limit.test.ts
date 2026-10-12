import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clientKey, rateLimit, resetRateLimits } from '@/lib/rate-limit';

const request = (headers: Record<string, string>) => new Request('https://example.org/api/search/', { headers });

describe('rateLimit', () => {
  beforeEach(() => resetRateLimits());

  it('allows `limit` requests per window, then reports when to retry', () => {
    const t = 1_000_000;
    expect(rateLimit('k', 2, 60_000, t)).toEqual({ ok: true, remaining: 1, retryAfter: 0 });
    expect(rateLimit('k', 2, 60_000, t + 1_000).ok).toBe(true);
    expect(rateLimit('k', 2, 60_000, t + 2_000)).toEqual({ ok: false, remaining: 0, retryAfter: 58 });
    expect(rateLimit('k', 2, 60_000, t + 60_001).ok).toBe(true);
  });

  it('counts keys separately', () => {
    expect(rateLimit('a', 1).ok).toBe(true);
    expect(rateLimit('b', 1).ok).toBe(true);
    expect(rateLimit('a', 1).ok).toBe(false);
  });
});

describe('clientKey', () => {
  beforeEach(() => {
    vi.stubEnv('TRUST_PROXY', '');
    vi.stubEnv('VERCEL', '');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('ignores a client-supplied x-real-ip unless a trusted proxy is configured', () => {
    expect(clientKey(request({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': 'spoofed, 2.2.2.2' }))).toBe('2.2.2.2');
    expect(clientKey(request({ 'x-real-ip': '1.1.1.1' }))).toBe('anon');
  });

  it('uses x-real-ip behind a trusted proxy (TRUST_PROXY=1 or Vercel)', () => {
    vi.stubEnv('TRUST_PROXY', '1');
    expect(clientKey(request({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' }))).toBe('1.1.1.1');
    vi.stubEnv('TRUST_PROXY', '');
    vi.stubEnv('VERCEL', '1');
    expect(clientKey(request({ 'x-real-ip': '1.1.1.1' }))).toBe('1.1.1.1');
  });

  it('falls back to the last x-forwarded-for hop, then to a shared bucket', () => {
    vi.stubEnv('TRUST_PROXY', '1');
    expect(clientKey(request({ 'x-forwarded-for': 'spoofed, 3.3.3.3 ' }))).toBe('3.3.3.3');
    expect(clientKey(request({}))).toBe('anon');
  });
});
