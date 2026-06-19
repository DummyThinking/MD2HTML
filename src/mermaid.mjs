import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const loadMermaidLib = () => readFile(require.resolve('mermaid/dist/mermaid.min.js'), 'utf8');
