// Europe PMC. The search returns the published article's record, whose
// `fullTextUrlList` may already point at a preprint server, and whose
// `commentCorrectionList` may link to a preprint via Europe PMC's internal
// ID space (source `PPR`, ids like `PPR1023627`).
//
// PPR ids are NOT DOIs. To get the preprint's real DOI we hit
// /article/{source}/{id} for each commentCorrection that's a preprint.
// Docs: https://europepmc.org/RestfulWebService

import { classifyHost } from "./preprint_hosts.js";

const SEARCH_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

function isValidDoi(s) {
  return /^10\.\d{4,9}\/[^\s]+$/i.test(String(s || ""));
}

// Resolve a Europe PMC internal id (source + id, e.g. PPR + 1023627) to its
// full record. The /article/{src}/{id} endpoint returns empty for many
// preprints; /search?query=EXT_ID:...+AND+SRC:... is reliable.
async function fetchByExtId(source, id) {
  const q = encodeURIComponent(`EXT_ID:${id} AND SRC:${source}`);
  const url = `${SEARCH_URL}?query=${q}&format=json&resultType=core`;
  let res;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json();
  return data.resultList?.result?.[0] || null;
}

function findPreprintUrlInRecord(record) {
  const urls = record?.fullTextUrlList?.fullTextUrl || [];
  for (const u of urls) {
    const candidate = u.url || "";
    const server = classifyHost(candidate);
    if (server) return { url: candidate, server };
  }
  return null;
}

export async function lookupEuropePmc(doi) {
  if (!doi) return null;
  const q = encodeURIComponent(`DOI:${doi}`);
  const url = `${SEARCH_URL}?query=${q}&format=json&resultType=core`;
  let res;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json();
  const hit = data.resultList?.result?.[0];
  if (!hit) return null;

  const preprints = [];

  // 1. Direct preprint URLs in the published record's fullTextUrlList.
  const direct = findPreprintUrlInRecord(hit);
  if (direct) {
    preprints.push({ ...direct, version: null, doi: null });
  }

  // 2. commentCorrection entries flagged as preprint relations.
  const ccl = hit.commentCorrectionList?.commentCorrection || [];
  for (const c of ccl) {
    if (!/preprint/i.test(c.type || "")) continue;
    if (!c.id) continue;

    // Case A: id is already a real DOI.
    if (isValidDoi(c.id)) {
      const u = `https://doi.org/${c.id}`;
      preprints.push({
        url: u,
        server: classifyHost(u) || "preprint",
        version: null,
        doi: String(c.id).toLowerCase(),
      });
      continue;
    }

    // Case B: id is an Europe PMC internal ID (e.g. PPR1023627). Resolve it.
    const source = c.source || "PPR";
    // EXT_ID matches the full id with source prefix included in the API.
    const record = await fetchByExtId(source, c.id);
    if (!record) continue;

    const recordDoi = record.doi && isValidDoi(record.doi) ? record.doi.toLowerCase() : null;
    const found = findPreprintUrlInRecord(record);

    if (found) {
      preprints.push({
        url: found.url,
        server: found.server,
        version: null,
        doi: recordDoi,
      });
    } else if (recordDoi) {
      const u = `https://doi.org/${recordDoi}`;
      preprints.push({
        url: u,
        server: classifyHost(u) || "preprint",
        version: null,
        doi: recordDoi,
      });
    }
    // If neither a preprint URL nor a real DOI is available, drop it. We'd
    // rather show "no preprint found" than an invalid link.
  }

  return { preprints };
}

export const _internal = { isValidDoi };
