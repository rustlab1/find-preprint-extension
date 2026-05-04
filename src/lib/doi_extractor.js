// Extract DOI and minimal article metadata from a journal article page.
// DOI is the only reliable handle. Title/authors are kept as a fallback for
// title-search lookups when no DOI is found.

const DOI_REGEX = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;

function cleanDoi(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  s = s.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  s = s.replace(/^doi:\s*/i, "");
  // Strip trailing punctuation that often gets glued on from URLs/text.
  s = s.replace(/[.,;)\]]+$/, "");
  const m = s.match(DOI_REGEX);
  return m ? m[0] : null;
}

function metaContent(names) {
  for (const name of names) {
    const el =
      document.querySelector(`meta[name="${name}" i]`) ||
      document.querySelector(`meta[property="${name}" i]`);
    if (el && el.content) return el.content;
  }
  return null;
}

function metaContentAll(name) {
  return Array.from(
    document.querySelectorAll(`meta[name="${name}" i], meta[property="${name}" i]`)
  )
    .map((el) => el.content)
    .filter(Boolean);
}

function extractFromJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const s of scripts) {
    try {
      const data = JSON.parse(s.textContent);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const t = item["@type"];
        const types = Array.isArray(t) ? t : [t];
        if (!types.some((x) => /article|scholarly/i.test(x || ""))) continue;
        const doi = cleanDoi(item.identifier || item.doi || item["@id"] || item.url);
        if (doi) return { doi, title: item.headline || item.name || null };
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return null;
}

function extractFromUrl() {
  const url = location.href;
  // doi.org or publisher /doi/ patterns.
  const patterns = [
    /doi\.org\/(10\.\d{4,9}\/[^\s?#]+)/i,
    /\/doi\/(?:abs|full|pdf|epdf|figure)?\/?(10\.\d{4,9}\/[^\s?#]+)/i,
    /\/articles\/([a-z0-9.-]+)\b/i, // Nature-style article slug
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) {
      const cleaned = cleanDoi(m[1]);
      if (cleaned) return cleaned;
    }
  }
  return null;
}

export function extractArticle() {
  // 1. Standard scholarly meta tags.
  const metaDoi = cleanDoi(
    metaContent([
      "citation_doi",
      "DC.Identifier",
      "DC.identifier",
      "dc.identifier",
      "prism.doi",
      "bepress_citation_doi",
    ])
  );

  const title = metaContent([
    "citation_title",
    "DC.Title",
    "dc.title",
    "og:title",
    "twitter:title",
  ]);

  const authors = metaContentAll("citation_author").length
    ? metaContentAll("citation_author")
    : metaContentAll("DC.Creator");

  if (metaDoi) {
    return { doi: metaDoi, title, authors, source: "meta" };
  }

  // 2. JSON-LD ScholarlyArticle.
  const jsonld = extractFromJsonLd();
  if (jsonld?.doi) {
    return {
      doi: jsonld.doi,
      title: jsonld.title || title,
      authors,
      source: "jsonld",
    };
  }

  // 3. URL pattern.
  const urlDoi = extractFromUrl();
  if (urlDoi) {
    return { doi: urlDoi, title, authors, source: "url" };
  }

  // 4. Free-text scan of the page (last resort, noisy).
  const bodyText = document.body?.innerText?.slice(0, 5000) || "";
  const m = bodyText.match(DOI_REGEX);
  if (m) {
    return { doi: cleanDoi(m[0]), title, authors, source: "text" };
  }

  // 5. Title only — useful if we end up doing fuzzy preprint search.
  if (title) {
    return { doi: null, title, authors, source: "title-only" };
  }

  return null;
}

export const _internal = { cleanDoi, DOI_REGEX };
