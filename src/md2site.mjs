#!/usr/bin/env node
import { resolve, join } from 'node:path';
import { writeFile, readFile } from 'node:fs/promises';
import process from 'node:process';
import { bundle } from './bundle.mjs';
import { renderSite } from './template.mjs';

const parseArgs = (argv) => {
  const positional = [];
  let name = null, favicon = null, watch = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--name') name = argv[++i];
    else if (arg.startsWith('--name=')) name = arg.slice(7);
    else if (arg === '--favicon') favicon = argv[++i];
    else if (arg.startsWith('--favicon=')) favicon = arg.slice(10);
    else if (arg === '--watch' || arg === '-w') watch = true;
    else positional.push(arg);
  }
  return { src: positional[0], out: positional[1], name, favicon, watch };
};

const loadConfig = async (srcDir) => {
  try {
    return JSON.parse(await readFile(join(srcDir, 'md2site.json'), 'utf8'));
  } catch {
    return {};
  }
};

const formatSize = (bytes) =>
  bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

const FAVICON_MIME = { png: 'image/png', ico: 'image/x-icon', svg: 'image/svg+xml', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

const embedFavicon = async (faviconPath, srcDir) => {
  const abs = resolve(srcDir, faviconPath);
  const ext = abs.split('.').pop().toLowerCase();
  const mime = FAVICON_MIME[ext] ?? 'image/png';
  try {
    const data = await readFile(abs, mime === 'image/svg+xml' ? 'utf8' : 'base64');
    return mime === 'image/svg+xml'
      ? `data:image/svg+xml;utf8,${encodeURIComponent(data)}`
      : `data:${mime};base64,${data}`;
  } catch (err) {
    process.stderr.write(`[md2site] warn  could not embed favicon "${faviconPath}": ${err.message}\n`);
    return null;
  }
};

const buildOnce = async (srcDir, config, cliName, cliFavicon, target) => {
  const site = await bundle(srcDir);
  site.siteTitle = cliName ?? config.name ?? site.siteTitle;
  site.defaultTheme = config.theme === 'dark' ? 'dark' : 'light';

  const faviconPath = cliFavicon ?? config.favicon;
  if (faviconPath) {
    const uri = await embedFavicon(faviconPath, srcDir);
    if (uri) site.favicon = uri;
  }

  const html = renderSite(site);
  await writeFile(target, html, 'utf8');
  return { pages: Object.keys(site.pages).length, size: formatSize(Buffer.byteLength(html, 'utf8')) };
};

const main = async () => {
  const { src, out, name, favicon, watch } = parseArgs(process.argv.slice(2));
  if (!src) {
    process.stderr.write('usage: md2site <directory> [output.html] [--name "Site Name"] [--favicon path] [--watch]\n');
    process.exit(1);
  }
  const srcDir = resolve(src);
  const config = await loadConfig(srcDir);
  const target = out ?? config.output ?? 'site.html';

  try {
    const { pages, size } = await buildOnce(srcDir, config, name, favicon, target);
    process.stdout.write(`${target} — ${pages} pages, ${size}\n`);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }

  if (watch) {
    process.stdout.write(`Watching ${srcDir} for changes... (Ctrl+C to stop)\n`);
    const { watch: fsWatch } = await import('node:fs');
    let timer = null;
    fsWatch(srcDir, { recursive: true }, (event, filename) => {
      if (!filename || !/\.(md|json)$/i.test(filename)) return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const { pages, size } = await buildOnce(srcDir, config, name, favicon, target);
          process.stdout.write(`[${new Date().toLocaleTimeString()}] rebuilt — ${pages} pages, ${size}\n`);
        } catch (err) {
          process.stderr.write(`[md2site] error: ${err.message}\n`);
        }
      }, 150);
    });
  }
};

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
