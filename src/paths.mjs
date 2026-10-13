import { relative, isAbsolute, sep } from 'node:path';
import process from 'node:process';

/**
 * True when `target` is `base` itself or lies somewhere below it.
 * Uses path.relative, so it is case-insensitive on Windows and treats a
 * different drive (where relative() returns an absolute path) as outside.
 */
export const isInside = (base, target) => {
  const rel = relative(base, target);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel));
};

/** Case-folds a path for use as a Map key on case-insensitive platforms. */
export const fold = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);

export const toPosix = (p) => p.split(sep).join('/');
