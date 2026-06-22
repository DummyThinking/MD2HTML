// Colored terminal output for stderr (progress/warnings) and stdout (success).
// All colors are suppressed automatically when the stream is not a TTY (pipes, CI).

const errTTY = process.stderr.isTTY;
const outTTY = process.stdout.isTTY;

const ce = (code, s) => errTTY ? `\x1b[${code}m${s}\x1b[0m` : s;
const co = (code, s) => outTTY ? `\x1b[${code}m${s}\x1b[0m` : s;

const PREFIX = ce('2', '[md2site]');

export const formatSize = (bytes) =>
  bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB`
  : bytes >= 1024 ? `${Math.round(bytes / 1024)} KB`
  : `${bytes} B`;

const sizeStr = (bytes) =>
  bytes >= 500_000 ? ce('31', formatSize(bytes))   // red  ≥ 500 KB
  : bytes >= 80_000 ? ce('33', formatSize(bytes))  // yellow ≥ 80 KB
  : formatSize(bytes);

export const progress = (done, total, key) => {
  const counter = `${ce('1;36', String(done))}${ce('2', '/' + total)}`;
  process.stderr.write(`${PREFIX} ${counter} ${ce('2', key)}\n`);
};

export const warn = (location, msg) =>
  process.stderr.write(`${PREFIX} ${ce('33', 'warn')}  ${ce('2', location)} — ${msg}\n`);

export const error = (msg) =>
  process.stderr.write(`${PREFIX} ${ce('31', 'error')} ${msg}\n`);

/**
 * @param {Array<{page: string, src: string, size: number}>} images
 */
export const imageSummary = (images) => {
  if (!images.length) return;
  const total = images.reduce((s, i) => s + i.size, 0);
  process.stderr.write(
    `\n${PREFIX} ${ce('1', 'Images')} — ${ce('36', String(images.length))} embedded, ${sizeStr(total)} total\n`
  );
  const colPage = Math.min(32, Math.max(...images.map((i) => i.page.length)));
  const colSrc  = Math.min(40, Math.max(...images.map((i) => i.src.length)));
  for (const { page, src, size } of images) {
    process.stderr.write(
      `  ${ce('2', page.padEnd(colPage))}  ${src.padEnd(colSrc)}  ${sizeStr(size)}\n`
    );
  }
};

/**
 * @param {string[]} pages
 * @param {number} libSize  byte length of the inlined mermaid library
 */
export const mermaidSummary = (pages, libSize) => {
  if (!pages.length) return;
  const count = `${ce('36', String(pages.length))} page${pages.length !== 1 ? 's' : ''}`;
  const lib   = `library ${ce('33', formatSize(libSize))}`;
  process.stderr.write(`\n${PREFIX} ${ce('1', 'Mermaid')} — ${count}, ${lib}\n`);
  process.stderr.write(`  ${ce('2', pages.join(', '))}\n`);
};

export const success = (target, pages, size) =>
  process.stdout.write(`${co('1;32', target)} — ${pages} pages, ${co('1', size)}\n`);
