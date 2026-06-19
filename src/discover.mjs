import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const walk = async (dir, root, out) => {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full, root, out);
    else if (/\.md$/i.test(e.name)) {
      const key = relative(root, full).split(sep).join('/').replace(/\.md$/i, '');
      out.push({ key, markdown: await readFile(full, 'utf8') });
    }
  }
  return out;
};

export const discover = async (root) => {
  const pages = await walk(root, root, []);
  pages.sort((a, b) => a.key.localeCompare(b.key));
  return pages;
};
