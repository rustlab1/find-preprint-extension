# CLAUDE.md

## Project

Chrome extension that, on a journal article page, identifies whether the
article is open access and finds a freely available preprint version.

Direction: published article -> preprint (the reverse of the
`Preprint-to-Publication` research project in this folder).

## Scope

- Manifest V3 Chrome extension, plain JS, no bundler initially.
- Detect article via DOI metadata in the page.
- Check OA status via Unpaywall.
- Find preprint via chain: Unpaywall locations, Crossref relations,
  bioRxiv/medRxiv API, Europe PMC, Semantic Scholar, title fallback.
- Show result in popup and optional in-page banner.

## Constraints

- Only DOI/title may leave the browser. No page content, no user identity.
- Cache lookups in IndexedDB for 30 days keyed by DOI.
- Don't claim a preprint match unless confident (Crossref relation,
  bioRxiv API hit, or title fuzzy match >0.85).
- No hype language in UI copy.

## Implementation guidance

- Keep changes small and focused.
- Prefer readable code over clever code.
- Add minimal tests for DOI extraction and the API chain.
- Document assumptions near the code.
- See `PLAN.md` for the full design and milestones.
