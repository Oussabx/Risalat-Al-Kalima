import { stripHtml } from '@/lib/arabic';
import { prepareContent } from '@/lib/html';

/**
 * Prepares the WordPress «اتصل بنا» page body for display above our own form.
 * The CMS page usually embeds a Contact Form 7 form: its <form> markup cannot
 * work here (the sanitiser drops inputs and would leave stray labels), and an
 * unrendered `[contact-form-7 …]` shortcode would show as text, so both are
 * removed. Returns null when nothing readable remains.
 */
export function contactPageHtml(contentHtml: string): string | null {
  const withoutForms = contentHtml
    .replace(/<form\b[\s\S]*?<\/form>/gi, '')
    .replace(/\[contact-form-7\b[^\]]*\]/gi, '')
    .replace(/<div\b[^>]*class="[^"]*\bscreen-reader-response\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  const { html } = prepareContent(withoutForms);
  return stripHtml(html) || /<(img|iframe|video)\b/i.test(html) ? html : null;
}
