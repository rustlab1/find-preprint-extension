# Changelog

All notable changes to this project will be documented in this file. The
format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.1.0] - 2026-05-04

### Added
- Detection of scholarly DOI from page metadata (citation_doi, DC.Identifier,
  JSON-LD ScholarlyArticle, /doi/ URL patterns, free-text fallback).
- Open-access status check via Unpaywall.
- Six-source preprint discovery chain:
  Unpaywall locations, Crossref `is-preprint-of` relations, bioRxiv / medRxiv
  direct lookup, Europe PMC (with PPR id resolution), Semantic Scholar
  (arXiv ids), and a Crossref `posted-content` title fuzzy fallback
  (Jaccard > 0.85).
- Toolbar badge with three states: OA (green), PP (blue),
  🔒 (red).
- Popup UI with status pills, preprint server / version / date, and
  copy-link / copy-DOI buttons. OA pages show a dedicated "open access"
  message instead of "no preprint found".
- Slim in-page banner on paywalled pages where a preprint was found,
  dismissible per-domain for 30 days.
- Settings page: Unpaywall email override, banner toggle, clear cache,
  reset dismissed sites.
- 30-day IndexedDB result cache keyed by DOI.
- Per-tab result persistence via `chrome.storage.session` so the popup
  stays accurate after the service worker idles out.

[Unreleased]: https://github.com/rustlab1/find-preprint-extension/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rustlab1/find-preprint-extension/releases/tag/v0.1.0
