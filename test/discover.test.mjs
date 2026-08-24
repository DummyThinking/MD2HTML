import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discover } from '../src/discover.mjs';

const makeFixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'md2html-discover-'));
  await writeFile(join(root, 'index.md'), '# Home\n');
  await mkdir(join(root, 'guides'));
  await writeFile(join(root, 'guides', 'setup.md'), '# Setup\n');
  await mkdir(join(root, 'node_modules'));
  await writeFile(join(root, 'node_modules', 'skip.md'), '# skip\n');
  await writeFile(join(root, 'draft.md'), '---\ndraft: true\n---\n# Draft\n');
  return root;
};

test('discovers markdown files recursively, skipping node_modules', async () => {
  const root = await makeFixture();
  try {
    const pages = await discover(root);
    const keys = pages.map((p) => p.key).sort();
    assert.deepEqual(keys, ['draft', 'guides/setup', 'index']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('parses frontmatter into page meta', async () => {
  const root = await makeFixture();
  try {
    const pages = await discover(root);
    const draft = pages.find((p) => p.key === 'draft');
    assert.equal(draft.meta.draft, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('respects custom ignore patterns', async () => {
  const root = await makeFixture();
  try {
    const pages = await discover(root, { ignore: ['guides/**'] });
    assert.ok(!pages.some((p) => p.key === 'guides/setup'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
