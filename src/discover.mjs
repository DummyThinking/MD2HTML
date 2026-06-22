import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import yaml from 'js-yaml';

const parseFrontmatter = (content) => {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return { meta: {}, markdown: content };
  const end = content.indexOf('\n---', 4);
  if (end < 0) return { meta: {}, markdown: content };
  const yamlStr = content.slice(4, end);
  const rest = content.slice(end + 4).replace(/^\r?\n/, '');
  try {
    const parsed = yaml.load(yamlStr);
    const meta = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    return { meta, markdown: rest };
  } catch {
    return { meta: {}, markdown: content };
  }
};

const walk = async (dir, root, out) => {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full, root, out);
    else if (/\.md$/i.test(e.name)) {
      const key = relative(root, full).split(sep).join('/').replace(/\.md$/i, '');
      const raw = await readFile(full, 'utf8');
      const { meta, markdown } = parseFrontmatter(raw);
      out.push({ key, markdown, meta });
    }
  }
  return out;
};

export const discover = async (root) => {
  const pages = await walk(root, root, []);
  pages.sort((a, b) => a.key.localeCompare(b.key));
  return pages;
};
