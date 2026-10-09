import { posix } from 'node:path';
import { discover } from './discover.mjs';
import { createResolver } from './links.mjs';
import { createImageEmbedder } from './assets.mjs';
import { loadMermaidLib } from './mermaid.mjs';
import { convert } from './convert.mjs';
import { buildTree } from './tree.mjs';
import * as reporter from './reporter.mjs';

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
 * @returns {Promise<Site>}
 */
export const bundle = async (root, { ignore = [], useGitignore = false , codeTableEnabled = true, startPage = null} = {}) => {
  const sources = await discover(root, { ignore, useGitignore });
  if (!sources.length) throw new Error(`no .md files found under ${root}`);

  const active = sources.filter((s) => !s.meta?.draft);
  if (!active.length) throw new Error('all .md files are marked as draft');

  const resolveLink = createResolver(new Set(active.map((s) => s.key)));
  const imageStats = [];
  const resolveImage = createImageEmbedder(root, (page, src, size) => imageStats.push({ page, src, size }));

  const total = active.length;
  let done = 0;
  const results = await Promise.all(active.map(async ({ key, markdown, meta }) => {
    const page = await convert(markdown, key, { resolveLink, resolveImage }, codeTableEnabled);
    reporter.progress(++done, total, key);
    return { key, page, meta };
  }));

  const pages = {};
  const list = [];
  let usesMermaid = false;
  for (const { key, page, meta } of results) {
    if (meta?.title) page.title = String(meta.title);
    pages[key] = page;
    list.push({ key, title: page.title });
    usesMermaid ||= page.usesMermaid;
  }

  for (const { from, href } of resolveLink.broken) {
    reporter.warn(from, `broken link: "${href}"`);
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
  return { pages, tree, order, indexKey, siteTitle: pages[defaultKey].title, usesMermaid, mermaidLib, imageStats, mermaidPages };
};
