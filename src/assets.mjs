import { readFile } from 'node:fs/promises';
import { posix, join } from 'node:path';

const MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp', ico: 'image/x-icon', svg: 'image/svg+xml',
};
const URL_SCHEMA_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

export const createImageEmbedder = (root) => async (currentKey, src) => {
  if (!src || URL_SCHEMA_REGEX.test(src)) return src;
  const clean = src.split('#')[0].split('?')[0];
  const rel = posix.normalize(posix.join(posix.dirname(currentKey), clean));
  if (rel.startsWith('../') || rel === '..') {
    process.stderr.write(`[md2site] warn  ${currentKey} — image path "${clean}" escapes root directory\n`);
    return src;
  }
  const mime = MIME[rel.split('.').pop().toLowerCase()];
  if (!mime) return src;
  try {
    const filePath = join(root, ...rel.split('/'));
    const encoding = mime === 'image/svg+xml' ? 'utf8' : 'base64';
    const content = await readFile(filePath, encoding);
    return mime === 'image/svg+xml'
      ? `data:image/svg+xml;utf8,${encodeURIComponent(content)}`
      : `data:${mime};base64,${content}`;
  } catch (err) {
    process.stderr.write(`[md2site] warn  ${currentKey} — could not embed image "${clean}": ${err.code ?? err.message}\n`);
    return src;
  }
};
