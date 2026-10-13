# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.1.0] - 2026-10-09

### Added

- `--start-page <page>` option / `startPage` config key to choose the page shown first
- `[[wikilink]]` resolution (`[[page]]`, `[[dir/page]]`, `[[page#Heading]]`, `[[page|alias]]`) with nearest-match disambiguation and broken-link warnings
- `--asset-root <dir>` option (repeatable) / `assetRoots` config key to embed images from folders outside the source directory
- `--include-linked` option / `includeLinked` config key to bundle `.md` files outside the source directory that pages link to (followed transitively, listed under `_external/`, watched in `--watch` mode)
- A warning for a link to an existing file outside the source directory now suggests `--include-linked`

### Changed

- `--favicon` on the command line is now resolved against the current directory instead of the source directory; the `favicon` config key is still relative to the source directory
- The image "escapes root" check now compares resolved paths, so `../<source-dir>/pic.png` (a path that leaves and re-enters the source directory) and backslash paths are handled correctly
- The default start page now prefers an `index`/`readme` page in the root folder; previously the first one discovered won, which was often inside a subfolder. If there is no root one, the first `index`/`readme` found is used, then the first page

## [1.0.0] - 2026-08-24

Initial open-source release.

### Added

- Core pipeline converting a directory of Markdown files into a single, self-contained HTML site (`discover` → `bundle` → `convert` → `template`)
- `md2html` CLI with `--name`, `--favicon`, `--watch`/`-w`, `--disable-table-print`, and `--help`/`-h`
- Mermaid diagram rendering with an interactive fullscreen view (pan, zoom, theme sync)
- Syntax highlighting via `highlight.js`, including automatic language detection for unlabeled code blocks, line numbers, and a copy button
- Code block filename annotations (`` ```js title="server.js" ``)
- GitHub-style callouts (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`)
- Structured renderers for `package.json`/`composer.json` blocks, and table previews for flat JSON/YAML data
- Sidebar navigation tree, per-page scroll-spy table of contents, and prev/next footer navigation
- Light/dark theme toggle with persisted `localStorage` preference
- Image embedding as data URIs, with a fullscreen viewer for images and diagrams
- `.md2htmlrc` / `md2html.json` project config (JSON or YAML), plus per-page YAML frontmatter (`title`, `draft`)
- `.gitignore`-aware file discovery, with support for custom ignore patterns
- Colored build output: progress counter, image/Mermaid summaries, and broken-link warnings
- Print stylesheet for clean, sidebar-free output

### Changed

- Renamed the CLI and package from `md2site` to `md2html` ahead of the open-source release
- Renamed the internal `EXTERNAL` constant to `URL_SCHEMA_REGEX` for clarity

### Fixed

- Theme toggle icon centering
- Frontmatter parsing now warns on invalid YAML instead of failing silently
