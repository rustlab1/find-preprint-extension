// bioRxiv / medRxiv API. The /pubs endpoint maps a published DOI back to its
// preprint, which is exactly what we need.
// Docs: https://api.biorxiv.org/

const SERVERS = ["biorxiv", "medrxiv"];

async function lookupOnServer(server, publishedDoi) {
  const url = `https://api.biorxiv.org/pubs/${server}/${encodeURIComponent(publishedDoi)}/na/json`;
  let res;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json();
  const collection = data.collection || [];
  if (!collection.length) return null;

  // Pick the latest entry (by preprint_date).
  collection.sort((a, b) =>
    String(b.preprint_date || "").localeCompare(String(a.preprint_date || ""))
  );
  const top = collection[0];
  const preprintDoi = top.preprint_doi || top.biorxiv_doi || null;
  if (!preprintDoi) return null;

  return {
    doi: String(preprintDoi).toLowerCase(),
    url: `https://www.${server}.org/content/${preprintDoi}v${top.preprint_version || 1}`,
    server: server === "biorxiv" ? "bioRxiv" : "medRxiv",
    version: top.preprint_version ? String(top.preprint_version) : null,
    date: top.preprint_date || null,
  };
}

export async function lookupBiorxiv(publishedDoi) {
  if (!publishedDoi) return null;
  for (const server of SERVERS) {
    const hit = await lookupOnServer(server, publishedDoi);
    if (hit) return hit;
  }
  return null;
}
