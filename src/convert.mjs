import { Marked } from 'marked';
import hljs from 'highlight.js';

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

const highlight = (token) => {
  const lang = hljs.getLanguage(token.lang) ? token.lang : 'plaintext';
  return `<pre><code class="hljs language-${esc(token.lang || lang)}">${hljs.highlight(token.text, { language: lang }).value}</code></pre>\n`;
};

export const convert = async (markdown, key, { resolveLink, resolveImage }) => {
  const slug = slugify();
  const toc = [];
  let usesMermaid = false;
  const marked = new Marked({
    gfm: true,
    async: true,
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
      heading(token) {
        const inner = this.parser.parseInline(token.tokens);
        if (!token.id) return `<h${token.depth}>${inner}</h${token.depth}>\n`;
        return `<h${token.depth} id="${token.id}"><a class="anchor" href="#/${key}~${token.id}" aria-label="Permalink">#</a>${inner}</h${token.depth}>\n`;
      },
      code(token) {
        if (token.lang === 'mermaid') return `<pre class="mermaid">${esc(token.text)}</pre>\n`;
        return highlight(token);
      },
    },
  });
  const body = await marked.parse(markdown);
  const title = toc.find((h) => h.depth === 1)?.text ?? key.split('/').pop();
  return { title, toc, body, usesMermaid };
};
