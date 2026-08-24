import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTree } from '../src/tree.mjs';

test('groups pages by directory, with directories sorted before files', () => {
  const pages = [
    { key: 'index', title: 'Home' },
    { key: 'guides/setup', title: 'Setup' },
    { key: 'about', title: 'About' },
  ];
  const tree = buildTree(pages);

  assert.equal(tree[0].name, 'guides');
  assert.equal(tree[0].dir, true);
  assert.equal(tree[0].children[0].key, 'guides/setup');

  assert.deepEqual(tree.slice(1).map((n) => n.name), ['About', 'Home']);
});

test('nests multiple levels of directories', () => {
  const pages = [{ key: 'a/b/c', title: 'Deep' }];
  const tree = buildTree(pages);
  assert.equal(tree[0].name, 'a');
  assert.equal(tree[0].children[0].name, 'b');
  assert.equal(tree[0].children[0].children[0].key, 'a/b/c');
});
