import { discover } from './discover.mjs';
import { createResolver } from './links.mjs';
import { createImageEmbedder } from './assets.mjs';
import { loadMermaidLib } from './mermaid.mjs';
import { convert } from './convert.mjs';
import { buildTree } from './tree.mjs';

/**
 * @typedef {Object} Page
 * @property {string} title
 * @property {string} html
 * @property {boolean} usesMermaid
 * @property {Array<{id: string, text: string, level: number}>} toc
 */

/**
 * @typedef {Object} Site
 * @property {Record<string, Page>} pages
 * @property {Array<any>} tree
 * @property {string} indexKey
 * @property {string} siteTitle
 * @property {boolean} usesMermaid
 * @property {string|null} mermaidLib
 */

/**
 * @param {string} root
 * @returns {Promise<Site>}
 */
export const bundle = async (root) => {
  const sources = await discover(root);
  if (!sources.length) throw new Error(`no .md files found under ${root}`);

  const resolveLink = createResolver(new Set(sources.map((s) => s.key)));
  const resolveImage = createImageEmbedder(root);

  const pages = {};
  const list = [];
  let usesMermaid = false;
  for (const { key, markdown } of sources) {
    const page = await convert(markdown, key, { resolveLink, resolveImage });
    pages[key] = page;
    list.push({ key, title: page.title });
    usesMermaid ||= page.usesMermaid;
  }

  const indexKey = sources.find((s) => /(^|\/)(index|readme)$/i.test(s.key))?.key ?? sources[0].key;
  const mermaidLib = usesMermaid ? await loadMermaidLib() : null;
  return { pages, tree: buildTree(list), indexKey, siteTitle: pages[indexKey].title, usesMermaid, mermaidLib };
};
