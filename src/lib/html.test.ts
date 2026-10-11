import { describe, expect, it } from 'vitest';
import { prepareContent } from './html';

describe('prepareContent', () => {
  it('strips scripts and inline handlers', () => {
    const { html } = prepareContent('<p onclick="x()">نص</p><script>alert(1)</script><a href="javascript:alert(1)">ر</a>');
    expect(html).toBe('<p>نص</p><a href="#">ر</a>');
  });
  it('anchors headings and collects them', () => {
    const { html, headings } = prepareContent('<h2>الفرح الحقيقي</h2><h3 id="x">فرعي</h3><h2></h2>');
    expect(headings).toEqual([
      { id: 'section-1', text: 'الفرح الحقيقي', level: 2 },
      { id: 'x', text: 'فرعي', level: 3 },
    ]);
    expect(html).toContain('<h2 id="section-1">الفرح الحقيقي</h2>');
  });
  it('lazy-loads media and relativises internal links', () => {
    const { html } = prepareContent(
      '<img src="a.jpg"><iframe src="https://www.youtube.com/embed/x"></iframe><a href="https://risalatalkalima.com/فرح/">ر</a><a href="https://risalatalkalima.com/wp-content/uploads/a.pdf">pdf</a>',
    );
    expect(html).toContain('<img loading="lazy" decoding="async" src="a.jpg">');
    expect(html).toContain('<iframe loading="lazy" src=');
    expect(html).toContain('href="/فرح/"');
    expect(html).toContain('href="https://risalatalkalima.com/wp-content/uploads/a.pdf"');
  });
});
