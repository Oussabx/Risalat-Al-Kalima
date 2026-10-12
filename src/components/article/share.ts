/** Sharing helpers (browser APIs are only touched inside the functions, on demand). */

export type ShareNetwork = 'facebook' | 'x' | 'whatsapp';

export type ShareTarget = { network: ShareNetwork; label: string; href: string };

/** Public share links for an absolute article URL. */
export function shareTargets(url: string, title: string): ShareTarget[] {
  const u = encodeURIComponent(url);
  return [
    { network: 'facebook', label: 'المشاركة على فيسبوك', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { network: 'x', label: 'المشاركة على إكس', href: `https://twitter.com/intent/tweet?url=${u}&text=${encodeURIComponent(title)}` },
    { network: 'whatsapp', label: 'المشاركة عبر واتساب', href: `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}` },
  ];
}

/** True when the browser offers the native share sheet. */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/** Opens the native share sheet. Resolves to 'cancelled' when the reader dismisses it. */
export async function nativeShare(data: ShareData): Promise<'shared' | 'cancelled' | 'failed'> {
  try {
    await navigator.share(data);
    return 'shared';
  } catch (error) {
    return (error as DOMException)?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

/** Copies text to the clipboard, with a fallback for browsers without the async Clipboard API. */
export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Permission denied or insecure context: try the legacy path below.
  }
  const active = document.activeElement as HTMLElement | null;
  const area = document.createElement('textarea');
  area.value = value;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.insetBlockStart = '0';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  active?.focus({ preventScroll: true });
  return ok;
}
