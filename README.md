# Webflow Scripts

Monorepo of plain JS scripts for Webflow sites. Three-stage workflow: local dev → staging → production, all without touching Webflow's custom code after initial setup.

## Structure

```
scripts/
  <script-name>/
    index.js        ← one file per script
.github/
  workflows/
    staging-deploy.yml
    production-deploy.yml
package.json        ← dev tooling only (live-server)
```

## One-Time Setup

### 1. GitHub repo

Create a GitHub repo and push this code. Note your `org/repo` slug — you'll use it everywhere below.

### 2. Webflow staging custom code

In your Webflow project's **staging site** (the `.webflow.io` domain), add script tags to the appropriate location (global `<head>`/`<body>` or per-page):

```html
<script src="https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@staging/scripts/example/index.js"></script>
```

These URLs are set once and never changed. Pushing to the `staging` branch updates what jsDelivr serves.

### 3. Webflow production custom code

Same as above but pointing at `@main`:

```html
<script src="https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@main/scripts/example/index.js"></script>
```

### 4. Requestly browser extension

Install [Requestly](https://requestly.com/) (Chrome/Firefox).

Create a **Redirect Rule**:

| Field | Value |
|---|---|
| Source URL — Contains | `cdn.jsdelivr.net/gh/mark-superbrick/new-word-order` |
| Redirect To | `http://localhost:3000/$1` (use the path wildcard for your script) |

For a single active script during dev, a simpler rule works well:

| Source URL — Equals | `https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@staging/scripts/example/index.js` |
|---|---|
| Redirect To | `http://localhost:3000/scripts/example/index.js` |

Duplicate this rule for each script you're actively developing. Toggle rules on/off as needed.

---

## Workflow 1 — Local Development

```
npm install        # first time only
npm run dev        # starts live-server on http://localhost:3000
```

1. Enable the Requestly rule for the script you're working on
2. Open your Webflow `.webflow.io` staging site in the same browser
3. Edit `scripts/<name>/index.js` — the page auto-refreshes via live-server
4. Disable the Requestly rule when done to go back to the CDN version

The staging site's custom code never changes. Requestly intercepts the jsDelivr URL at the browser level.

---

## Workflow 2 — Staging

```
git add scripts/<name>/index.js
git commit -m "feat: describe what changed"
git push origin staging
```

GitHub Actions detects which script files changed, then calls the jsDelivr purge API for each one. Cache clears within ~30 seconds. Open the `.webflow.io` staging URL to test.

**No Webflow edits required.**

---

## Workflow 3 — Production

```
# On GitHub: open a PR from staging → main, review, merge
```

Same Actions workflow runs on `main`, purging the `@main` jsDelivr cache. The production Webflow site updates automatically within ~30 seconds of merge.

**No Webflow publish required for script-only changes.**

---

## Adding a New Script

1. Create the folder and file:
   ```
   scripts/my-new-script/index.js
   ```

2. Add the staging script tag to Webflow staging custom code (one-time):
   ```html
   <script src="https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@staging/scripts/my-new-script/index.js"></script>
   ```

3. Add the production script tag to Webflow production custom code (one-time):
   ```html
   <script src="https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@main/scripts/my-new-script/index.js"></script>
   ```

4. Add a Requestly redirect rule for local dev.

5. Push to `staging` to test, merge to `main` to ship.

---

## URL Reference

```
# Local dev (intercepted by Requestly)
http://localhost:3000/scripts/<name>/index.js

# Staging CDN
https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@staging/scripts/<name>/index.js

# Production CDN
https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@main/scripts/<name>/index.js
```

Replace `mark-superbrick/new-word-order` with your actual GitHub `org/repo` slug throughout.

---

## Notes

- **jsDelivr caching:** Branch-pinned URLs are cached. The GitHub Actions workflows call the jsDelivr purge API on every push — without this, changes can take up to 24h to propagate.
- **live-server CORS:** The `--cors` flag is required so the Webflow staging page (a different origin) can load scripts from localhost.
- **No build step:** Scripts are plain JS files served as-is. If you add a build step later (TypeScript, minification), update `npm run dev` and `npm run build` accordingly and adjust the Actions workflows to build before purging.
