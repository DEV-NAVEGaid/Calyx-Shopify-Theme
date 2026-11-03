# Calyx Theme Agent Guide

Calyx is a Shopify theme built on the section + theme-block architecture.
Merchants compose pages in the theme editor from sections, nested theme
blocks, and presets. This file
lists the repository conventions that aren't obvious from an individual file.
The code is the source of truth.

## Non-negotiables when editing this theme

- **JSON templates:** every page type except `gift_card.liquid` is a
  `templates/*.json` file that lists sections. Never put page markup in a
  Liquid template.
- **Section groups:** the header and footer live in
  `sections/header-group.json` and `sections/footer-group.json`, rendered by
  `{% sections %}` in `layout/theme.liquid`.
- **No Liquid-embedded assets:** no `{% stylesheet %}`, no `{% javascript %}`.
  All CSS and JavaScript live in `assets/`. Scripts load as `type="module"`.
- **Whitespace matters:** include whitespace between an HTML tag name and a
  following Liquid delimiter (`<li {% ... %}`, not `<li{% ... %}`).
- **Translated UI only:** every storefront string uses a literal
  `{{ 'key' | t }}` call; every schema label uses a `t:` key from
  `locales/en.default.schema.json`.
- **Shopify routes for storefront URLs:** use Liquid `routes.*` for every
  storefront path; never hardcode `/cart`, `/search`, or `/collections`.
- **Theme Check stays pristine:** `.theme-check.yml` is
  `extends: theme-check:recommended` with zero overrides. Fix offenses in the
  code instead of adding exceptions.

## Page structure

```
layout/theme.liquid → {% sections 'header-group' %} + <main> content_for_layout + {% sections 'footer-group' %}
templates/*.json    → sections → theme blocks (static or merchant-added) → snippets
```

## Sections

- `sections/section.liquid` is the generic, reusable section. It accepts
  `@theme` and `@app` blocks and ships its presets (Rich text, Image with
  text, Multicolumn, FAQ, Email signup, …). Prefer adding a preset to it over
  creating a new section.
- Page sections (`product-information`, `main-collection`, `main-cart`, …)
  render the fixed parts of a page as **static blocks** with
  `{% content_for 'block', type: '…', id: '…' %}` and the merchant's extra
  blocks with `{% content_for 'blocks' %}`. They have no presets; their
  JSON template provides the default configuration.
- The generic `section` uses `"disabled_on": { "groups": ["header"] }`; page
  sections disable both groups; header/footer sections use `"enabled_on"`
  for their group.
- Wrap section markup with `{% render 'section', section: section, children: children %}`
  when the section uses the shared Layout / Size / Appearance / Borders /
  Padding settings.
- Header group: `header-announcements` (rotating `_announcement` blocks) and
  `header` (static `_header-menu` and `_header-logo`, plus `_mega-menu-promo`
  blocks that `assets/header.js` moves into the mega menu they name). The
  menu itself comes from a Shopify menu: sub-items with their own links make
  a mega menu.
- Footer group: one `footer` section — menu columns as blocks, then the
  newsletter, wordmark, and bottom bar driven by a few section settings.
  Header and footer styles live in `assets/header.css` and
  `assets/footer.css`.
- Homepage: one section per design band (`hero-slideshow`, `marquee`,
  `brand-story`, … `usp-strip`), each with its own `_private` blocks and
  only Top / Bottom padding ranges. Their shared styles live in
  `assets/sections.css`; `templates/index.json` lists them in design order.
  Content pages follow the same pattern (`templates/page.about.json`:
  `page-hero`, `image-with-text`, `value-cards`, `ritual-steps`,
  `quote-banner`, `stats-cards`, `logo-list`, `cta-band`; `page.policy.json`:
  `main-policy`). `product.gift-card.json` reuses `product-information` with
  the gift card gallery layout and the `gift-card-recipient` block.
- Every design section has a **Section** group (`layout_width`: normal /
  wide, plus `image_ratio` when it shows images) and Top / Bottom / Left /
  Right padding. `snippets/spacing-style.liquid` turns them into
  `--section-*` properties that `assets/sections.css` reads; new sections
  should follow suit. A **Font sizes** group before it (`custom_font_sizes`
  plus heading / subheading / text / eyebrow ranges) comes out as `--type-*`
  properties that override the section's own type scale by role: `h1`/`h2`,
  `h3`–`h6`, paragraphs, and `.eyebrow` / `*__eyebrow`.
