# Fieldline · AI and IoT Integrator Landing Page

A single-page marketing site for **Fieldline**, a fictional AI and IoT systems integrator serving cities, factories and utilities. It's built to win quote requests on a phone as well as a desktop.

**Plain HTML, CSS and JavaScript · no framework or build step · deployed as static assets on Cloudflare Workers**

## What's on the page

- **Hero** with an animated system schematic: field sensors → edge gateway → cloud platform → operations dashboard
- **Who we serve:** municipalities, factories and utilities
- **Solutions** and **capabilities**, each tied to a real problem
- **How we work:** a four-step process from site survey to ongoing support
- **Selected work** and **partners**, with clearly marked slots for real projects
- **Quote request form** with client-side validation, posting to Web3Forms
- **WhatsApp and phone contact** buttons that switch on once a number is configured

## Engineering choices

- **No dependencies.** Semantic HTML, modern CSS (custom properties, OKLCH colour, `clamp()` type scale, container queries, logical properties) and under 200 lines of vanilla JavaScript.
- **Accessible by default.** A skip link, a native `<dialog>` for the mobile menu with focus handling, labelled form fields with inline errors, `prefers-reduced-motion` support, and WCAG AA contrast checked by `scripts/contrast.mjs`.
- **Fast on mobile data.** Self-hosted, responsive WebP images with JPEG fallbacks, lazy loading below the fold, and the whole page well under 1 MB.
- **Honest content.** Nothing is invented. Anything that needs a real fact (project names, partner logos, office address, contact details) is a visible placeholder marked `CONFIRM` in the source.
- **Configuration in one place.** The form key, WhatsApp number, phone and email live in a `config` object at the top of `js/main.js`. Buttons that depend on missing values show a "pending" state instead of breaking.

## Run locally

```bash
python -m http.server 8000   # then open http://localhost:8000
```

## Deploy

```bash
python scripts/build-dist.py   # copies the site files into dist/ with cache headers
npx wrangler deploy            # publishes dist/ as Cloudflare Workers static assets
```

## Project structure

```
index.html              the page
css/styles.css          design tokens, layout and components
js/main.js              config, mobile menu, quote form, scroll reveal
assets/                 logo mark, favicon, photos (WebP and JPEG)
scripts/
  prep-assets.py        fetches and converts the photos
  contrast.mjs          checks colour-token contrast against WCAG AA
  build-dist.py         assembles dist/ for deployment
wrangler.toml           Cloudflare Workers config
```

## Photo credits

Photos from [Unsplash](https://unsplash.com) (free licence): city skyline, process plant, transmission towers and an aerial site survey.
