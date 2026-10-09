import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { bundle, resolveStartPage, defaultStartPage } from '../src/bundle.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleDocsRoot = join(__dirname, '..', 'examples', 'docs');

test('bundles the example doc set into a Site', async () => {
  const site = await bundle(exampleDocsRoot);
  assert.deepEqual(Object.keys(site.pages).sort(), ['guide', 'index']);
  assert.equal(site.indexKey, 'index');
  assert.equal(site.usesMermaid, true);
  assert.deepEqual(site.mermaidPages, ['guide']);
});

test('throws when the source directory has no markdown files', async () => {
  const empty = await mkdtemp(join(tmpdir(), 'md2html-empty-'));
  try {
    await assert.rejects(() => bundle(empty), /no \.md files found/);
  } finally {
    await rm(empty, { recursive: true, force: true });
  }
});

test('startPage overrides the default index page', async () => {
  const site = await bundle(exampleDocsRoot, { startPage: 'Guide.md' });
  assert.equal(site.indexKey, 'guide');
  assert.equal(site.siteTitle, (await bundle(exampleDocsRoot)).siteTitle);
});

test('an unknown startPage falls back to the default index page', async () => {
  const site = await bundle(exampleDocsRoot, { startPage: 'nope' });
  assert.equal(site.indexKey, 'index');
});

test('resolveStartPage matches exact paths, then a unique trailing path', () => {
  const keys = ['index', 'guides/setup', 'a/intro', 'b/intro'];
  assert.equal(resolveStartPage(keys, './guides/Setup.md'), 'guides/setup');
  assert.equal(resolveStartPage(keys, 'setup'), 'guides/setup');
  assert.equal(resolveStartPage(keys, 'intro'), undefined);
});

test('defaultStartPage prefers a root index/readme over nested ones', () => {
  assert.equal(defaultStartPage(['api/index', 'guides/readme', 'README', 'zzz']), 'README');
  assert.equal(defaultStartPage(['api/intro', 'guides/Readme', 'api/index']), 'guides/Readme');
  assert.equal(defaultStartPage(['b', 'a']), 'b');
});
