import { readFile } from 'node:fs/promises';
import { posix, join } from 'node:path';

const MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp', ico: 'image/x-icon', svg: 'image/svg+xml',
};
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

export const createImageEmbedder = (root) => async (currentKey, src) => {
  if (!src || EXTERNAL.test(src)) return src;
  const clean = src.split('#')[0].split('?')[0];
  const rel = posix.normalize(posix.join(posix.dirname(currentKey), clean));
  const mime = MIME[rel.split('.').pop().toLowerCase()];
  if (!mime) return src;
  try {
    const buf = await readFile(join(root, ...rel.split('/')));
    return mime === 'image/svg+xml'
      ? `data:image/svg+xml;utf8,${encodeURIComponent(buf.toString('utf8'))}`
      : `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return src;
  }
};
