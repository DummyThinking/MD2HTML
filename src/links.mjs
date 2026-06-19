import { posix } from 'node:path';

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const route = (key, frag) => `#/${key}${frag ? '~' + frag : ''}`;

export const createResolver = (keys) => (currentKey, href) => {
  if (!href || EXTERNAL.test(href)) return href;
  if (href.startsWith('#')) return route(currentKey, href.slice(1));
  const [path, frag] = href.split('#');
  const dir = posix.dirname(currentKey);
  const target = posix.normalize(posix.join(dir, path)).replace(/\.md$/i, '');
  return keys.has(target) ? route(target, frag) : href;
};
