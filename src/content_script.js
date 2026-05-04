// Content script. Runs on every page; bails fast if the page isn't a
// scholarly article. When it finds a DOI, asks the background worker to
// run the lookup chain and optionally injects an in-page banner.

(async () => {
  // Quick gate: most pages aren't articles. The DOI extractor itself does a
  // fuller check, but a meta-tag presence check filters out the long tail
  // of non-article pages cheaply.
  const looksLikeArticle =
    document.querySelector('meta[name="citation_doi" i]') ||
    document.querySelector('meta[name="DC.Identifier" i]') ||
    document.querySelector('meta[name="prism.doi" i]') ||
    /\/doi\/|doi\.org\/|\/articles\//i.test(location.href) ||
    document.querySelector('script[type="application/ld+json"]');

  if (!looksLikeArticle) return;

  let extractor;
  try {
    extractor = await import(chrome.runtime.getURL("src/lib/doi_extractor.js"));
  } catch {
    return;
  }
  const article = extractor.extractArticle();
  if (!article) return;
  if (!article.doi && !article.title) return;

  let response;
  try {
    response = await chrome.runtime.sendMessage({ type: "lookup", article });
  } catch {
    return;
  }
  if (!response?.ok) return;
  const result = response.result;

  // Banner: only inject when the article is paywalled AND we found a preprint.
  if (!result?.preprint || result.oa) return;

  const opts = await chrome.storage.sync.get({ bannerEnabled: true, dismissed: {} });
  if (!opts.bannerEnabled) return;
  const dismissedKey = location.hostname;
  const dismissedAt = opts.dismissed?.[dismissedKey];
  if (dismissedAt && Date.now() - dismissedAt < 30 * 24 * 60 * 60 * 1000) return;

  injectBanner(result);
})();

function injectBanner(result) {
  if (document.getElementById("find-preprint-banner")) return;

  const cssHref = chrome.runtime.getURL("src/banner.css");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = cssHref;
  document.head.appendChild(link);

  const bar = document.createElement("div");
  bar.id = "find-preprint-banner";

  const label = document.createElement("span");
  label.className = "fpb-label";
  label.textContent = "Preprint available";

  const link2 = document.createElement("a");
  link2.href = result.preprint.url;
  link2.target = "_blank";
  link2.rel = "noopener noreferrer";
  link2.className = "fpb-link";
  link2.textContent = `Open on ${result.preprint.server}`;

  if (result.preprint.confidence === "likely") {
    const tag = document.createElement("span");
    tag.className = "fpb-tag";
    tag.textContent = "likely match";
    bar.appendChild(tag);
  }

  const close = document.createElement("button");
  close.className = "fpb-close";
  close.textContent = "×";
  close.title = "Hide for this site for 30 days";
  close.addEventListener("click", async () => {
    bar.remove();
    const { dismissed = {} } = await chrome.storage.sync.get({ dismissed: {} });
    dismissed[location.hostname] = Date.now();
    await chrome.storage.sync.set({ dismissed });
  });

  bar.appendChild(label);
  bar.appendChild(link2);
  bar.appendChild(close);
  document.documentElement.appendChild(bar);
}