- An eyebrow sits 12px above the heading after it on every section (a rule
  at the end of `assets/sections.css`). A container that spaces its children
  with `gap` must also set `--eyebrow-gap` to that gap, in the same rule and
  media query, so the eyebrow can cancel it.
- A section's copy (eyebrow, heading, text, buttons) is made of the private
  `_section-eyebrow`, `_section-heading`, `_section-text`, and
  `_section-button` blocks inside a `.section-copy` container, rather than
  section settings, so merchants can add, remove, and reorder it.
- Keep section and block settings few: prefer a checkbox per optional part
  over styling controls, and reuse Theme settings (colors, social media,
  swatches) instead of repeating them.

## Blocks

- **Public blocks** (`blocks/text.liquid`) appear in the block picker and
  ship `presets` with a `category`.
- **Private blocks** (`blocks/_name.liquid`) never appear in the picker. A
  parent references them explicitly in its `blocks` array or renders them as
  static blocks.
- Blocks that render inside a resource loop read the resource from
  `closest.product`, `closest.collection`, or `closest.article`. Callers pass
  it with `{% content_for 'block', …, closest.product: product %}`.
- Every block starts with a `{% doc %}` header, keeps
  `{{ block.shopify_attributes }}` on its root element, and declares
  `"tag": null` when it renders its own wrapper element.
- A section can't read its theme blocks' settings through `section.blocks`
  (they come back blank). When a section needs something from its blocks
  (the FAQ topic list), read it from the rendered blocks in JavaScript.
- Container blocks (`group`, `_product-details`, …) declare
  `"blocks": [{ "type": "@theme" }, { "type": "@app" }]` and render
  `{% content_for 'blocks' %}`.

## Schema conventions

Group settings with `header` entries in this order, using the same ids
everywhere:

| Group | Setting ids |
| --- | --- |
| Layout | `content_direction`, `vertical_on_mobile`, `horizontal_alignment`, `vertical_alignment`, `gap` |
| Size | `width`, `custom_width`, `section_width`, `section_height`, `section_height_custom` |
| Typography | `type_preset`, `font`, `font_size`, `line_height`, `letter_spacing`, `case` |
| Appearance | `background_media`, `background_color`, `background_image`, `video`, `text_color`, `toggle_overlay`, `overlay_color`, `overlay_style` |
| Borders | `border`, `border_width`, `border_opacity`, `border_radius` |
| Padding | `padding-block-start`, `padding-block-end`, `padding-inline-start`, `padding-inline-end` |

- Hide settings that don't apply with `visible_if`, for example
  `"visible_if": "{{ block.settings.content_direction == 'row' }}"`.
- Turn settings into inline CSS custom properties with the style snippets
  (`spacing-style`, `gap-style`, `size-style`, `layout-panel-style`,
  `border-override`, `typography-style`). Keep the rules themselves in
  `assets/*.css`.
- Schema translation keys follow the namespaces in
  `locales/en.default.schema.json`: `names`, `settings`, `options`, `content`,
  `info`, `categories`, `html_defaults`.

## Global settings

`config/settings_schema.json` groups: logo and favicon, colors
(`color_palette`), typography, page layout, animations, buttons, input
fields, badges, cart, drawers, popovers and modals, product cards, swatches,
search, prices, social media. Component colors default to palette roles
(`"default": "{{ settings.color_palette.foreground }}"`), so the theme styles
in `config/settings_data.json` (Aurora, Clay, Noir) mostly set the palette,
fonts, and corner radii. Format prices with `snippets/format-money.liquid`,
not `| money`, so they follow the currency format setting.
`snippets/color-palette.liquid` and `snippets/theme-styles-variables.liquid`
turn them into CSS custom properties on `:root`.

## Theme map

```
sections/   header-group.json, footer-group.json, generic + page sections
blocks/     public theme blocks and _private blocks
templates/  *.json page templates (gift_card.liquid is the only Liquid template)
layout/     theme.liquid, password.liquid
snippets/   CSS-variable, style, and markup utilities
assets/     CSS, JavaScript modules, icons
```
