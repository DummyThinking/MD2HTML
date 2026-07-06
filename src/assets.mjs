import { readFile } from 'node:fs/promises';
import { posix, join } from 'node:path';
import { Buffer } from 'node:buffer';
import { warn } from './reporter.mjs';

const MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp', ico: 'image/x-icon', svg: 'image/svg+xml',
};
const URL_SCHEMA_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * @param {string} root
 * @param {(page: string, src: string, size: number) => void} [onEmbed]
 */
export const createImageEmbedder = (root, onEmbed) => async (currentKey, src) => {
  if (!src || URL_SCHEMA_REGEX.test(src)) return src;
  const clean = src.split('#')[0].split('?')[0];
  const rel = posix.normalize(posix.join(posix.dirname(currentKey), clean));
  if (rel.startsWith('../') || rel === '..') {
    warn(currentKey, `image path "${clean}" escapes root directory`);
    return src;
  }
  const mime = MIME[rel.split('.').pop().toLowerCase()];
  if (!mime) return src;
  try {
    const filePath = join(root, ...rel.split('/'));
    /** @type {Buffer} */
    const buf = await readFile(filePath);
    const uri = mime === 'image/svg+xml'
      ? `data:image/svg+xml;utf8,${encodeURIComponent(buf.toString('utf8'))}`
      : `data:${mime};base64,${buf.toString('base64')}`;
    onEmbed?.(currentKey, clean, buf.length);
    return uri;
  } catch (err) {
    warn(currentKey, `could not embed image "${clean}": ${err.code ?? err.message}`);
    return src;
  }
};
