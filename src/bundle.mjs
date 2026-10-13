import { posix, resolve, relative } from 'node:path';
import { readFileSync, statSync } from 'node:fs';
import { discover, makePage } from './discover.mjs';
import { createResolver } from './links.mjs';
import { createImageEmbedder } from './assets.mjs';
import { loadMermaidLib } from './mermaid.mjs';
import { convert } from './convert.mjs';
import { buildTree } from './tree.mjs';
import * as reporter from './reporter.mjs';
import { isInside, fold, toPosix } from './paths.mjs';

/**
 * @typedef {Object} Page
 * @property {string} title
 * @property {string} body
 * @property {boolean} usesMermaid
 * @property {Array<{id: string, text: string, depth: number}>} toc
 */

/**
 * @typedef {Object} ImageStat
 * @property {string} page
 * @property {string} src
 * @property {number} size  raw file size in bytes
 */

/**
 * @typedef {Object} Site
 * @property {Record<string, Page>} pages
 * @property {Array<any>} tree
 * @property {string[]} order
 * @property {string} indexKey
 * @property {string} siteTitle
 * @property {boolean} usesMermaid
 * @property {string|null} mermaidLib
 * @property {string} [favicon]
 * @property {string} [defaultTheme]
 * @property {ImageStat[]} imageStats
 * @property {string[]} mermaidPages
 * @property {Array<{key: string, file: string}>} linkedPages  pages pulled in from outside the source directory
 */

const treeOrder = (nodes, out = []) => {
  for (const n of nodes) {
    if (n.dir) treeOrder(n.children, out);
    else out.push(n.key);
  }
  return out;
};

/**
 * Default start page: a root-level index/readme, else the first index/readme found
 * in any folder, else the first page.
 * @param {string[]} keys
 * @returns {string}
 */
export const defaultStartPage = (keys) =>
  keys.find((k) => /^(index|readme)$/i.test(k))
  ?? keys.find((k) => /\/(index|readme)$/i.test(k))
  ?? keys[0];

/**
 * Matches a user-supplied start page (e.g. "guides/setup", "guides/setup.md", "./Setup")
 * against the page keys: exact path first, then a unique trailing-path match.
 * @param {string[]} keys
 * @param {string} want
 * @returns {string|undefined}
 */
export const resolveStartPage = (keys, want) => {
  const norm = posix.normalize(String(want).replace(/\\/g, '/')).replace(/\.md$/i, '').replace(/^(\.\/|\/)+/, '').toLowerCase();
  const exact = keys.find((k) => k.toLowerCase() === norm);
  if (exact) return exact;
  const tail = keys.filter((k) => k.toLowerCase().endsWith('/' + norm));
  return tail.length === 1 ? tail[0] : undefined;
};

/**
 * @param {string} root
 * @param ignore
 * @param useGitignore
 * @param codeTableEnabled
 * @param startPage
 * @param {string[]} assetRoots  absolute directories images may be embedded from besides `root`
 * @param {boolean} includeLinked  bundle `.md` files outside `root` that pages link to
 * @returns {Promise<Site>}
 */
export const bundle = async (root, {
  ignore = [], useGitignore = false, codeTableEnabled = true, startPage = null,
  assetRoots = [], includeLinked = false,
} = {}) => {
  const sources = await discover(root, { ignore, useGitignore });
  if (!sources.length) throw new Error(`no .md files found under ${root}`);

  const active = sources.filter((s) => !s.meta?.draft);
  if (!active.length) throw new Error('all .md files are marked as draft');

  const keys = new Set(active.map((s) => s.key));
  const virtualPaths = new Map();   // key -> path relative to root, for pages outside it
  const linkedByPath = new Map();   // folded absolute path -> key (null: a draft)
  const linkedPages = [];
  const pending = [];

  // Called for a link target that is not a page under root. Pulls the target in when it is an
  // existing .md file outside root (and includeLinked is on); the new page is converted in the next
  // round, so links between outside pages are followed transitively and cycles end at linkedByPath.
  const external = (target) => {
    const abs = resolve(root, ...target.split('/'));
    const file = /\.md$/i.test(abs) ? abs : abs + '.md';
    if (!statSync(file, { throwIfNoEntry: false })?.isFile()) return undefined;
    const rel = toPosix(relative(root, file));
    const virtual = rel.replace(/\.md$/i, '');
    if (isInside(root, file)) {   // e.g. ../docs/x.md written from a page in docs/
      return keys.has(virtual) ? { key: virtual } : undefined;
    }
    if (!includeLinked) return { blocked: true };
    const id = fold(file);
    if (linkedByPath.has(id)) {
      const known = linkedByPath.get(id);
      return known ? { key: known } : undefined;
    }
    const base = '_external/' + virtual.replace(/^(?:\.\.\/)+/, '');
    let key = base;
    for (let n = 2; keys.has(key); n++) key = `${base}-${n}`;
    const page = makePage(readFileSync(file, 'utf8'), key, rel);
    if (page.meta?.draft) {
      linkedByPath.set(id, null);
      return undefined;
    }
    linkedByPath.set(id, key);
    keys.add(key);
    virtualPaths.set(key, virtual);
    linkedPages.push({ key, file });
    pending.push(page);
    return { key };
  };

  const resolveLink = createResolver(keys, { virtualPaths, external });
  const imageStats = [];
  const resolveImage = createImageEmbedder(root, (page, src, size) => imageStats.push({ page, src, size }), { assetRoots, virtualPaths });

  let done = 0;
  const results = [];
  for (let batch = active; batch.length; batch = pending.splice(0)) {
    results.push(...await Promise.all(batch.map(async ({ key, markdown, meta }) => {
      const page = await convert(markdown, key, { resolveLink, resolveImage }, codeTableEnabled);
      reporter.progress(++done, active.length + linkedPages.length, key);
      return { key, page, meta };
    })));
  }

  const pages = {};
  const list = [];
  let usesMermaid = false;
  for (const { key, page, meta } of results) {
    if (meta?.title) page.title = String(meta.title);
    pages[key] = page;
    list.push({ key, title: page.title });
    usesMermaid ||= page.usesMermaid;
  }

  for (const { from, href, outside } of resolveLink.broken) {
    reporter.warn(from, `broken link: "${href}"${outside ? ' — the file is outside the source directory; use --include-linked to bundle it' : ''}`);
  }

  const tree = buildTree(list);
  const order = treeOrder(tree);
  const mermaidPages = results.filter((r) => r.page.usesMermaid).map((r) => r.key);
  const defaultKey = defaultStartPage(active.map((s) => s.key));
  let indexKey = defaultKey;
  if (startPage) {
    const found = resolveStartPage(active.map((s) => s.key), startPage);
    if (found) indexKey = found;
    else reporter.warn('start-page', `"${startPage}" does not match any page — using "${defaultKey}"`);
  }
  const mermaidLib = usesMermaid ? await loadMermaidLib() : null;
  return { pages, tree, order, indexKey, siteTitle: pages[defaultKey].title, usesMermaid, mermaidLib, imageStats, mermaidPages, linkedPages };
};
