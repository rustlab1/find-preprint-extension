// Unpaywall API: OA status + a list of OA locations (often includes the
// preprint URL directly). Free, no key, requires email param.
// Docs: https://unpaywall.org/products/api

import { classifyHost } from "./preprint_hosts.js";

export async function lookupUnpaywall(doi, email) {
  if (!doi || !email) return null;
  const url = `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${encodeURIComponent(email)}`;
  let res;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json();

  const oa = !!data.is_oa;
  const oaStatus = data.oa_status || (oa ? "oa" : "closed");

  // Pull any preprint locations from oa_locations.
  const preprints = [];
  for (const loc of data.oa_locations || []) {
    const candidate = loc.url_for_landing_page || loc.url || loc.url_for_pdf;
    const server = classifyHost(candidate);
    if (server) {
      preprints.push({
        url: candidate,
        server,
        version: loc.version || null,
        // Unpaywall doesn't always give a separate preprint DOI; leave null.
        doi: null,
      });
    }
  }

  return {
    oa,
    oaStatus,
    bestOaUrl: data.best_oa_location?.url_for_landing_page || data.best_oa_location?.url || null,
    preprints,
  };
}
