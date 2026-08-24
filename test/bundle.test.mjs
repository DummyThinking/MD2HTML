import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { bundle } from '../src/bundle.mjs';

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
