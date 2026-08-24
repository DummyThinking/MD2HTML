# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
