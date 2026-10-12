import { describe, expect, it } from 'vitest';
import { prepareContent, sanitize } from '@/lib/html';

/** Asserts that sanitised output contains nothing a browser could execute. */
function expectInert(out: string) {
  expect(out).not.toMatch(/<script/i);
  expect(out).not.toMatch(/\son\w+\s*=/i);
  expect(out).not.toMatch(/javascript:/i);
  expect(out).not.toMatch(/vbscript:/i);
  expect(out).not.toMatch(/data:text\/html/i);
  expect(out).not.toMatch(/<(svg|math|object|embed|base|meta|form|button|style|link|frameset|frame|applet)\b/i);
  expect(out).not.toMatch(/\s(formaction|action|style|srcdoc|xlink:href)\s*=/i);
  for (const m of out.matchAll(/<iframe\b[^>]*>/gi)) {
    // A src-less iframe is inert (about:blank); its mere presence is covered by a separate test below.
    const src = /\ssrc="([^"]*)"/i.exec(m[0])?.[1];
    if (src !== undefined) expect(src).toMatch(/^(https:)?\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com|facebook\.com)\//);
  }
}

const html = (input: string) => prepareContent(input).html;

describe('prepareContent — XSS (known bypasses of the old regex filter)', () => {
  const payloads: [string, string][] = [
    ['svg onload without a space', '<svg/onload=alert(1)>'],
    ['script with whitespace in the tags', '<script >alert(1)</script >'],
    ['uppercase script', '<SCRIPT SRC=//evil.example/x.js></SCRIPT>'],
    ['iframe with javascript: src', '<iframe src=javascript:alert(1)>'],
    ['iframe with srcdoc', '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
    ['iframe from a non-allowed host', '<iframe src="https://evil.example/embed"></iframe>'],
    ['entity-encoded javascript: href', '<a href="jav&#x61;script:alert(1)">x</a>'],
    ['tab-split javascript: href', '<a href="java\tscript:alert(1)">x</a>'],
    ['img onerror with trailing comment', '<img src=x onerror=alert(1)//>'],
    ['plain javascript: href', '<a href="javascript:alert(1)">'],
    ['vbscript href', '<a href="vbscript:msgbox(1)">x</a>'],
    ['data:text/html href', '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>'],
    ['style attribute with javascript: url', '<div style="background:url(javascript:alert(1))">x</div>'],
    ['form action and button formaction', '<form action="javascript:alert(1)"><button formaction="javascript:alert(1)">x</button></form>'],
    ['mXSS via math/mglyph/style', '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>'],
    ['object data', '<object data="javascript:alert(1)"></object>'],
    ['embed src', '<embed src="javascript:alert(1)">'],
    ['base href', '<base href="javascript:alert(1)//">'],
    ['meta refresh', '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">'],
    ['link stylesheet', '<link rel="stylesheet" href="https://evil.example/x.css">'],
    ['event handler on an allowed tag', '<p onclick="alert(1)" onmouseover=alert(1)>نص</p>'],
    ['details ontoggle', '<details open ontoggle=alert(1)>'],
    ['video onerror', '<video src=x onerror=alert(1)></video>'],
    ['body onload', '<body onload=alert(1)>'],
    ['nested broken script', '<scr<script>ipt>alert(1)</scr</script>ipt>'],
    ['img with javascript: src', '<img src="javascript:alert(1)">'],
    ['svg image data URI', '<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+">'],
  ];

  it.each(payloads)('neutralises %s', (_name, payload) => {
    const out = html(`<p>قبل</p>${payload}<p>بعد</p>`);
    expectInert(out);
    expect(out).toContain('<p>قبل</p>');
  });

  it('sanitize() alone is equally strict', () => {
    for (const [, payload] of payloads) expectInert(sanitize(payload));
  });

  it('keeps an allowed YouTube iframe, lazy-loaded and titled', () => {
    const out = html('<iframe src="https://www.youtube.com/embed/abc123" width="560" height="315" onload="alert(1)"></iframe>');
    expectInert(out);
    expect(out).toMatch(/<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/abc123"/);
    expect(out).toMatch(/<iframe[^>]*loading="lazy"/);
    expect(out).toMatch(/<iframe[^>]*title="[^"]+"/);
  });

  it('keeps an existing iframe title', () => {
    expect(html('<iframe src="https://player.vimeo.com/video/1" title="عظة"></iframe>')).toMatch(/title="عظة"/);
  });

  it('never keeps a disallowed iframe source', () => {
    expect(html('<iframe src="https://youtube.com.evil.example/embed"></iframe>')).not.toMatch(/evil/);
    expect(html('<iframe src="https://evil.example/embed"></iframe>')).not.toMatch(/evil/);
    expect(html('<iframe src=javascript:alert(1)>')).not.toMatch(/javascript/);
  });

  // FOUNDATION BUG (src/lib/html.ts): sanitize-html's allowedIframeHostnames only drops the `src` attribute, so a
  // disallowed iframe survives as an empty `<iframe loading="lazy" title="فيديو مضمّن" …></iframe>` box. It is inert,
  // but it renders an empty, announced "video" frame. Fix: add `|| (frame.tag === 'iframe' && !frame.attribs.src)`
  // to exclusiveFilter. Remove `.fails` once fixed.
  it('removes iframes from other hosts entirely (no empty <iframe> left behind)', () => {
    for (const input of ['<iframe src="https://evil.example/embed"></iframe>', '<iframe src=javascript:alert(1)>', '<iframe srcdoc="<script>alert(1)</script>"></iframe>']) {
      expect(html(input)).not.toMatch(/<iframe/);
    }
  });
});

describe('prepareContent — headings', () => {
  it('gives h2/h3 stable sequential ids and returns the outline', () => {
    const { html: out, headings } = prepareContent('<h2>البداية</h2><p>نص</p><h3>تفصيل <em>مهم</em></h3><h2>الخاتمة</h2>');
    expect(headings).toEqual([
      { id: 'section-1', text: 'البداية', level: 2 },
      { id: 'section-2', text: 'تفصيل مهم', level: 3 },
      { id: 'section-3', text: 'الخاتمة', level: 2 },
    ]);
    expect(out).toContain('<h2 id="section-1">البداية</h2>');
    expect(out).toContain('<h3 id="section-2">تفصيل <em>مهم</em></h3>');
  });

  it('is deterministic across calls', () => {
    const input = '<h2>أ</h2><h2>ب</h2>';
    expect(prepareContent(input)).toEqual(prepareContent(input));
  });

  it('keeps existing safe ids, including Arabic ones', () => {
    const { headings, html: out } = prepareContent('<h2 id="intro">مقدمة</h2><h2 id="خاتمة">خاتمة</h2>');
    expect(headings.map((h) => h.id)).toEqual(['intro', 'خاتمة']);
    expect(out).toContain('<h2 id="intro">');
  });

  it('replaces unsafe ids', () => {
    const { headings } = prepareContent('<h2 id="a b">أ</h2><h2 id="x&quot;y">ب</h2>');
    for (const h of headings) expect(h.id).toMatch(/^[\p{L}\p{N}_-]+$/u);
    expect(headings[0].id).toBe('section-1');
  });

  it('de-duplicates repeated ids', () => {
    const { headings, html: out } = prepareContent('<h2 id="dup">أ</h2><h2 id="dup">ب</h2><h3 id="dup">ج</h3>');
    const ids = headings.map((h) => h.id);
    expect(ids[0]).toBe('dup');
    expect(new Set(ids).size).toBe(3);
    expect(out.match(/id="dup"/g)).toHaveLength(1);
  });

  it('does not collide a generated id with an existing one', () => {
    const { headings } = prepareContent('<h2 id="section-1">أ</h2><h2>ب</h2>');
    expect(headings.map((h) => h.id)).toEqual(['section-1', 'section-2']);
  });

  it('turns h1 into h2 and includes it in the outline', () => {
    const { html: out, headings } = prepareContent('<h1>عنوان كبير</h1>');
    expect(out).not.toMatch(/<h1/);
    expect(out).toMatch(/<h2 id="section-1">عنوان كبير<\/h2>/);
    expect(headings).toEqual([{ id: 'section-1', text: 'عنوان كبير', level: 2 }]);
  });

  it('never gives a heading an id the page itself uses', () => {
    const { headings, html: out } = prepareContent('<h2 id="main">أ</h2><h3 id="article-body">ب</h3><h2 id="toc-title">ج</h2><h2 id="site-mega-menu-g0">د</h2>');
    expect(headings.map((h) => h.id)).toEqual(['section-1', 'section-2', 'section-3', 'section-4']);
    expect(out).not.toMatch(/id="(main|article-body|toc-title|site-mega-menu-g0)"/);
  });

  it('keeps unique h4 ids out of the outline and drops clashing ones', () => {
    const { headings, html: out } = prepareContent('<h4 id="note">ملاحظة</h4><h2 id="note">أ</h2><h4 id="note">ب</h4><h4 id="main">ج</h4><h4>د</h4>');
    expect(headings).toEqual([{ id: 'section-1', text: 'أ', level: 2 }]);
    expect(out.match(/id="note"/g)).toHaveLength(1);
    expect(out).toContain('<h4 id="note">ملاحظة</h4>');
    expect(out).toContain('<h4>ب</h4>');
    expect(out).toContain('<h4>ج</h4>');
    expect(out).toContain('<h4>د</h4>');
  });

  it('strips a reserved or duplicate id from an empty heading', () => {
    expect(html('<h2 id="main"> </h2>')).toBe('<h2> </h2>');
  });

  it('decodes entities in heading text and skips empty headings', () => {
    const { headings } = prepareContent('<h2>أ &amp; ب</h2><h2> </h2><h4>ليس في الفهرس</h4>');
    expect(headings).toEqual([{ id: 'section-1', text: 'أ & ب', level: 2 }]);
  });
});

describe('prepareContent — structure, links and media', () => {
  it('wraps tables in .table-wrap', () => {
    const out = html('<table><tr><td>١</td></tr></table><table class="x"><tr><td>٢</td></tr></table>');
    expect(out.match(/<div class="table-wrap"><table/g)).toHaveLength(2);
    expect(out.match(/<\/table><\/div>/g)).toHaveLength(2);
  });

  it('rewrites internal absolute links to relative paths', () => {
    expect(html('<a href="https://risalatalkalima.com/foo/">x</a>')).toContain('href="/foo/"');
    expect(html('<a href="https://www.risalatalkalima.com/category/تأملات/?a=1#b">x</a>')).toMatch(/href="\/category\/[^"]+\/\?a=1#b"/);
    const internal = html('<a href="https://risalatalkalima.com/foo/" target="_blank" rel="nofollow">x</a>');
    expect(internal).not.toMatch(/target=/);
    expect(internal).not.toMatch(/rel=/);
  });

  it('keeps WordPress system links absolute', () => {
    const out = html('<a href="https://risalatalkalima.com/wp-content/uploads/2026/09/file.pdf">pdf</a>');
    expect(out).toContain('href="https://risalatalkalima.com/wp-content/uploads/2026/09/file.pdf"');
  });

  it('keeps relative, anchor, mailto and tel links', () => {
    expect(html('<a href="/about/">x</a>')).toContain('href="/about/"');
    expect(html('<a href="#section-1">x</a>')).toContain('href="#section-1"');
    expect(html('<a href="mailto:a@b.c">x</a>')).toContain('href="mailto:a@b.c"');
    expect(html('<a href="tel:+9611">x</a>')).toContain('href="tel:+9611"');
  });

  it('opens external links in a new tab safely', () => {
    const out = html('<a href="https://example.org/page">x</a>');
    expect(out).toContain('href="https://example.org/page"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it('lazy-loads images and always sets alt', () => {
    const out = html('<img src="https://risalatalkalima.com/wp-content/uploads/a.jpg" alt="صورة"><img src="/b.jpg">');
    expect(out.match(/loading="lazy"/g)).toHaveLength(2);
    expect(out).toContain('alt="صورة"');
    expect(out).toMatch(/<img src="\/b\.jpg"[^>]*alt=""/);
  });

  it('removes empty paragraphs but keeps content', () => {
    const out = html('<p></p><p> </p><p>نص</p>');
    expect(out).toBe('<p>نص</p>');
  });

  it('strips disallowed attributes like style', () => {
    expect(html('<p style="color:red" class="lead" dir="rtl">نص</p>')).toBe('<p class="lead" dir="rtl">نص</p>');
  });

  it('keeps only text-align from inline styles, on block elements', () => {
    expect(html('<p style="text-align:center">نص</p>')).toBe('<p style="text-align:center">نص</p>');
    expect(html('<h3 style="color:red;text-align: left">عنوان</h3>')).toBe('<h3 style="text-align:left" id="section-1">عنوان</h3>');
    expect(html('<td style="text-align:right">١</td>')).toContain('style="text-align:right"');
    expect(html('<p style="text-align:url(javascript:alert(1))">نص</p>')).toBe('<p>نص</p>');
    expect(html('<span style="text-align:center">نص</span>')).toBe('<span>نص</span>');
    expect(html('<p class="has-text-align-center">نص</p>')).toBe('<p class="has-text-align-center">نص</p>');
  });
});
