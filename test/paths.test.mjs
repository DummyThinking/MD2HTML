import { test } from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import { resolve, join } from 'node:path';
import { isInside } from '../src/paths.mjs';

test('isInside accepts the base itself and anything below it', () => {
  const base = resolve('/work/docs');
  assert.equal(isInside(base, base), true);
  assert.equal(isInside(base, join(base, 'a', 'b.png')), true);
});

test('isInside rejects siblings, parents and look-alike prefixes', () => {
  const base = resolve('/work/docs');
  assert.equal(isInside(base, resolve('/work')), false);
  assert.equal(isInside(base, resolve('/work/docs2/a.png')), false);
  assert.equal(isInside(base, resolve('/work/other/a.png')), false);
});

test('isInside accepts a folder whose name merely starts with two dots', () => {
  const base = resolve('/work/docs');
  assert.equal(isInside(base, join(base, '..assets', 'a.png')), true);
});

test('isInside treats a different drive as outside', { skip: process.platform !== 'win32' }, () => {
  assert.equal(isInside('C:\\work\\docs', 'D:\\work\\docs\\a.png'), false);
});

test('isInside is case-insensitive on Windows', { skip: process.platform !== 'win32' }, () => {
  assert.equal(isInside('C:\\Work\\Docs', 'c:\\work\\docs\\a.png'), true);
});
