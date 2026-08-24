# Contributing to Md2Html

Thanks for considering a contribution. This project is a small, dependency-light CLI, so the bar for changes is: does it help the core use case (turn a folder of Markdown into one clean HTML file) without adding runtime dependencies to the generated output?

## Getting set up

```bash
git clone https://github.com/DummyThinking/MD2HTML.git
cd MD2HTML
pnpm install   # or: npm install
```

Run the tool directly against a folder of Markdown while developing:

```bash
node src/md2html.mjs ./examples/docs out.html
```

There's no build step — `src/*.mjs` are plain ES modules run directly by Node (v20+ required, since `--watch` relies on recursive `fs.watch`).

Run the test suite (Node's built-in test runner, no extra dependency):

```bash
pnpm test   # or: node --test
```

## Making a change

1. Open an issue first for anything beyond a small fix, so we can agree on the approach before you spend time on it.
2. Keep the output a **single, self-contained HTML file** — no new runtime dependencies, no external CDN calls from the generated site. Build-time dependencies (in `package.json`) are fine if they're justified.
3. Match the existing module boundaries described in `CLAUDE.md` (`discover` → `bundle` → `convert` → `template`, with `assets`/`links`/`tree` as helpers). Don't fold unrelated concerns into one file.
4. Test your change manually against a real Markdown folder (see `examples/docs`) and check the generated HTML in a browser — light and dark theme, with and without Mermaid diagrams.
5. Keep commits focused; write commit messages that explain *why*, not just *what*.

## Reporting bugs / requesting features

Use the issue templates — they ask for the minimum needed to reproduce (source Markdown, command run, expected vs. actual output).

## Code style

- Plain, modern JS (ESM, `async`/`await`), no build/transpile step.
- No comments explaining *what* code does — only *why*, when it's non-obvious.
- Prefer small, focused functions over configurable abstractions built for hypothetical future needs.

## License

By contributing, you agree your contributions are licensed under this project's [MIT License](LICENSE).
