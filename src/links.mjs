import { posix } from 'node:path';

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const route = (key, frag) => `#/${key}${frag ? '~' + frag : ''}`;

// Same normalisation convert.mjs applies to heading ids (minus de-duplication).
const headingId = (text) =>
  text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

/**
 * @param {Set<string>} keys  page keys (relative to the source root, no extension)
 * @param {Object} [opts]
 * @param {Map<string, string>} [opts.virtualPaths]  key -> path relative to the source root (may start
 *   with `../`) for pages that live outside it; every other page's path is its key
 * @param {(target: string) => ({ key: string } | { blocked: true } | undefined)} [opts.external]
 *   called for a link target that is not a known page; `target` is the normalised path relative to
 *   the source root, with the extension if the link had one
 */
export const createResolver = (keys, { virtualPaths = new Map(), external } = {}) => {
  const broken = [];

  // Case-insensitive lookup of every key by full path, for [[wikilink]] resolution.
  const lowerKeys = [...keys].map((k) => ({ key: k, lower: k.toLowerCase() }));

  // Obsidian-style: `[[name]]` matches a page by file name anywhere in the tree,
  // `[[dir/name]]` matches by trailing path. Ties go to the page nearest the linking page.
  const findWikiTarget = (currentKey, name) => {
    const want = posix.normalize(name).replace(/\.md$/i, '').replace(/^\/+/, '').toLowerCase();
    const matches = lowerKeys.filter((k) => k.lower === want || k.lower.endsWith('/' + want));
    if (matches.length <= 1) return matches[0]?.key;
    const dir = posix.dirname(currentKey);
    const rank = (k) => [
      posix.dirname(k.key) === dir ? 0 : 1,
      k.key.split('/').length,
      k.key,
    ];
    return matches.sort((a, b) => {
      const [ra, rb] = [rank(a), rank(b)];
      return ra[0] - rb[0] || ra[1] - rb[1] || (ra[2] < rb[2] ? -1 : 1);
    })[0].key;
  };

  const fn = (currentKey, href) => {
    if (!href || EXTERNAL.test(href)) return href;
    if (href.startsWith('#')) return route(currentKey, href.slice(1));
    const hashIdx = href.indexOf('#');
    const path = hashIdx < 0 ? href : href.slice(0, hashIdx);
    const frag = hashIdx < 0 ? '' : href.slice(hashIdx + 1);
    const dir = posix.dirname(virtualPaths.get(currentKey) ?? currentKey);
    const joined = posix.normalize(posix.join(dir, path));
    const target = joined.replace(/\.md$/i, '');
    if (keys.has(target)) return route(target, frag);
    const ext = external?.(joined);
    if (ext?.key) return route(ext.key, frag);
    broken.push(ext?.blocked ? { from: currentKey, href, outside: true } : { from: currentKey, href });
    return href;
  };
  /**
   * Resolves the inside of a `[[target#heading|alias]]` link.
   * Returns { href, label }; href is null (and the link recorded as broken) when no page matches.
   */
  fn.wiki = (currentKey, inner) => {
    const [ref, ...aliasParts] = inner.split('|');
    const alias = aliasParts.join('|').trim();
    const hashIdx = ref.indexOf('#');
    const name = (hashIdx < 0 ? ref : ref.slice(0, hashIdx)).trim();
    const heading = hashIdx < 0 ? '' : ref.slice(hashIdx + 1).trim();
    const label = alias || [name, heading].filter(Boolean).join(' > ');
    const target = name ? findWikiTarget(currentKey, name) : currentKey;
    if (!target) {
      broken.push({ from: currentKey, href: `[[${inner}]]` });
      return { href: null, label };
    }
    return { href: route(target, heading && headingId(heading)), label };
  };
  fn.broken = broken;
  return fn;
};
