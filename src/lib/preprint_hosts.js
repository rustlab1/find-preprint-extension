// Known preprint server domains and DOI prefixes. Used to recognize preprint
// URLs returned by Unpaywall/Crossref/etc., and to label results in the UI.

export const PREPRINT_HOSTS = [
  { match: /(^|\.)biorxiv\.org$/i, name: "bioRxiv" },
  { match: /(^|\.)medrxiv\.org$/i, name: "medRxiv" },
  { match: /(^|\.)arxiv\.org$/i, name: "arXiv" },
  { match: /(^|\.)chemrxiv\.org$/i, name: "ChemRxiv" },
  { match: /(^|\.)researchsquare\.com$/i, name: "Research Square" },
  { match: /(^|\.)ssrn\.com$/i, name: "SSRN" },
  { match: /(^|\.)psyarxiv\.com$/i, name: "PsyArXiv" },
  { match: /(^|\.)eartharxiv\.org$/i, name: "EarthArXiv" },
  { match: /(^|\.)authorea\.com$/i, name: "Authorea" },
  { match: /(^|\.)preprints\.org$/i, name: "Preprints.org" },
  { match: /osf\.io\/preprints/i, name: "OSF Preprints" },
];

// Preprint server DOI prefixes. Useful when the URL is a generic doi.org link
// but the DOI itself identifies the server.
export const PREPRINT_DOI_PREFIXES = [
  { prefix: "10.1101/", name: "bioRxiv/medRxiv" },
  { prefix: "10.21203/", name: "Research Square" },
  { prefix: "10.26434/", name: "ChemRxiv" },
  { prefix: "10.48550/", name: "arXiv" },
  { prefix: "10.2139/", name: "SSRN" },
  { prefix: "10.31234/", name: "PsyArXiv" },
  { prefix: "10.31223/", name: "EarthArXiv" },
  { prefix: "10.20944/", name: "Preprints.org" },
  { prefix: "10.31219/", name: "OSF Preprints" },
  { prefix: "10.22541/", name: "Authorea" },
];

export function classifyHost(url) {
  if (!url) return null;
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  for (const h of PREPRINT_HOSTS) {
    if (h.match.test(host) || h.match.test(url)) return h.name;
  }
  // Fall back to DOI prefix when the URL is a doi.org redirect.
  if (/(^|\.)doi\.org$/i.test(host)) {
    const doi = url.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
    return classifyDoi(doi);
  }
  return null;
}

export function classifyDoi(doi) {
  if (!doi) return null;
  const lower = String(doi).toLowerCase();
  for (const p of PREPRINT_DOI_PREFIXES) {
    if (lower.startsWith(p.prefix)) return p.name;
  }
  return null;
}

export function isPreprintUrl(url) {
  return classifyHost(url) !== null;
}
