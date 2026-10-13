#!/usr/bin/env node
import { resolve, join, dirname } from 'node:path';
import { writeFile, readFile } from 'node:fs/promises';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import yaml from 'js-yaml';
import { bundle } from './bundle.mjs';
import { renderSite } from './template.mjs';
import * as reporter from './reporter.mjs';

const USAGE = `usage: md2html <directory> [output.html] [options]

Converts a directory of Markdown files into a single self-contained HTML site.

Options:
  --name <title>            Site title (overrides md2html.json "name")
  --favicon <path>          Favicon image to embed (png, ico, svg, jpg)
  --start-page <page>       Page shown first, e.g. guides/setup (default: root index/readme)
  --asset-root <dir>        Also embed images from this folder, even outside the source directory
                            (repeatable)
  --include-linked          Bundle .md files outside the source directory that pages link to
  --watch, -w               Rebuild automatically when source files change
  --disable-table-print     Render JSON/YAML code blocks as plain code instead of tables
  --help, -h                Show this help message
`;

const parseArgs = (argv) => {
  const positional = [];
  let name = null, favicon = null, startPage = null, watch = false, codeTableEnabled = null, help = false;
  let includeLinked = false;
  const assetRoots = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--name') name = argv[++i];
    else if (arg.startsWith('--name=')) name = arg.slice(7);
    else if (arg === '--favicon') favicon = argv[++i];
    else if (arg.startsWith('--favicon=')) favicon = arg.slice(10);
    else if (arg === '--start-page') startPage = argv[++i];
    else if (arg.startsWith('--start-page=')) startPage = arg.slice(13);
    else if (arg === '--asset-root') assetRoots.push(argv[++i]);
    else if (arg.startsWith('--asset-root=')) assetRoots.push(arg.slice(13));
    else if (arg === '--include-linked') includeLinked = true;
    else if (arg === '--watch' || arg === '-w') watch = true;
    else if (arg === '--disable-table-print') codeTableEnabled = false;
    else if (arg === '--help' || arg === '-h') help = true;
    else positional.push(arg);
  }
  return { src: positional[0], out: positional[1], name, favicon, startPage, assetRoots, includeLinked, watch, codeTableEnabled, help };
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
  // .md2htmlrc (JSON or YAML) takes precedence over md2html.json
  try {
    const text = await readFile(join(srcDir, '.md2htmlrc'), 'utf8');
    const cfg = parseConfigText(text, true);
    if (cfg) return cfg;
    reporter.warn('.md2htmlrc', 'could not parse as JSON or YAML — falling back to md2html.json');
  } catch { /* not found, try next */ }
  try {
    return JSON.parse(await readFile(join(srcDir, 'md2html.json'), 'utf8'));
  } catch {
    return {};
  }
};

const FAVICON_MIME = { png: 'image/png', ico: 'image/x-icon', svg: 'image/svg+xml', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

const embedFavicon = async (abs, faviconPath) => {
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

const buildOnce = async (srcDir, config, cli, target) => {
  // Paths from the command line are relative to the cwd; paths from the config file, to the source directory.
  const assetRoots = (cli.assetRoots.length ? cli.assetRoots.map((p) => resolve(p))
    : (Array.isArray(config.assetRoots) ? config.assetRoots : []).map((p) => resolve(srcDir, String(p))));
  const site = await bundle(srcDir, {
    startPage: cli.startPage ?? config.startPage ?? null,
    assetRoots,
    includeLinked: cli.includeLinked || config.includeLinked === true,
    ignore: Array.isArray(config.ignore) ? config.ignore : [],
    useGitignore: config.gitignore === true,
    codeTableEnabled: config.codeTableEnabled ?? true,
  });
  site.siteTitle = cli.name ?? config.name ?? site.siteTitle;
  site.defaultTheme = config.theme === 'dark' ? 'dark' : 'light';

  const faviconPath = cli.favicon ?? config.favicon;
  if (faviconPath) {
    const uri = await embedFavicon(cli.favicon ? resolve(faviconPath) : resolve(srcDir, faviconPath), faviconPath);
    if (uri) site.favicon = uri;
  }

  reporter.linkedSummary(site.linkedPages);
  reporter.imageSummary(site.imageStats);
  const mermaidLibSize = site.mermaidLib ? Buffer.byteLength(site.mermaidLib, 'utf8') : 0;
  reporter.mermaidSummary(site.mermaidPages, mermaidLibSize);

  const html = renderSite(site);
  await writeFile(target, html, 'utf8');
  const pages = Object.keys(site.pages).length;
  const size = reporter.formatSize(Buffer.byteLength(html, 'utf8'));
  return { pages, size, linkedDirs: [...new Set(site.linkedPages.map((p) => dirname(p.file)))] };
};

const main = async () => {
  const cli = parseArgs(process.argv.slice(2));
  const { src, out, watch, codeTableEnabled, help } = cli;
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

  const linkedWatchers = new Map();
  let rebuild = null;
  // Linked .md files live outside srcDir, so --watch needs a watcher on each of their folders.
  const syncLinkedWatchers = async (dirs) => {
    if (!watch) return;
    const { watch: fsWatch } = await import('node:fs');
    for (const dir of dirs) {
      if (linkedWatchers.has(dir)) continue;
      linkedWatchers.set(dir, fsWatch(dir, (event, filename) => {
        if (filename && /\.md$/i.test(filename)) rebuild();
      }));
    }
    for (const [dir, watcher] of linkedWatchers) {
      if (dirs.includes(dir)) continue;
      watcher.close();
      linkedWatchers.delete(dir);
    }
  };

  const run = async () => {
    const { pages, size, linkedDirs } = await buildOnce(srcDir, config, cli, target);
    reporter.success(target, pages, size);
    await syncLinkedWatchers(linkedDirs);
  };

  try {
    await run();
  } catch (err) {
    reporter.error(err.message);
    process.exit(1);
  }

  if (watch) {
    process.stdout.write(`Watching ${srcDir} for changes... (Ctrl+C to stop)\n`);
    const { watch: fsWatch } = await import('node:fs');
    let timer = null;
    rebuild = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          await run();
        } catch (err) {
          reporter.error(err.message);
        }
      }, 150);
    };
    fsWatch(srcDir, { recursive: true }, (event, filename) => {
      if (!filename || (!/\.(md|json)$/i.test(filename) && filename !== '.md2htmlrc')) return;
      rebuild();
    });
  }
};

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
