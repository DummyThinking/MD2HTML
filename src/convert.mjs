import { Marked } from 'marked';
import highlightJs from 'highlight.js';
import yaml from 'js-yaml';

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
  'package-json': 'package.json', 'composer-json': 'composer.json',
  // template languages
  blade: 'Blade', 'blade.php': 'Blade',
  twig: 'Twig',
  handlebars: 'Handlebars', hbs: 'Handlebars',
  erb: 'ERB',
  haml: 'HAML',
  jinja: 'Jinja2', jinja2: 'Jinja2', django: 'Django', nunjucks: 'Nunjucks',
  liquid: 'Liquid',
  // additional common languages
  php: 'PHP',
  scss: 'SCSS', less: 'Less',
  kotlin: 'Kotlin', kt: 'Kotlin',
  swift: 'Swift',
  dart: 'Dart',
  lua: 'Lua',
  perl: 'Perl', pl: 'Perl',
  r: 'R',
  powershell: 'PowerShell', ps1: 'PowerShell',
  graphql: 'GraphQL', gql: 'GraphQL',
  dockerfile: 'Dockerfile', docker: 'Dockerfile',
  nginx: 'Nginx',
  ini: 'INI', toml: 'TOML',
  diff: 'Diff',
  makefile: 'Makefile',
  proto: 'Protobuf', protobuf: 'Protobuf',
};

// Maps fence identifiers that highlight.js doesn't know natively to its actual grammar names.
const LANG_ALIASES = {
  blade: 'php-template', 'blade.php': 'php-template',
  jinja: 'django', jinja2: 'django', nunjucks: 'django',
  hbs: 'handlebars',
  kt: 'kotlin',
  pl: 'perl',
  ps1: 'powershell',
  gql: 'graphql',
  docker: 'dockerfile',
  toml: 'ini',
  proto: 'protobuf',
  r: 'r',
};

