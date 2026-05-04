// Crossref Works API. We use it for two things:
//   1. work type filtering (only proceed for journal-article etc.)
//   2. relation field, which sometimes has "is-preprint-of" / "has-preprint"
// Docs: https://api.crossref.org/swagger-ui/index.html

import { classifyHost } from "./preprint_hosts.js";

const POLITE_MAILTO = "rustbioconsulting@gmail.com";

function isValidDoi(s) {
  return /^10\.\d{4,9}\/[^\s]+$/i.test(String(s || ""));
}

export async function lookupCrossref(doi) {
  if (!doi) return null;
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${encodeURIComponent(POLITE_MAILTO)}`;
  let res;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json();
  const msg = data.message;
  if (!msg) return null;

  const result = {
    type: msg.type || null,
    title: (msg.title && msg.title[0]) || null,
    authors: (msg.author || []).map((a) =>
      [a.given, a.family].filter(Boolean).join(" ")
    ),
    container: (msg["container-title"] && msg["container-title"][0]) || null,
    preprints: [],
  };

  // relation field is keyed by relation type.
  const rel = msg.relation || {};
  const candidates = [
    ...(rel["has-preprint"] || []),
    ...(rel["is-preprint-of"] || []),
  ];
  for (const r of candidates) {
    // Crossref relation ids should be DOIs but occasionally include other
    // id-types. Validate before constructing a doi.org URL.
    if (r.id && isValidDoi(r.id)) {
      const id = String(r.id).toLowerCase();
      const url = `https://doi.org/${id}`;
      result.preprints.push({
        doi: id,
        url,
        server: classifyHost(url) || "preprint",
        version: null,
      });
    }
  }

  return result;
}
