# Chrome Web Store listing copy

Paste the relevant sections into the Chrome Web Store developer dashboard
when submitting the extension. All copy is plain text; the dashboard does
not render Markdown.

---

## Single purpose

Find a freely available preprint version of the journal article you are
viewing.

---

## Short description (≤132 chars)

> Finds the freely available preprint version of paywalled journal articles.

(That is 70 chars. Below are alternates if you want a different angle.)

- _Skip the paywall: finds the preprint version of the journal article you're reading._ (82 chars)
- _Detects whether a paper is open access, and if not, finds a free preprint._ (76 chars)

---

## Detailed description

> Find Preprint is a small, focused tool for researchers, students, and
> anyone who hits a paywall when trying to read a scientific paper.
>
> When you open a journal article in Chrome, Find Preprint:
>
> - Detects the article's DOI from the page metadata.
> - Checks whether the article is open access (via Unpaywall).
> - If the article is paywalled, searches a chain of public scholarly
>   APIs for a freely available preprint: Crossref, bioRxiv / medRxiv,
>   Europe PMC, and Semantic Scholar. As a last resort it does a fuzzy
>   title search for posted-content matches.
> - Shows the result in a small popup and on the toolbar badge.
> - Optionally injects a slim banner at the top of paywalled pages
>   when a preprint is found, with a one-click link to open it.
>
> Three possible outcomes:
>
> - OA badge (green): the article is already open access.
> - PP badge (blue): the article is paywalled, but a preprint is
>   available.
> - Lock badge (red): the article is paywalled and no preprint was
>   found.
>
> Results are cached locally for 30 days so the same paper is not
> looked up twice. The extension contacts external services only when a
> scholarly DOI is found on the page; otherwise it does nothing.
>
> Open source (MIT) at https://github.com/rustlab1/find-preprint-extension.
> Privacy policy: see the link in the listing or the repository.

---

## Category

> Productivity

(Alternate: "Accessibility" if you want to position around access to
research, but Productivity is more discoverable.)

---

## Permission justifications

Chrome will ask why each permission is needed. Use the wording below.

### `storage`
> Used to cache scholarly metadata lookups in the browser's IndexedDB
> for 30 days (so the same paper is not queried repeatedly), and to
> persist user settings such as the banner toggle and the list of
> domains where the user has dismissed the banner. No data leaves the
> browser via this permission.

### `activeTab`
> Used by the toolbar popup to read the active tab's id so the popup
> can display the lookup result for the page the user is currently
> viewing. The permission is only invoked when the user clicks the
> extension icon.

### Host permissions (`api.unpaywall.org`, `api.crossref.org`, `api.biorxiv.org`, `www.ebi.ac.uk/europepmc/*`, `api.semanticscholar.org`, `export.arxiv.org`)
> The extension sends only the article DOI (and in the title-fallback
> case, the article title and first author) to these public scholarly
> APIs to determine open-access status and find linked preprints. No
> page content, browsing history, or user identifier is sent. Each
> service is required to obtain a different piece of information that
> the others do not provide:
>
> - Unpaywall: open-access status of the article.
> - Crossref: preprint relations and authoritative metadata.
> - bioRxiv / medRxiv: direct published-DOI to preprint-DOI mapping.
> - Europe PMC: preprint links via comment-correction relations,
>   resolving Europe PMC internal preprint ids to real DOIs.
> - Semantic Scholar: arXiv ids surfaced via externalIds.
> - arXiv: required only as a redirect target for already-known arXiv ids.

### Content script match `<all_urls>`
> Scholarly articles are hosted on thousands of publisher domains; a
> hard-coded list would silently fail on any unlisted publisher. The
> content script bails immediately on pages that do not expose
> scholarly metadata (citation_doi meta tag, DC.Identifier, JSON-LD
> ScholarlyArticle, or a /doi/ URL pattern). No data is sent to any
> server until a DOI is detected.

---

## Data use disclosures (Chrome Web Store data privacy form)

When prompted, declare:

- "What user data does your extension collect or use?"
  > **Website content** — limited to scholarly metadata (DOI, title,
  > authors) extracted only from journal article pages.
- "How is the data used?"
  > To look up open-access status and find a preprint version of the
  > article. Data is sent only to the public scholarly APIs listed in
  > the privacy policy.
- "Is the data sold or transferred to third parties?"
  > **No.**
- "Is the data used or transferred for purposes unrelated to the
  extension's single purpose?"
  > **No.**
- Certifications:
  > Yes to all three (data not sold, only used for the stated purpose,
  > data is not used for creditworthiness or lending).

---

## Privacy policy URL

After committing `PRIVACY.md`, use the GitHub raw or rendered URL:

> https://github.com/rustlab1/find-preprint-extension/blob/main/PRIVACY.md

(Or, if you enable GitHub Pages later, swap to the Pages URL.)

---

## Support / homepage URL

> https://github.com/rustlab1/find-preprint-extension

---

## Screenshots checklist

The store requires 1–5 screenshots, each 1280×800 or 640×400 PNG/JPEG.
Suggested set:

1. Toolbar badge on a Nature article (PP, paywalled with preprint).
2. Popup expanded, showing "Open preprint" button and source list.
3. Banner injected at top of paywalled page.
4. OA case: popup showing "This article is open access".
5. Settings page.

Take these once the extension is loaded locally; macOS Cmd-Shift-4 with
window selection works at the right size if you scale Chrome to 1280px
wide.

---

## Promo tile (optional, 440×280)

A simple lockup of the icon plus the words "Find the preprint" on a blue
background works. Optional; the listing is fine without it.
