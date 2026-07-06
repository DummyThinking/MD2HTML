#!/usr/bin/env node
import { resolve, join } from 'node:path';
import { writeFile, readFile } from 'node:fs/promises';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import yaml from 'js-yaml';
import { bundle } from './bundle.mjs';
import { renderSite } from './template.mjs';
import * as reporter from './reporter.mjs';

const USAGE = `usage: md2site <directory> [output.html] [options]

Converts a directory of Markdown files into a single self-contained HTML site.

Options:
  --name <title>            Site title (overrides md2site.json "name")
  --favicon <path>          Favicon image to embed (png, ico, svg, jpg)
  --watch, -w               Rebuild automatically when source files change
  --disable-table-print     Render JSON/YAML code blocks as plain code instead of tables
  --help, -h                Show this help message
`;

const parseArgs = (argv) => {
  const positional = [];
  let name = null, favicon = null, watch = false, codeTableEnabled = null, help = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--name') name = argv[++i];
    else if (arg.startsWith('--name=')) name = arg.slice(7);
    else if (arg === '--favicon') favicon = argv[++i];
    else if (arg.startsWith('--favicon=')) favicon = arg.slice(10);
    else if (arg === '--watch' || arg === '-w') watch = true;
    else if (arg === '--disable-table-print') codeTableEnabled = false;
    else if (arg === '--help' || arg === '-h') help = true;
    else positional.push(arg);
  }
  return { src: positional[0], out: positional[1], name, favicon, watch, codeTableEnabled, help };
};

const parseConfigText = (text, allowYaml = false) => {
  try { return JSON.parse(text); } catch { /* not JSON */ }
  if (allowYaml) {
    const parsed = yaml.load(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  }
  return null;
};

const loadConfig = async (srcDir) => {
  // .md2siterc (JSON or YAML) takes precedence over md2site.json
  try {
    const text = await readFile(join(srcDir, '.md2siterc'), 'utf8');
    const cfg = parseConfigText(text, true);
    if (cfg) return cfg;
    reporter.warn('.md2siterc', 'could not parse as JSON or YAML — falling back to md2site.json');
  } catch { /* not found, try next */ }
  try {
    return JSON.parse(await readFile(join(srcDir, 'md2site.json'), 'utf8'));
  } catch {
    return {};
  }
};

const FAVICON_MIME = { png: 'image/png', ico: 'image/x-icon', svg: 'image/svg+xml', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

const embedFavicon = async (faviconPath, srcDir) => {
  const abs = resolve(srcDir, faviconPath);
  const ext = abs.split('.').pop().toLowerCase();
  const mime = FAVICON_MIME[ext] ?? 'image/png';
  try {
    const buf = await readFile(abs);
    return mime === 'image/svg+xml'
      ? `data:image/svg+xml;utf8,${encodeURIComponent(buf.toString('utf8'))}`
      : `data:${mime};base64,${buf.toString('base64')}`;
  } catch (err) {
    reporter.warn('favicon', `could not embed "${faviconPath}": ${err.message}`);
    return null;
  }
};

const buildOnce = async (srcDir, config, cliName, cliFavicon, target) => {
  const site = await bundle(srcDir, {
    ignore: Array.isArray(config.ignore) ? config.ignore : [],
    useGitignore: config.gitignore === true,
    codeTableEnabled: config.codeTableEnabled ?? true,
  });
  site.siteTitle = cliName ?? config.name ?? site.siteTitle;
  site.defaultTheme = config.theme === 'dark' ? 'dark' : 'light';

  const faviconPath = cliFavicon ?? config.favicon;
  if (faviconPath) {
    const uri = await embedFavicon(faviconPath, srcDir);
    if (uri) site.favicon = uri;
  }

  reporter.imageSummary(site.imageStats);
  const mermaidLibSize = site.mermaidLib ? Buffer.byteLength(site.mermaidLib, 'utf8') : 0;
  reporter.mermaidSummary(site.mermaidPages, mermaidLibSize);

  const html = renderSite(site);
  await writeFile(target, html, 'utf8');
  const pages = Object.keys(site.pages).length;
  const size = reporter.formatSize(Buffer.byteLength(html, 'utf8'));
  return { pages, size };
};

const main = async () => {
  const { src, out, name, favicon, watch, codeTableEnabled, help } = parseArgs(process.argv.slice(2));
  if (help) {
    process.stdout.write(USAGE);
    process.exit(0);
  }
  if (!src) {
    process.stderr.write(USAGE);
    process.exit(1);
  }
  const srcDir = resolve(src);
  const config = await loadConfig(srcDir);
  const target = out ?? config.output ?? 'site.html';
  if (codeTableEnabled != null) config.codeTableEnabled = codeTableEnabled;
  else if (config.codeTableEnabled == null) config.codeTableEnabled = true;

  try {
    const { pages, size } = await buildOnce(srcDir, config, name, favicon, target);
    reporter.success(target, pages, size);
  } catch (err) {
    reporter.error(err.message);
    process.exit(1);
  }

  if (watch) {
    process.stdout.write(`Watching ${srcDir} for changes... (Ctrl+C to stop)\n`);
    const { watch: fsWatch } = await import('node:fs');
    let timer = null;
    fsWatch(srcDir, { recursive: true }, (event, filename) => {
      if (!filename || (!/\.(md|json)$/i.test(filename) && filename !== '.md2siterc')) return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const { pages, size } = await buildOnce(srcDir, config, name, favicon, target);
          reporter.success(target, pages, size);
        } catch (err) {
          reporter.error(err.message);
        }
      }, 150);
    });
  }
};

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
