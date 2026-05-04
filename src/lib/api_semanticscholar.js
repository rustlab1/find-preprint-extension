// Semantic Scholar. externalIds sometimes contains an ArXiv id even when
// Crossref/Unpaywall don't surface it.
// Docs: https://api.semanticscholar.org/api-docs/

export async function lookupSemanticScholar(doi) {
  if (!doi) return null;
  const url = `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=externalIds,openAccessPdf,title`;
  let res;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = await res.json();

  const preprints = [];
  const ids = data.externalIds || {};
  if (ids.ArXiv) {
    preprints.push({
      url: `https://arxiv.org/abs/${ids.ArXiv}`,
      server: "arXiv",
      version: null,
      doi: null,
    });
  }
  return { preprints };
}
