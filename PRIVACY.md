# Privacy Policy — Find Preprint

_Last updated: 2026-05-04_

Find Preprint is a Chrome extension that helps you find a freely available
preprint version of the journal article you are viewing. This page describes
exactly what data the extension handles and where it is sent.

## What data leaves your browser

When the extension detects a journal article on the current page, it sends
the article's **DOI** (or, when no DOI is found, the article **title and
first author**) to a small set of public scholarly APIs. These requests
contain no user identifier, no browsing history, and no page content other
than the DOI or title.

The endpoints contacted are:

| Service | URL | What is sent | Why |
| --- | --- | --- | --- |
| Unpaywall | `api.unpaywall.org` | DOI + a polite-pool email | Determine open-access status |
| Crossref | `api.crossref.org` | DOI or title | Find preprint relations and metadata |
| bioRxiv / medRxiv | `api.biorxiv.org` | DOI | Find a linked preprint |
| Europe PMC | `www.ebi.ac.uk/europepmc` | DOI or internal preprint id | Find a linked preprint |
| Semantic Scholar | `api.semanticscholar.org` | DOI | Find a linked arXiv id |

The polite-pool email is included only with Unpaywall and Crossref requests
because those services require a contact email per their terms of use. The
extension defaults to a project email (`find.the.preprint@gmail.com`); you
can replace it with your own in the Settings page.

## What data stays on your device

- **Lookup results** are cached in the browser's IndexedDB for 30 days,
  keyed by DOI, to avoid repeated API calls. You can clear this cache from
  the Settings page.
- **Settings** (banner toggle, dismissed sites) are stored via
  `chrome.storage.sync`, which Chrome may sync across your signed-in
  browsers if you have sync enabled. No third party receives this data.

## What data is NOT collected

- No page content beyond the DOI or article title.
- No browsing history, cookies, or form data.
- No personally identifying information.
- No analytics or telemetry of any kind.
- No advertising identifiers.

## Pages where the extension runs

The extension's content script runs on every web page in order to detect
scholarly metadata, but it sends data to the APIs above only when the page
is recognized as a journal article (i.e. the page exposes a DOI in its
metadata or URL). On all other pages, the script bails immediately and
contacts no external services.

## Third-party privacy policies

Each API has its own terms and privacy policy:

- Unpaywall: https://unpaywall.org/legal/privacy
- Crossref: https://www.crossref.org/operations-and-sustainability/privacy/
- bioRxiv / medRxiv: https://www.biorxiv.org/about/FAQ
- Europe PMC: https://europepmc.org/Help#privacy
- Semantic Scholar: https://www.semanticscholar.org/about/privacy

## Source code and contact

Find Preprint is open source under the MIT license. The full source code
is available at https://github.com/rustlab1/find-preprint-extension.
For privacy questions, open an issue on the repository.
