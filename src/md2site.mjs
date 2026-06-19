#!/usr/bin/env node
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import process from 'node:process';
import { bundle } from './bundle.mjs';
import { renderSite } from './template.mjs';

const parseArgs = (argv) => {
  const positional = [];
  let name = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--name') name = argv[++i];
    else if (arg.startsWith('--name=')) name = arg.slice(7);
    else positional.push(arg);
  }
  return { src: positional[0], out: positional[1], name };
};

const main = async () => {
  const { src, out, name } = parseArgs(process.argv.slice(2));
  if (!src) {
    process.stderr.write('usage: md2site <directory> [output.html] [--name "Site Name"]\n');
    process.exit(1);
  }
  try {
    const site = await bundle(resolve(src));
    if (name) site.siteTitle = name;
    const target = out ?? 'site.html';
    await writeFile(target, renderSite(site), 'utf8');
    process.stdout.write(`${target} (${Object.keys(site.pages).length} pages)\n`);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }
};

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
