# Chrome Web Store — Permission justifications

Paste each block into the matching field in the dashboard. Each block is
under the 1000-character limit per field.

Set "Are you using remote code?" to **No, I am not using remote code**.
The extension only fetches JSON from public APIs (data, not code). It
does not load external `<script>` tags, dynamic-import remote URLs, or
use `eval()`.

---

## storage justification

The 'storage' permission is used for two purposes, both local to the
browser. First, scholarly metadata lookups are cached in IndexedDB for
30 days, keyed by DOI, so the same article is not queried repeatedly
across visits or sessions. Second, user settings are persisted via
chrome.storage.sync: the polite-pool email sent to Unpaywall and
Crossref, the toggle for the in-page banner shown on paywalled pages
where a preprint is found, and per-domain timestamps recording when
the user dismissed the banner. The latest lookup per tab is also kept
in chrome.storage.session so the popup can display the result after
the service worker idles out. No data leaves the browser through this
permission. The cache and settings can be cleared by the user from
the extension's options page.

(~875 chars)

---

## activeTab justification

The 'activeTab' permission is used only when the user clicks the
toolbar icon. The popup calls chrome.tabs.query with active:true,
currentWindow:true to read the active tab's id, then asks the
service worker for the lookup result that was computed for that tab.
The permission grants temporary, user-gesture-scoped access; no broad
tab access is ever requested. The popup does not read tab page
content, cookies, or URL beyond the tab id needed to retrieve the
already-computed result.

(~520 chars)

---

## Host permission justification

Two host-related permissions are requested.

(1) API endpoints (api.unpaywall.org, api.crossref.org,
api.biorxiv.org, www.ebi.ac.uk/europepmc, api.semanticscholar.org,
export.arxiv.org): the service worker sends only the article DOI
(or, in the title-fallback case, the title and first author) to
these public scholarly APIs. No page content, browsing history, or
user identifier is sent. Each service provides information the
others do not: Unpaywall (OA status), Crossref (preprint relations),
bioRxiv/medRxiv (published-DOI to preprint-DOI mapping), Europe PMC
(preprint relations and PPR id resolution), Semantic Scholar (arXiv
ids).

(2) Content script match <all_urls>: scholarly articles live on
thousands of publisher domains; a fixed allowlist would silently
miss unlisted ones. The content script bails immediately on pages
without scholarly metadata (citation_doi, DC.Identifier, JSON-LD
ScholarlyArticle, or /doi/ URL). No request is made until a DOI is
detected.
