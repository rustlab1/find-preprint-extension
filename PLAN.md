# Find Preprint Chrome Extension — Plan

## Goal

A Chrome extension that, when the user is on a journal article page,
detects whether the article is open access and finds a freely available
preprint version. Most useful for paywalled articles.

## User flow

1. User lands on a journal article page (Nature, Science, Cell, Elsevier,
   Wiley, etc.).
2. Extension icon shows a colored badge:
   - Green: open access (no preprint search needed, but still shown if found)
   - Blue: paywalled, preprint found
   - Yellow: paywalled, no preprint found
   - Gray: not a recognized article page
3. Clicking the icon opens a popup with:
   - Article title and DOI
   - OA status (with source: Unpaywall)
   - Preprint link with server name (bioRxiv / medRxiv / arXiv / ChemRxiv / Research Square)
   - Posted date and version
   - "Open preprint" button
   - "Copy citation" button
4. Optional: small in-page banner at the top of paywalled pages with a one-click link to the preprint.

## Detection: identifying the article

The DOI is the most reliable handle. Extraction order:
1. Meta tags: `citation_doi`, `dc.identifier`, `prism.doi`, `og:url` containing `/doi/`
2. Schema.org JSON-LD with `@type: ScholarlyArticle`
3. URL pattern matching for major publishers (e.g. `nature.com/articles/...`, `science.org/doi/...`, `cell.com/.../fulltext/...`)
4. Fallback: title + first author from `citation_title` and `citation_author`

If no DOI and no clean title, do nothing — don't guess.

## OA status

Single source: **Unpaywall** (`api.unpaywall.org/v2/{doi}?email={user_email}`).
- Free, no API key, requires email param (set in extension options).
- Returns `is_oa`, `oa_status` (gold/green/hybrid/bronze/closed), and `oa_locations[]` with URLs.
- Cache results for 30 days keyed by DOI.

## Preprint discovery (in priority order)

### 1. Unpaywall `oa_locations`
Often already includes a bioRxiv/medRxiv/arXiv URL with `host_type: "repository"`. Fastest path. Filter for known preprint hosts.

### 2. Crossref relations
`api.crossref.org/works/{doi}` returns a `relation` field. Look for `is-preprint-of` and `has-preprint`. When present, this is authoritative.

### 3. bioRxiv / medRxiv API
`api.biorxiv.org/pubs/{server}/{published_doi}` returns the preprint DOI directly when bioRxiv knows the link. Try both `biorxiv` and `medrxiv` servers.

### 4. Europe PMC
`europepmc.org/api/get/articleSearch?query=DOI:{doi}` and look for `commentCorrectionList` or `fullTextUrlList` entries pointing to preprint servers. Europe PMC explicitly tracks preprint <-> publication links.

### 5. Semantic Scholar
`api.semanticscholar.org/graph/v1/paper/DOI:{doi}?fields=externalIds,openAccessPdf` — sometimes surfaces preprint DOIs in `externalIds` (ArXiv, MAG).

### 6. Title + first author fallback
If all else fails, search bioRxiv (`api.biorxiv.org/details/biorxiv/...`) and arXiv (`export.arxiv.org/api/query`) by title and author. Require fuzzy title match >0.85 to accept a hit. This is the noisiest path; flag the result as "likely match" in the UI.

## Architecture

Manifest V3, three components:

### `content_script.js`
- Runs on `*://*/*` (filtered by URL patterns for known publishers, plus a generic DOI-meta scan).
- Extracts DOI / metadata from the page.
- Sends a single message to the background worker: `{type: "lookup", doi, title, authors}`.
- If a result comes back and the page is paywalled, optionally injects a slim banner.

### `background.js` (service worker)
- Receives lookup requests.
- Reads from IndexedDB cache first (key: DOI, TTL: 30 days).
- Otherwise runs the API chain (Unpaywall -> Crossref -> bioRxiv/medRxiv -> Europe PMC -> Semantic Scholar -> title fallback). Stop on first confident hit.
- Writes result to cache.
- Sets badge text/color via `chrome.action.setBadgeText`.
- Replies to content script and stores latest result for popup.

