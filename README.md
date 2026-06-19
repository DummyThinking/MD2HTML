# Md2Site

Convert a directory of Markdown files into a single-file HTML documentation site.

## Features

- 📦 **Single-file output**: Bundles all pages, images, and diagrams into one HTML file for easy sharing.
- 🎨 **Modern UI**: Clean, responsive design with light and dark mode support.
- 🧜 **Mermaid support**: Renders Mermaid diagrams directly in the browser (uses `mermaid` library).
- 🌈 **Syntax Highlighting**: Built-in support for popular programming languages via `highlight.js`.
- 📑 **Auto-generated Navigation**: Sidebar page tree and per-page Table of Contents.
- 🔗 **Smart Links**: Automatically resolves links between Markdown files.
- 📋 **Copy to Clipboard**: One-click code snippet copying for pre-formatted blocks.
- 🌓 **Dark Mode**: Toggle between light and dark themes with persistent preference.
- ⚡ **SPA**: Fast, client-side navigation between pages.

## Installation

Ensure you have [Node.js](https://nodejs.org/) (v18+) installed, then install the dependencies:

```bash
pnpm install
```

## Usage

Run the tool using `node`:

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

## How it works

1.  **Discovery**: Scans the source directory recursively for all `.md` files.
2.  **Conversion**: Uses `marked` to convert Markdown to HTML.
3.  **Assets**: Locally referenced images are automatically embedded as Base64/SVG data URIs.
4.  **Diagrams**: If Mermaid code blocks are found, the `mermaid` library is bundled into the output.
5.  **Bundling**: All content, styles, and scripts are injected into a single HTML template.
6.  **Navigation**: The generated file is a Single-Page Application that handles navigation via URL hashes (e.g., `#/path/to/page~heading-id`).

## Requirements

- Node.js (v18+)
- Dependencies: `marked`, `highlight.js`, `mermaid`.

## License

Private
