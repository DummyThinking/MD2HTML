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

## Branches

- `master` — always releasable. Only `dev/<MAJOR.MINOR>` branches merge into it (regular, non-squash merge, tagged on merge).
- `dev/<MAJOR.MINOR>` — one per minor version, cut from `master`. The commit that cuts it bumps `MAJOR`/`MINOR` by hand (e.g. `dev/1.1` begins at `1.1.0`). Kept after merging so it can be reopened for hotfixes.
- `feat/*`, `chore/*`, `fix/*`, etc. — branch off the active `dev/*` branch, merge back into it. Never branch off `master` directly.
- Hotfixing an already-shipped version: reopen that version's `dev/*` from its tag, branch off *that*, and forward-port the fix into the currently active `dev/*` afterward.

Full policy, including merge and tagging rules: see [`docs/architecture/branching-and-versioning.md`](docs/architecture/branching-and-versioning.md).

## Versioning

The version lives in `package.json` as `MAJOR.MINOR.PATCH`. `MAJOR`/`MINOR` are bumped by hand, once, in the commit that starts a new `dev/*` branch. `PATCH` is bumped automatically by the `.githooks/pre-commit` hook on every non-doc commit on `feat/*`/`chore/*`/`fix/*` branches. Enable it once per clone:

```bash
git config core.hooksPath .githooks
```

Never bump `PATCH` by hand while the hook is enabled. Doc-only changes (`docs/`, `*.md`, `.claude/`) don't bump anything.

## Changelog

Update `CHANGELOG.md` ([Keep a Changelog](https://keepachangelog.com/) format) as the last commit on a branch before its PR is done — and again if the branch picks up more commits after the PR is already open.

## Reporting bugs / requesting features

Use the issue templates — they ask for the minimum needed to reproduce (source Markdown, command run, expected vs. actual output).

## Code style

- Plain, modern JS (ESM, `async`/`await`), no build/transpile step.
- No comments explaining *what* code does — only *why*, when it's non-obvious.
- Prefer small, focused functions over configurable abstractions built for hypothetical future needs.

## License

By contributing, you agree your contributions are licensed under this project's [MIT License](LICENSE).
