<h1 align="center">Calyx Shopify Theme</h1>

A Shopify theme built on sections and theme blocks. Merchants compose every
page in the theme editor from sections, nested blocks, and presets.

## Getting started

### Prerequisites

Before starting, ensure you have the latest Shopify CLI installed:

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) – helps you download, upload, preview themes, and streamline your workflows

If you use VS Code:

- [Shopify Liquid VS Code Extension](https://shopify.dev/docs/storefronts/themes/tools/shopify-liquid-vscode) – provides syntax highlighting, linting, inline documentation, and auto-completion specifically designed for Liquid templates

### Clone

Clone this repository using Git or Shopify CLI:

```bash
git clone git@github.com:Shopify/skeleton-theme.git
# or
shopify theme init
```

### Preview

Preview this theme using Shopify CLI:

```bash
shopify theme dev
```

## Theme architecture

```bash
.
├── assets          # CSS, JavaScript modules, and icons
├── blocks          # Theme blocks (public) and _private blocks
├── config          # Global theme settings (settings_schema.json)
├── layout          # theme.liquid and password.liquid
├── locales         # Storefront and schema translations
├── sections        # Sections and the header/footer section groups
├── snippets        # Style, CSS-variable, and markup utilities
└── templates       # JSON templates, one per page type
```

```
layout/theme.liquid → header-group + <main>content_for_layout</main> + footer-group
templates/*.json    → sections → theme blocks → snippets
```

### Sections

- `sections/section.liquid` is the generic section. It accepts any theme or
  app block and ships presets such as Rich text, Image with text,
  Multicolumn, FAQ, and Email signup.
- Page sections (`product-information`, `main-collection`, `main-cart`,
  `search-results`, …) render fixed page parts as static blocks and accept
  extra theme blocks.
- `header-group.json` and `footer-group.json` hold the announcement bar,
  header, footer, and footer utilities.

### Blocks

- Public blocks (`text`, `button`, `image`, `group`, `product-title`,
  `price`, …) appear in the editor's block picker with presets.
- Private blocks start with `_` and are only used where a parent section or
  block references them.
- Blocks inside resource loops read `closest.product`,
  `closest.collection`, or `closest.article`.

### Settings

Every section and container block shares the same setting groups and ids:
Layout, Size, Typography, Appearance, Borders, Padding. Style snippets in
`snippets/` turn those settings into CSS custom properties; the rules live
in `assets/`.

Global settings live in `config/settings_schema.json`. Colors start from a
`color_palette`, and component colors (buttons, inputs, badges, drawers)
default to palette roles.

[`AGENTS.md`](./AGENTS.md) is the source of truth for the conventions coding
agents and contributors follow.

## CSS and JavaScript

All CSS and JavaScript live in [`assets/`](./assets/); nothing is embedded
in Liquid with `{% stylesheet %}` or `{% javascript %}`. Interactive
pieces (variant picker, cart quantities, collection filters) are small ES
modules that progressively enhance server-rendered HTML and refresh it with
the Section Rendering API.

## Contributing

Visit our [CONTRIBUTING.md](./CONTRIBUTING.md) for a detailed overview of our process, guidelines, and recommendations.

## License

See [LICENSE.md](./LICENSE.md).
