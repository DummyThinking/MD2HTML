import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convert } from '../src/convert.mjs';

const identityLink = (key, href) => href;
const identityImage = async (key, src) => src;
const hooks = { resolveLink: identityLink, resolveImage: identityImage };

test('derives the title from the first h1 heading', async () => {
  const page = await convert('# Hello World\n\nBody text.', 'index', hooks);
  assert.equal(page.title, 'Hello World');
});

test('falls back to the page key when there is no h1', async () => {
  const page = await convert('Just a paragraph.', 'guides/setup', hooks);
  assert.equal(page.title, 'setup');
});

test('builds a table of contents from h1-h3 headings', async () => {
  const md = '# Title\n\n## Section One\n\n### Sub\n';
  const page = await convert(md, 'index', hooks);
  assert.deepEqual(page.toc.map((h) => h.text), ['Title', 'Section One', 'Sub']);
});

test('detects a mermaid code block', async () => {
  const md = '# Title\n\n```mermaid\ngraph LR\nA --> B\n```\n';
  const page = await convert(md, 'index', hooks);
  assert.equal(page.usesMermaid, true);
});

test('does not flag pages without a mermaid block', async () => {
  const page = await convert('# Title\n\n```js\nconst x = 1;\n```\n', 'index', hooks);
  assert.equal(page.usesMermaid, false);
});

test('renders a GitHub-style NOTE callout', async () => {
  const page = await convert('> [!NOTE]\n> Useful info.', 'index', hooks);
  assert.match(page.body, /callout-note/);
  assert.match(page.body, /Useful info\./);
});
