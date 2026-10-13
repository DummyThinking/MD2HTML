import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { bundle } from '../src/bundle.mjs';
import { createImageEmbedder } from '../src/assets.mjs';
import { createResolver } from '../src/links.mjs';

const run = promisify(execFile);
const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'md2html.mjs');

// base/
//   docs/index.md            -> ../ext/outside.md
//   ext/outside.md           -> ../docs/index.md, next.md#sec, img/p.png
//   ext/next.md              -> outside.md (cycle)
//   ext/img/p.png, shared/logo.png, secret.png
const withTree = async (fn) => {
  const base = await mkdtemp(join(tmpdir(), 'md2html-outside-'));
  try {
    await mkdir(join(base, 'docs'));
    await mkdir(join(base, 'shared'));
    await mkdir(join(base, 'ext', 'img'), { recursive: true });
    await writeFile(join(base, 'docs', 'index.md'), '# Home\n\n[out](../ext/outside.md)\n');
    await writeFile(join(base, 'ext', 'outside.md'),
      '# Outside\n\n[home](../docs/index.md)\n\n[next](next.md#sec)\n\n![p](img/p.png)\n');
    await writeFile(join(base, 'ext', 'next.md'), '# Next\n\n## Sec\n\n[back](outside.md)\n');
    await writeFile(join(base, 'ext', 'img', 'p.png'), Buffer.from([1, 2, 3]));
    await writeFile(join(base, 'shared', 'logo.png'), Buffer.from([4, 5, 6]));
    await writeFile(join(base, 'secret.png'), Buffer.from([7, 8, 9]));
    await fn(join(base, 'docs'), base);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
};

// --- links -----------------------------------------------------------------

test('links: a target outside the known pages is delegated and routed', () => {
  const calls = [];
  const resolve = createResolver(new Set(['index']), {
    external: (target) => { calls.push(target); return { key: '_external/other' }; },
  });
  assert.equal(resolve('index', '../other.md#top'), '#/_external/other~top');
  assert.deepEqual(calls, ['../other.md']);
});

test('links: a blocked target is reported as broken with the outside flag', () => {
  const resolve = createResolver(new Set(['index']), { external: () => ({ blocked: true }) });
  assert.equal(resolve('index', '../other.md'), '../other.md');
  assert.deepEqual(resolve.broken, [{ from: 'index', href: '../other.md', outside: true }]);
});

test('links: an outside page resolves relative links against its real folder', () => {
  const calls = [];
  const resolve = createResolver(new Set(['index', '_external/outside']), {
    virtualPaths: new Map([['_external/outside', '../ext/outside']]),
    external: (target) => { calls.push(target); return { key: '_external/ext/next' }; },
  });
  assert.equal(resolve('_external/outside', 'next.md'), '#/_external/ext/next');
  assert.deepEqual(calls, ['../ext/next.md']);
});

// --- images ----------------------------------------------------------------

test('images: an image outside the root embeds only from an asset root', async () => {
  await withTree(async (root, base) => {
    const embed = createImageEmbedder(root, undefined, { assetRoots: [join(base, 'shared')] });
    assert.match(await embed('index', '../shared/logo.png'), /^data:image\/png;base64,/);
    assert.equal(await embed('index', '../secret.png'), '../secret.png');
  });
});

test('images: ../ that leads back into the root is allowed', async () => {
  await withTree(async (root) => {
    await writeFile(join(root, 'pic.png'), Buffer.from([1]));
    assert.match(await createImageEmbedder(root)('index', '../docs/pic.png'), /^data:image\/png;base64,/);
  });
});

test('images: a page pulled in from outside may embed from its own folder only', async () => {
  await withTree(async (root) => {
    const embed = createImageEmbedder(root, undefined, {
      virtualPaths: new Map([['_external/page', '../ext/page']]),
    });
    assert.match(await embed('_external/page', 'img/p.png'), /^data:image\/png;base64,/);
    assert.equal(await embed('_external/page', '../secret.png'), '../secret.png');
  });
});

// --- bundle ----------------------------------------------------------------

test('bundle: without includeLinked a link to a file outside the root stays broken', async () => {
  await withTree(async (root) => {
    const site = await bundle(root);
    assert.deepEqual(Object.keys(site.pages), ['index']);
    assert.deepEqual(site.linkedPages, []);
    assert.match(site.pages.index.body, /href="\.\.\/ext\/outside\.md"/);
  });
});

test('bundle: includeLinked follows outside pages transitively and links them up', async () => {
  await withTree(async (root, base) => {
    const site = await bundle(root, { includeLinked: true });
    assert.deepEqual(Object.keys(site.pages).sort(), ['_external/ext/next', '_external/ext/outside', 'index']);
    assert.equal(site.indexKey, 'index');
    assert.deepEqual(site.linkedPages.map((p) => p.key).sort(), ['_external/ext/next', '_external/ext/outside']);
    assert.ok(site.linkedPages.every((p) => p.file.startsWith(base)));
    assert.match(site.pages.index.body, /href="#\/_external\/ext\/outside"/);
    const outside = site.pages['_external/ext/outside'].body;
    assert.match(outside, /href="#\/index"/);                      // back into the root
    assert.match(outside, /href="#\/_external\/ext\/next~sec"/);   // sibling + fragment
    assert.match(outside, /src="data:image\/png;base64,/);         // image next to the outside page
    assert.match(site.pages['_external/ext/next'].body, /href="#\/_external\/ext\/outside"/);  // cycle ends
  });
});

test('bundle: includeLinked skips an outside page marked as draft', async () => {
  await withTree(async (root, base) => {
    await writeFile(join(base, 'ext', 'outside.md'), '---\ndraft: true\n---\n# Outside\n');
    const site = await bundle(root, { includeLinked: true });
    assert.deepEqual(Object.keys(site.pages), ['index']);
  });
});

test('bundle: outside pages never become the start page or the title source', async () => {
  await withTree(async (root, base) => {
    await writeFile(join(base, 'ext', 'readme.md'), '# Ext readme\n');
    await writeFile(join(base, 'docs', 'zeta.md'), '# Zeta\n\n[r](../ext/readme.md)\n');
    await rm(join(base, 'docs', 'index.md'));
    const site = await bundle(root, { includeLinked: true });
    assert.equal(site.indexKey, 'zeta');
    assert.equal(site.siteTitle, 'Zeta');
  });
});

test('bundle: two outside files with the same name get distinct keys', async () => {
  await withTree(async (root, base) => {
    await mkdir(join(base, 'ext', 'a'));
    await mkdir(join(base, 'ext2'));
    await writeFile(join(base, 'ext', 'a.md'), '# A1\n');
    await writeFile(join(base, 'ext2', 'a.md'), '# A2\n');
    await writeFile(join(root, 'index.md'), '[1](../ext/a.md) [2](../ext2/a.md)\n');
    const site = await bundle(root, { includeLinked: true });
    assert.deepEqual(Object.keys(site.pages).sort(), ['_external/ext/a', '_external/ext2/a', 'index']);
  });
});

// --- CLI -------------------------------------------------------------------

test('cli: --include-linked and --asset-root work from another working directory', async () => {
  await withTree(async (root, base) => {
    await writeFile(join(root, 'index.md'),
      '# Home\n\n[out](../ext/outside.md)\n\n![l](../shared/logo.png)\n');
    const cwd = join(base, 'ext');   // run from a sibling folder, source given as ../docs
    const out = join(base, 'out.html');
    await run(process.execPath, [CLI, '../docs', out, '--include-linked', '--asset-root', '../shared'], { cwd });
    const html = await readFile(out, 'utf8');
    assert.match(html, /_external\/ext\/outside/);
    assert.match(html, /data:image\/png;base64,BAUG/);   // shared/logo.png = 04 05 06
  });
});

test('cli: --favicon is resolved against the working directory', async () => {
  await withTree(async (root, base) => {
    await writeFile(join(base, 'ext', 'fav.png'), Buffer.from([1, 2, 3]));
    const out = join(base, 'out.html');
    const { stderr } = await run(process.execPath, [CLI, '../docs', out, '--favicon', 'fav.png'], { cwd: join(base, 'ext') });
    assert.doesNotMatch(stderr, /could not embed/);
    assert.match(await readFile(out, 'utf8'), /data:image\/png;base64,AQID/);
  });
});

test('cli: the favicon from the config file stays relative to the source directory', async () => {
  await withTree(async (root, base) => {
    await writeFile(join(root, 'fav.png'), Buffer.from([1, 2, 3]));
    await writeFile(join(root, 'md2html.json'), JSON.stringify({ favicon: 'fav.png' }));
    const out = join(base, 'out.html');
    await run(process.execPath, [CLI, root, out], { cwd: join(base, 'ext') });
    assert.match(await readFile(out, 'utf8'), /data:image\/png;base64,AQID/);
  });
});
