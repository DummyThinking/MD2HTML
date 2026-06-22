import { posix } from 'node:path';

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const route = (key, frag) => `#/${key}${frag ? '~' + frag : ''}`;

export const createResolver = (keys) => {
  const broken = [];
  const fn = (currentKey, href) => {
    if (!href || EXTERNAL.test(href)) return href;
    if (href.startsWith('#')) return route(currentKey, href.slice(1));
    const hashIdx = href.indexOf('#');
    const path = hashIdx < 0 ? href : href.slice(0, hashIdx);
    const frag = hashIdx < 0 ? '' : href.slice(hashIdx + 1);
    const dir = posix.dirname(currentKey);
    const target = posix.normalize(posix.join(dir, path)).replace(/\.md$/i, '');
    if (keys.has(target)) return route(target, frag);
    broken.push({ from: currentKey, href });
    return href;
  };
  fn.broken = broken;
  return fn;
};
