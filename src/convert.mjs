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

// Feather-style SVG icons (stroke-based, no fill)
const COPY_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const CODE_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';
const EYE_SVG  = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const ZIN_SVG  = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>';
const ZOUT_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>';
const ZRST_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>';

const LANG_NAMES = {
  js: 'JavaScript', javascript: 'JavaScript',
  ts: 'TypeScript', typescript: 'TypeScript',
  py: 'Python',     python: 'Python',
  sh: 'Bash',       bash: 'Bash', shell: 'Shell',
  go: 'Go', rust: 'Rust', html: 'HTML', css: 'CSS',
  java: 'Java', rb: 'Ruby', ruby: 'Ruby',
  cs: 'C#', cpp: 'C++', c: 'C',
  json: 'JSON', yaml: 'YAML', yml: 'YAML',
  md: 'Markdown', markdown: 'Markdown',
  sql: 'SQL', xml: 'XML', svg: 'SVG',
};

const LANG_COLORS = {
  js: '#f7df1e', javascript: '#f7df1e',
  ts: '#007acc', typescript: '#007acc',
  py: '#3572a5', python: '#3572a5',
  go: '#00add8', rust: '#dea584',
  html: '#e34c26', css: '#264de4',
  sh: '#89e051', bash: '#89e051', shell: '#89e051',
  java: '#b07219', rb: '#cc342d', ruby: '#cc342d',
};

// Split highlighted HTML at newlines while keeping span tags balanced.
// highlightjs does not close spans at line boundaries, so naively splitting
// produces broken HTML that corrupts the DOM when injected into table cells.
const splitHighlighted = (html) => {
  const tagRe = /<span class="([^"]+)">|<\/span>/g;
  let stack = [];
  return html.split('\n').reduce((lines, line, i, arr) => {
    if (i === arr.length - 1 && line === '') return lines;
    const prefix = stack.map((cls) => `<span class="${cls}">`).join('');
    tagRe.lastIndex = 0;
    const next = [...stack];
    let m;
    while ((m = tagRe.exec(line)) !== null) {
      if (m[1]) next.push(m[1]); else next.pop();
    }
    const suffix = next.map(() => '</span>').join('');
    stack = next;
    lines.push(prefix + line + suffix);
    return lines;
  }, []);
};

const codeHeader = (langKey) => {
  const key = langKey?.toLowerCase() ?? '';
  const name = LANG_NAMES[key] ?? langKey ?? 'Text';
  const color = LANG_COLORS[key];
  const dotStyle = color ? ` style="background:${color}"` : '';
  return `<div class="code-header"><div class="code-title"><span class="lang-dot"${dotStyle}></span><span class="language">${esc(name)}</span></div><button class="copy-btn" title="Copy">${COPY_SVG}</button></div>`;
};

const highlight = (token) => {
  const lang = highlightJs.getLanguage(token.lang) ? token.lang : 'plaintext';
  const lines = splitHighlighted(highlightJs.highlight(token.text, { language: lang }).value);
  const multi = lines.length > 1;
  const rows = lines.map((line, i) =>
    multi
      ? `<tr><td class="line-number">${i + 1}</td><td class="code-line">${line || '&nbsp;'}</td></tr>`
      : `<tr><td class="code-line">${line}</td></tr>`
  ).join('');
  return `<div class="code-block">${codeHeader(token.lang)}<div class="code-content"><table>${rows}</table></div></div>\n`;
};

const ZOOM_BAR = `<div class="zoom-controls"><button class="zoom-btn" data-dz="0.25" title="Zoom in">${ZIN_SVG}</button><button class="zoom-btn" data-dz="-0.25" title="Zoom out">${ZOUT_SVG}</button><button class="zoom-btn" data-dz="0" title="Reset">${ZRST_SVG}</button></div>`;

const previewBlock = (renderHtml, sourceHtml, label) => {
  const hdr = `<div class="preview-header"><div class="code-title"><span class="language">${esc(label)}</span></div><div class="actions"><button class="toggle-btn" title="Toggle source"><span class="icon-src">${CODE_SVG}</span><span class="icon-prev">${EYE_SVG}</span></button><button class="copy-btn" title="Copy source">${COPY_SVG}</button></div></div>`;
  const render = `<div class="render-view">${ZOOM_BAR}<div class="diagram-canvas"><div class="diagram-inner">${renderHtml}</div></div></div>`;
  const source = `<div class="source-view hidden"><pre class="source-code">${sourceHtml}</pre></div>`;
  return `<div class="preview-block">${hdr}${render}${source}</div>\n`;
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
        if (token.lang === 'mermaid') {
          return previewBlock(`<pre class="mermaid">${esc(token.text)}</pre>`, esc(token.text), 'Mermaid');
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
        return previewBlock(img, highlightJs.highlight(raw, { language: 'xml' }).value, 'SVG');
      },
    },
  });
  const body = await marked.parse(markdown);
  const title = toc.find((h) => h.depth === 1)?.text ?? key.split('/').pop();
  return { title, toc, body, usesMermaid };
};
