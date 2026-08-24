import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createResolver } from '../src/links.mjs';

test('resolves a relative markdown link to a hash route', () => {
  const resolve = createResolver(new Set(['guides/setup', 'index']));
  assert.equal(resolve('index', 'guides/setup.md'), '#/guides/setup');
});

test('resolves a fragment-only link against the current page', () => {
  const resolve = createResolver(new Set(['index']));
  assert.equal(resolve('index', '#usage'), '#/index~usage');
});

test('resolves a link with both a path and a fragment', () => {
  const resolve = createResolver(new Set(['guides/setup']));
  assert.equal(resolve('index', 'guides/setup.md#install'), '#/guides/setup~install');
});

test('passes external URLs through unchanged', () => {
  const resolve = createResolver(new Set());
  assert.equal(resolve('index', 'https://example.com'), 'https://example.com');
  assert.equal(resolve('index', 'mailto:a@b.com'), 'mailto:a@b.com');
});

test('records an unresolvable link as broken and returns the href unchanged', () => {
  const resolve = createResolver(new Set(['index']));
  const result = resolve('index', 'missing.md');
  assert.equal(result, 'missing.md');
  assert.deepEqual(resolve.broken, [{ from: 'index', href: 'missing.md' }]);
});