const LANG_COLORS = {
  js: '#f7df1e', javascript: '#f7df1e',
  ts: '#007acc', typescript: '#007acc',
  py: '#3572a5', python: '#3572a5',
  go: '#00add8', rust: '#dea584',
  html: '#e34c26', css: '#264de4',
  sh: '#89e051', bash: '#89e051', shell: '#89e051',
  java: '#b07219', rb: '#cc342d', ruby: '#cc342d',
  php: '#4f5d95',
  scss: '#c6538c', less: '#1d365d',
  kotlin: '#7f52ff', kt: '#7f52ff',
  swift: '#f05138',
  dart: '#00b4ab',
  lua: '#000080',
  powershell: '#012456', ps1: '#012456',
  graphql: '#e10098', gql: '#e10098',
  blade: '#ef3b2d', 'blade.php': '#ef3b2d',
  twig: '#bacb52',
  handlebars: '#f7931e', hbs: '#f7931e',
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
  const alias = LANG_ALIASES[token.lang?.toLowerCase()];
  const resolved = alias ?? token.lang;
  const lang = highlightJs.getLanguage(resolved) ? resolved : 'plaintext';
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

const previewBlock = (renderHtml, sourceHtml, label, { zoom = true } = {}) => {
  const hdr = `<div class="preview-header"><div class="code-title"><span class="language">${esc(label)}</span></div><div class="actions"><button class="toggle-btn" title="Toggle source"><span class="icon-src">${CODE_SVG}</span><span class="icon-prev">${EYE_SVG}</span></button><button class="copy-btn" title="Copy source">${COPY_SVG}</button></div></div>`;
  const renderContent = zoom
    ? `${ZOOM_BAR}<div class="diagram-canvas"><div class="diagram-inner">${renderHtml}</div></div>`
    : renderHtml;
  const render = `<div class="render-view${zoom ? '' : ' data-view'}">${renderContent}</div>`;
  const source = `<div class="source-view hidden"><pre class="source-code">${sourceHtml}</pre></div>`;
  return `<div class="preview-block">${hdr}${render}${source}</div>\n`;
};

const isFlat = (v) => v == null || v instanceof Date || typeof v !== 'object';

const cellVal = (v) => {
  if (v == null) return '';
  if (v instanceof Date) return esc(v.toISOString());
  return esc(String(v));
};

const toDataTable = (data) => {
  if (Array.isArray(data) && data.length > 0
      && data.every((r) => r && typeof r === 'object' && !Array.isArray(r))
      && data.every((r) => Object.values(r).every(isFlat))) {
    const keys = [...new Set(data.flatMap((r) => Object.keys(r)))];
    const head = `<tr>${keys.map((k) => `<th>${esc(k)}</th>`).join('')}</tr>`;
    const body = data.map((r) => `<tr>${keys.map((k) => `<td>${cellVal(r[k])}</td>`).join('')}</tr>`).join('');
    return `<table class="data-table"><thead>${head}</thead><tbody>${body}</tbody></table>`;
  }
  if (data && typeof data === 'object' && !Array.isArray(data)
      && Object.values(data).every(isFlat)) {
    const rows = Object.entries(data).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${cellVal(v)}</td></tr>`).join('');
    return `<table class="data-table"><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  return null;
};

const tryDataPreview = (text, lang) => {
  try {
    const data = lang === 'json' ? JSON.parse(text) : yaml.load(text);
    return toDataTable(data);
  } catch {
    return null;
  }
};

const depTable = (deps) => {
  if (!deps || typeof deps !== 'object' || !Object.keys(deps).length) return '';
  const rows = Object.entries(deps)
    .map(([pkg, ver]) => `<tr><td class="pkg-dep-name">${esc(pkg)}</td><td class="pkg-dep-ver">${esc(String(ver))}</td></tr>`)
    .join('');
  return `<table class="data-table"><thead><tr><th>Package</th><th>Version</th></tr></thead><tbody>${rows}</tbody></table>`;
};

const scriptTable = (scripts) => {
  if (!scripts || typeof scripts !== 'object' || !Object.keys(scripts).length) return '';
  const rows = Object.entries(scripts)
    .map(([name, cmd]) => `<tr><td class="pkg-script-name">${esc(name)}</td><td class="pkg-script-cmd">${esc(String(cmd))}</td></tr>`)
    .join('');
  return `<table class="data-table"><thead><tr><th>Script</th><th>Command</th></tr></thead><tbody>${rows}</tbody></table>`;
};

const pkgSection = (title, content) =>
  content ? `<div class="pkg-section"><div class="pkg-section-title">${title}</div>${content}</div>` : '';

const badge = (text, cls) => `<span class="pkg-badge ${cls}">${esc(text)}</span>`;

const renderConfigBlock = (text, lang) => {
  let data;
  try { data = JSON.parse(text); } catch { return null; }
  if (!data || typeof data !== 'object' || Array.isArray(data) || !data.name) return null;

  const isComposer = lang === 'composer-json';
  const depKey    = isComposer ? 'require'     : 'dependencies';
  const devDepKey = isComposer ? 'require-dev' : 'devDependencies';
  const label     = isComposer ? 'composer.json' : 'package.json';

  const nameLine = `<div class="pkg-name-row"><span class="pkg-name">${esc(data.name)}</span>${
    data.version  ? badge(data.version, 'pkg-version') : ''}${
    data.license  ? badge(data.license, 'pkg-license') : ''}${
    data.private  ? badge('private',    'pkg-private')  : ''}</div>`;

  const header = `<div class="pkg-header">${nameLine}${
    data.description ? `<div class="pkg-desc">${esc(data.description)}</div>` : ''}</div>`;

  const sections = [
    pkgSection('Scripts',          scriptTable(data.scripts)),
    pkgSection('Dependencies',     depTable(data[depKey])),
    pkgSection('Dev Dependencies', depTable(data[devDepKey])),
    pkgSection('Peer Dependencies',depTable(data.peerDependencies)),
  ].join('');

  const srcHtml = highlightJs.highlight(text, { language: 'json' }).value;
  return previewBlock(`<div class="pkg-view">${header}${sections}</div>`, srcHtml, label, { zoom: false });
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
        const line = markdown.slice(0, markdown.indexOf(token.raw)).split('\n').length;
        const warn = (msg) => process.stderr.write(`[md2site] warn  ${key}:${line} — ${msg}\n`);
        if (token.lang === 'mermaid') {
          if (!token.text.trim()) warn('mermaid: empty block');
          return previewBlock(`<pre class="mermaid">${esc(token.text)}</pre>`, esc(token.text), 'Mermaid');
        }
        if (token.lang === 'package-json' || token.lang === 'composer-json') {
          const result = renderConfigBlock(token.text, token.lang);
          if (result) return result;
          const reason = (() => {
            try {
              const d = JSON.parse(token.text);
              if (!d || typeof d !== 'object' || Array.isArray(d)) return 'root value is not an object';
              if (!d.name) return 'missing required "name" field';
              return 'unknown';
            } catch (e) {
              return `JSON parse error — ${e.message}`;
            }
          })();
          warn(`${token.lang}: ${reason}`);
        }
        if (token.lang === 'json' || token.lang === 'yaml' || token.lang === 'yml') {
          const tableHtml = tryDataPreview(token.text, token.lang);
          if (tableHtml) {
            const srcHtml = highlightJs.highlight(token.text, { language: token.lang }).value;
            const label = LANG_NAMES[token.lang] ?? token.lang.toUpperCase();
            return previewBlock(tableHtml, srcHtml, label, { zoom: false });
          }
        }
        return highlight(token);
      },
      image(token) {
        const href = token.href ?? '';
        const alt = esc(token.text ?? '');
        const titleAttr = token.title ? ` title="${esc(token.title)}"` : '';
        const img = `<img src="${esc(href)}" alt="${alt}"${titleAttr}>`;
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
