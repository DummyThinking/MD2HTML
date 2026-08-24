import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Buffer } from 'node:buffer';
import { createImageEmbedder } from '../src/assets.mjs';

test('embeds a local image as a base64 data URI', async () => {
  const root = await mkdtemp(join(tmpdir(), 'md2html-assets-'));
  try {
    await writeFile(join(root, 'logo.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const embed = createImageEmbedder(root);
    const uri = await embed('index', 'logo.png');
    assert.match(uri, /^data:image\/png;base64,/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('passes external URLs through unchanged', async () => {
  const embed = createImageEmbedder('/does/not/matter');
  const uri = await embed('index', 'https://example.com/logo.png');
  assert.equal(uri, 'https://example.com/logo.png');
});

test('rejects an image path that escapes the root directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'md2html-assets-'));
  try {
    const embed = createImageEmbedder(root);
    const src = '../../etc/passwd.png';
    const result = await embed('index', src);
    assert.equal(result, src);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('calls onEmbed with the page, src, and raw byte size', async () => {
  const root = await mkdtemp(join(tmpdir(), 'md2html-assets-'));
  try {
    const data = Buffer.from('hello-world-image-bytes');
    await writeFile(join(root, 'pic.jpg'), data);
    const calls = [];
    const embed = createImageEmbedder(root, (page, src, size) => calls.push({ page, src, size }));
    await embed('index', 'pic.jpg');
    assert.deepEqual(calls, [{ page: 'index', src: 'pic.jpg', size: data.length }]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
