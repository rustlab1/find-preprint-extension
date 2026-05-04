// Last-resort title-search fallback. We query Crossref for preprints whose
// titles fuzzy-match the published article. Marked as "likely match" in UI.
//
// Crossref is used here (not bioRxiv directly) because Crossref indexes most
// preprint servers and supports filter=type:posted-content + bibliographic
// queries with relevance scoring.

import { classifyHost } from "./preprint_hosts.js";

const POLITE_MAILTO = "rustbioconsulting@gmail.com";

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Token-based Jaccard. Cheap, good enough for "is this the same title".
function similarity(a, b) {
  const A = new Set(normalize(a).split(" ").filter(Boolean));
  const B = new Set(normalize(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

export async function lookupTitleSearch(title, firstAuthor) {
  if (!title || title.length < 15) return null;
  const queryParts = [`query.bibliographic=${encodeURIComponent(title)}`];
  if (firstAuthor) {
    queryParts.push(`query.author=${encodeURIComponent(firstAuthor)}`);
  }
  queryParts.push("filter=type:posted-content");
  queryParts.push("rows=5");
  queryParts.push(`mailto=${encodeURIComponent(POLITE_MAILTO)}`);
  const url = `https://api.crossref.org/works?${queryParts.join("&")}`;

  let res;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json();
  const items = data.message?.items || [];

  let best = null;
  for (const it of items) {
    const t = (it.title && it.title[0]) || "";
    const sim = similarity(title, t);
    if (!best || sim > best.sim) {
      best = {
        sim,
        doi: String(it.DOI || "").toLowerCase(),
        title: t,
        url: `https://doi.org/${it.DOI}`,
      };
    }
  }

  if (!best || best.sim < 0.85) return null;

  return {
    doi: best.doi,
    url: best.url,
    server: classifyHost(best.url) || "preprint",
    version: null,
    confidence: "likely",
    similarity: best.sim,
  };
}

export const _internal = { similarity, normalize };
