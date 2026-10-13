import { readFile } from 'node:fs/promises';
import { posix, resolve } from 'node:path';
import { Buffer } from 'node:buffer';
import { warn } from './reporter.mjs';
import { isInside } from './paths.mjs';

const MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp', ico: 'image/x-icon', svg: 'image/svg+xml',
};
const URL_SCHEMA_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * Images are embedded only from inside `root`, from one of `assetRoots`, or — for a page that was
 * pulled in from outside the source directory — from that page's own folder.
 * @param {string} root
 * @param {(page: string, src: string, size: number) => void} [onEmbed]
 * @param {Object} [opts]
 * @param {string[]} [opts.assetRoots]  absolute directories images may be read from besides `root`
 * @param {Map<string, string>} [opts.virtualPaths]  key -> path relative to `root` for pages outside it
 */
export const createImageEmbedder = (root, onEmbed, { assetRoots = [], virtualPaths = new Map() } = {}) =>
  async (currentKey, src) => {
    if (!src || URL_SCHEMA_REGEX.test(src)) return src;
    const clean = src.split('#')[0].split('?')[0];
    const mime = MIME[clean.split('.').pop().toLowerCase()];
    if (!mime) return src;

    const virtual = virtualPaths.get(currentKey);
    const pageDir = resolve(root, ...posix.dirname(virtual ?? currentKey).split('/'));
    const filePath = resolve(pageDir, ...clean.split('/'));
    const allowed = isInside(root, filePath)
      || assetRoots.some((dir) => isInside(dir, filePath))
      || (virtual !== undefined && isInside(pageDir, filePath));
    if (!allowed) {
      warn(currentKey, `image path "${clean}" is outside the source directory — use --asset-root to allow its folder`);
      return src;
    }
    try {
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