### `popup.html` + `popup.js`
- Reads the active tab's stored lookup result.
- Renders article info, OA status, preprint link.
- Buttons: open preprint, copy DOI, copy citation, report wrong match.

### `options.html`
- User email for Unpaywall (required).
- Toggle: show in-page banner.
- Clear cache button.

## File layout

```
Find-Preprint-Extension/
  manifest.json
  src/
    background.js
    content_script.js
    popup.html
    popup.js
    options.html
    options.js
    lib/
      doi_extractor.js
      api_unpaywall.js
      api_crossref.js
      api_biorxiv.js
      api_europepmc.js
      api_semanticscholar.js
      cache.js
      preprint_hosts.js   # known host list
  icons/
    icon16.png icon48.png icon128.png
  test/
    fixtures/   # saved HTML from sample journal pages
    extractor.test.js
    api_chain.test.js
  PLAN.md
  README.md
```

## Known preprint hosts (initial list)
bioRxiv, medRxiv, arXiv, ChemRxiv, Research Square, SSRN, PsyArXiv, EarthArXiv, Authorea, Preprints.org, OSF Preprints.

## Edge cases
- **DOI on a publisher page that's actually an Editorial / News piece**: Crossref `type` filter — only proceed for `journal-article`, `proceedings-article`, `book-chapter`.
- **Preprint version mismatch**: bioRxiv API returns all versions; show the latest one but mention version number.
- **Same DOI appears as both preprint and journal**: rare but possible (e.g. eLife). Trust Crossref `type` and `relation`.
- **CORS**: all listed APIs allow CORS or work from a service worker context. Verify per-API during implementation.
- **Rate limits**: Unpaywall is generous but requires email; Crossref polite pool needs `mailto`; Semantic Scholar requires light pacing. Cache aggressively.
- **Privacy**: only DOI/title leaves the browser, and only on pages the user actually visits. State this in the README and options page.

## Build choices
- Plain JS, no bundler initially. ES modules work in MV3 service workers.
- If complexity grows, switch to Vite + TypeScript later.
- Lint with eslint, format with prettier.

## Milestones

1. **M1 — Scaffold + DOI extraction**: manifest, content script that logs DOI on Nature, Science, NEJM, Cell, PLOS, Wiley, Elsevier, Springer pages. No API calls yet.
2. **M2 — Unpaywall integration**: badge color reflects OA status. Popup shows OA info.
3. **M3 — Preprint discovery v1**: Unpaywall + Crossref + bioRxiv/medRxiv chain. Popup shows preprint link.
4. **M4 — Fallback chain**: Europe PMC, Semantic Scholar, title-search fallback.
5. **M5 — In-page banner + options page + cache**.
6. **M6 — Test on 30 random paywalled DOIs**, fix misses.
7. **M7 — Package for Chrome Web Store** (icons, screenshots, privacy policy, listing copy).

## Done definition
- Works on pages from at least 10 major publishers.
- For 30 random paywalled articles known to have preprints, finds the preprint correctly in >80% of cases.
- Clearly marks "no preprint found" without false positives that would mislead the user.
- No data leaves the browser beyond the DOI/title sent to the listed APIs.

## Decisions
- **Unpaywall email**: ship a project email hardcoded in `options.js`. The email is just a polite-pool contact, not a key, and Unpaywall is free. User can override in options if they want.
- **In-page banner**: on by default, but only injected when the page is paywalled *and* a preprint was found. Slim dismissible bar at top, per-domain dismiss remembered for 30 days. Toggle in options to disable entirely.

## Open questions
- Should the extension also work in reverse (preprint page -> published version)? Out of scope for v1, easy add later since bioRxiv API already gives the published DOI.
