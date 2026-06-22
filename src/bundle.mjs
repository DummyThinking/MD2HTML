import { discover } from './discover.mjs';
import { createResolver } from './links.mjs';
import { createImageEmbedder } from './assets.mjs';
import { loadMermaidLib } from './mermaid.mjs';
import { convert } from './convert.mjs';
import { buildTree } from './tree.mjs';

/**
 * @typedef {Object} Page
 * @property {string} title
 * @property {string} body
 * @property {boolean} usesMermaid
 * @property {Array<{id: string, text: string, depth: number}>} toc
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
 */

const treeOrder = (nodes, out = []) => {
  for (const n of nodes) {
    if (n.dir) treeOrder(n.children, out);
    else out.push(n.key);
  }
  return out;
};

/**
 * @param {string} root
 * @returns {Promise<Site>}
 */
export const bundle = async (root) => {
  const sources = await discover(root);
  if (!sources.length) throw new Error(`no .md files found under ${root}`);

  const active = sources.filter((s) => !s.meta?.draft);
  if (!active.length) throw new Error('all .md files are marked as draft');

  const resolveLink = createResolver(new Set(active.map((s) => s.key)));
  const resolveImage = createImageEmbedder(root);

  const total = active.length;
  let done = 0;
  const results = await Promise.all(active.map(async ({ key, markdown, meta }) => {
    const page = await convert(markdown, key, { resolveLink, resolveImage });
    done++;
    process.stderr.write(`[md2site] ${done}/${total} ${key}\n`);
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
    process.stderr.write(`[md2site] warn  ${from} — broken link: "${href}"\n`);
  }

  const tree = buildTree(list);
  const order = treeOrder(tree);
  const indexKey = active.find((s) => /(^|\/)(index|readme)$/i.test(s.key))?.key ?? active[0].key;
  const mermaidLib = usesMermaid ? await loadMermaidLib() : null;
  return { pages, tree, order, indexKey, siteTitle: pages[indexKey].title, usesMermaid, mermaidLib };
};
