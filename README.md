# Clean editable product template

This package was generated from the uploaded live-site HTML export `index.html`.

## Files

- `index.html` — cleaned editable page structure.
- `index-variant-b.html` — alternative landing design variant for visual comparison.
- `css/styles.css` — base template CSS + original section CSS extracted from the source page.
- `css/styles-variant-b.css` — visual override theme used by `index-variant-b.html`.
- `js/template.js` — clean custom logic for gallery, navigation, FAQ, tabs, videos and before/after sliders.
- `js/original-section-logic.js` — non-tracking original section UI scripts extracted from the source, wrapped safely.
- `asset-map.json` — reference map of original source URLs to the mirrored/localized assets.

## What was removed

The clean version removes the heavy live-site boilerplate:
- Shopify checkout/runtime scripts
- Google Tag Manager / GA / Ads
- Microsoft Clarity
- Sentry
- consent manager
- GeoPro / Blockify / fraud-filter app code
- most third-party app bootstrap scripts
- live cart form submission behavior

## What was kept

- Main product layout logic
- Product navigation
- Product sections
- Original visual classes and section styles
- Responsive structure
- Videos, images and comparison/FAQ/tab behavior
- Localized media/script paths, so the page can render without requests to the original site

## How to edit

1. Open `index.html`.
2. Search for `EDIT:` comments.
3. Replace:
   - `YOUR BRAND`
   - hero title
   - price
   - benefit list
   - CTA text/links
   - image/video URLs if you want to move assets away from the current local mirror
4. Open `css/styles.css` to change colors in `:root`.
5. Forms are intentionally disabled to avoid sending users to the source live store. Reconnect them only after adapting the template to your own store/backend.

## Notes

The runtime page no longer depends on remote media/fonts/scripts from the original source. `asset-map.json` is kept only as provenance/reference and is not loaded by the page.
