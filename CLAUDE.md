# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A monorepo of plain JS custom scripts for Webflow sites. No build step. Each script lives at `scripts/<name>/index.js` and is served via jsDelivr CDN from the `staging` or `main` branch.

## Adding a New Script

Create `scripts/<name>/index.js`. Add the jsDelivr URL to Webflow's custom code (staging site for `@staging`, production site for `@main`). Add a Requestly redirect rule for local dev. See README.md for the full URL pattern.

## Dev Commands

```
npm run dev        # browser-sync on localhost:3002 with CORS + directory listing (for Requestly intercept)
npm run dev:open   # same but opens the browser
```

## Three-Stage Workflow

1. **Local** — `npm run dev` + Requestly redirects jsDelivr URLs to localhost
2. **Staging** — push to `staging` branch → GitHub Actions purges jsDelivr `@staging` cache
3. **Production** — merge to `main` → GitHub Actions purges jsDelivr `@main` cache

Scripts in Webflow's custom code always point to jsDelivr branch URLs (set once, never changed).

## GitHub Actions

Both workflows detect changed `.js` files via `git diff HEAD~1 HEAD` and call the jsDelivr purge API for each. No secrets or env vars needed — `github.repository` provides the org/repo slug.

## Script Conventions

Follow the `example/index.js` pattern for new scripts:
- IIFE wrapper with `"use strict"`
- Attribute-driven targeting (`data-<script-name>` selectors, not hardcoded classes)
- DOMContentLoaded guard (`document.readyState === "loading"` check)
- `console.log("[script-name] initialized on N element(s)")` for debug tracing
- JSDoc header with usage, staging CDN URL, and production CDN URL

## CDN URLs

Repo slug: `mark-superbrick/new-word-order`

```
# Staging
https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@staging/scripts/<name>/index.js

# Production
https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@main/scripts/<name>/index.js
```

## Existing Files

`scripts/*.html` and `styles/*.html` are Webflow embed snippets saved for reference — not part of the CDN pipeline.

Scripts in `scripts/homepage/` use named files (`hero-scroll.js`, etc.) rather than `index.js` — legacy structure, not the current convention. Loose `.js` files directly under `scripts/` are also legacy.
