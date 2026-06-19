# Md2Site

Convert a directory of Markdown files into a single-file HTML documentation site.

## Features

- 📦 **Single-file output**: Bundles all pages, images, and diagrams into one HTML file for easy sharing.
- 🎨 **Modern UI**: Clean, responsive design with light and dark mode support.
- 🧜 **Mermaid support**: Renders Mermaid diagrams with zoom and pan controls.
- 🌈 **Syntax Highlighting**: Built-in support for popular programming languages via `highlight.js`.
- 📊 **Data previews**: JSON and YAML code blocks containing flat arrays or objects are rendered as interactive tables.
- 📦 **Config renderers**: `package.json` and `composer.json` blocks display a structured view with name, version, scripts, and dependency sections.
- 📑 **Auto-generated Navigation**: Sidebar page tree and per-page Table of Contents.
- 🔗 **Smart Links**: Automatically resolves links between Markdown files.
- 📋 **Copy to Clipboard**: One-click code snippet copying for all code blocks.
- 🌓 **Dark Mode**: Toggle between light and dark themes with persistent preference.
- ⚡ **SPA**: Fast, client-side navigation between pages.

## Installation

### Local Development

1. Clone the repository.
2. Ensure you have [Node.js](https://nodejs.org/) (v18+) installed.
3. Install dependencies:

```bash
pnpm install
# or
npm install
```

### Global Installation

You can install the tool globally to use the `md2site` command from anywhere:

```bash
pnpm add -g .
# or
npm install -g .
```

### Direct Usage (npx)

If you've linked the package or it's available in your registry:

```bash
npx md2site <source-directory> [output-file.html]
```

## Usage

### Using the Command

If installed globally:

```bash
md2site <source-directory> [output-file.html] [--name "Site Name"]
```

### Using Node directly

If running from the source directory:

```bash
node src/md2site.mjs <source-directory> [output-file.html] [--name "Site Name"]
```

- `<source-directory>`: The directory containing your `.md` files.
- `[output-file.html]`: (Optional) The name of the output file. Defaults to `site.html`.
- `--name`: (Optional) The title of your site. Defaults to the title of the index page.

### Example

```bash
node src/md2site.mjs ./docs wiki.html --name "Internal Wiki"
```

## Code Block Language Aliases

Beyond standard syntax highlighting, the following language tags trigger special rendering. Each block shows a rendered preview by default with a toggle to view the raw source.

### Data previews

| Language | Triggers table when… |
|---|---|
| `json` | Root is a flat array of objects, or a flat key/value object |
| `yaml` / `yml` | Same structure rules as JSON |

Nested objects or arrays inside values are not supported and fall back to a plain code block.

### Config file renderers

| Language tag | Renders as |
|---|---|
| `package-json` | Node.js `package.json` — name, version, license, description, scripts, dependencies, devDependencies, peerDependencies |
| `composer-json` | PHP `composer.json` — name, description, license, scripts, require, require-dev |

The renderer requires at least a `name` field to be present. If it is missing or the JSON is invalid, the block falls back to standard syntax-highlighted JSON.

### Diagrams

| Language | Behaviour |
|---|---|
| `mermaid` | Rendered in the browser with zoom (+/−/reset) and drag-to-pan controls |

> **Warning:** The Mermaid library is ~3 MB minified. A site with even a single Mermaid diagram will produce an output file that is roughly 3 MB larger than one without. Avoid Mermaid in size-sensitive contexts.

## How it works

1. **Discovery**: Scans the source directory recursively for all `.md` files.
2. **Conversion**: Uses `marked` to convert Markdown to HTML, with custom renderers for code blocks.
3. **Assets**: Locally referenced images are automatically embedded as Base64/SVG data URIs.
4. **Diagrams**: If Mermaid code blocks are found, the `mermaid` library is bundled into the output.
5. **Bundling**: All content, styles, and scripts are injected into a single HTML template.
6. **Navigation**: The generated file is a Single-Page Application that handles navigation via URL hashes (e.g., `#/path/to/page~heading-id`).

## Requirements

- Node.js (v18+)
- Dependencies: `marked`, `highlight.js`, `mermaid`, `js-yaml`.

## License

Private
