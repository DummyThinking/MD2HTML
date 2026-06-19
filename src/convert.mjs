import { Marked } from 'marked';
import highlightJs from 'highlight.js';

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slugify = () => {
  const seen = new Map();
  return (raw) => {
    const base = raw.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-') || 'section';
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n}` : base;
  };
};

const wrapLines = (html) => {
  const lines = html.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return { body: lines.map((l) => `<span class="line">${l}</span>`).join(''), count: lines.length };
};

const highlight = (token) => {
  const lang = highlightJs.getLanguage(token.lang) ? token.lang : 'plaintext';
  const highlighted = highlightJs.highlight(token.text, { language: lang }).value;
  const langAttr = token.lang ? ` data-lang="${esc(token.lang)}"` : '';
  const { body, count } = wrapLines(highlighted);
  const preCls = count > 1 ? 'code-block line-numbers' : 'code-block';
  return `<pre class="${preCls}"${langAttr}><code class="hljs language-${esc(lang)}">${body}</code></pre>\n`;
};

export const convert = async (markdown, key, { resolveLink, resolveImage }) => {
  const slug = slugify();
  const toc = [];
  let usesMermaid = false;
  const marked = new Marked({
    gfm: true,
    async: true,
    /**
     * @param {import('marked').Token} token
     */
    walkTokens: async (token) => {
      if (token.type === 'link') token.href = resolveLink(key, token.href);
      else if (token.type === 'image') token.href = await resolveImage(key, token.href);
      else if (token.type === 'code' && token.lang === 'mermaid') usesMermaid = true;
      else if (token.type === 'heading' && token.depth <= 3) {
        token.id = slug(token.text);
        toc.push({ depth: token.depth, text: token.text, id: token.id });
      }
    },
    renderer: {
      /**
       * @param {import('marked').Tokens.Heading} token
       */
      heading(token) {
        const inner = this.parser.parseInline(token.tokens);
        if (!token.id) return `<h${token.depth}>${inner}</h${token.depth}>\n`;
        return `<h${token.depth} id="${token.id}"><a class="anchor" href="#/${key}~${token.id}" aria-label="Permalink">#</a>${inner}</h${token.depth}>\n`;
      },
      code(token) {
        if (token.lang === 'mermaid') {
          const srcLines = token.text.split('\n');
          const srcBody = srcLines.map((l) => `<span class="line">${esc(l)}</span>`).join('');
          const srcCls = `diagram-src${srcLines.length > 1 ? ' line-numbers' : ''}`;
          return `<div class="diagram-wrap"><pre class="mermaid">${esc(token.text)}</pre><button class="src-toggle" aria-expanded="false">Show source</button><pre class="${srcCls}" data-lang="mermaid"><code>${srcBody}</code></pre></div>\n`;
        }
        return highlight(token);
      },
      image(token) {
        const href = token.href ?? '';
        const alt = esc(token.text ?? '');
        const titleAttr = token.title ? ` title="${esc(token.title)}"` : '';
        const img = `<img src="${href}" alt="${alt}"${titleAttr}>`;
        if (!href.startsWith('data:image/svg+xml;utf8,')) return img;
        const raw = decodeURIComponent(href.slice('data:image/svg+xml;utf8,'.length));
        const { body, count } = wrapLines(highlightJs.highlight(raw, { language: 'xml' }).value);
        const srcCls = `diagram-src${count > 1 ? ' line-numbers' : ''}`;
        return `<div class="diagram-wrap">${img}<button class="src-toggle" aria-expanded="false">Show source</button><pre class="${srcCls}" data-lang="svg"><code class="hljs language-xml">${body}</code></pre></div>`;
      },
    },
  });
  const body = await marked.parse(markdown);
  const title = toc.find((h) => h.depth === 1)?.text ?? key.split('/').pop();
  return { title, toc, body, usesMermaid };
};
