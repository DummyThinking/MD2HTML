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

test('wiki: resolves a bare name to a page anywhere in the tree, case-insensitively', () => {
  const resolve = createResolver(new Set(['index', 'guides/Setup']));
  assert.deepEqual(resolve.wiki('index', 'setup'), { href: '#/guides/Setup', label: 'setup' });
});

test('wiki: supports heading fragments and aliases', () => {
  const resolve = createResolver(new Set(['guides/setup']));
  assert.deepEqual(resolve.wiki('index', 'setup#Install Steps|the guide'),
    { href: '#/guides/setup~install-steps', label: 'the guide' });
  assert.equal(resolve.wiki('index', 'setup#Install').label, 'setup > Install');
});

test('wiki: heading-only link targets the current page', () => {
  const resolve = createResolver(new Set(['guides/setup']));
  assert.equal(resolve.wiki('guides/setup', '#Usage').href, '#/guides/setup~usage');
});

test('wiki: prefers the nearest page when names are ambiguous', () => {
  const resolve = createResolver(new Set(['a/intro', 'b/intro', 'b/c/intro']));
  assert.equal(resolve.wiki('b/x', 'intro').href, '#/b/intro');
  assert.equal(resolve.wiki('a/x', 'b/intro').href, '#/b/intro');
});

test('wiki: records an unresolvable link as broken', () => {
  const resolve = createResolver(new Set(['index']));
  assert.equal(resolve.wiki('index', 'nope').href, null);
  assert.deepEqual(resolve.broken, [{ from: 'index', href: '[[nope]]' }]);
});
