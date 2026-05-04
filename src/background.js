// Service worker. Receives lookup requests from content scripts, runs the
// API chain, caches the result, sets the action badge, and stores the
// per-tab result for the popup to read.

import { cacheGet, cacheSet, cacheClear } from "./lib/cache.js";
import { lookupUnpaywall } from "./lib/api_unpaywall.js";
import { lookupCrossref } from "./lib/api_crossref.js";
import { lookupBiorxiv } from "./lib/api_biorxiv.js";
import { lookupEuropePmc } from "./lib/api_europepmc.js";
import { lookupSemanticScholar } from "./lib/api_semanticscholar.js";
import { lookupTitleSearch } from "./lib/api_titlesearch.js";
import { classifyHost } from "./lib/preprint_hosts.js";

const DEFAULT_EMAIL = "find.the.preprint@gmail.com";

async function getOptions() {
  const o = await chrome.storage.sync.get({
    email: DEFAULT_EMAIL,
    bannerEnabled: true,
  });
  return o;
}

// Per-tab cache of latest lookup result. Stored in chrome.storage.session so
// it survives service worker eviction (the worker idles out aggressively in
// MV3). Keyed by tabId.
const TAB_RESULT_PREFIX = "tab:";

async function setTabResult(tabId, value) {
  if (tabId == null) return;
  await chrome.storage.session.set({ [TAB_RESULT_PREFIX + tabId]: value });
}
async function getTabResult(tabId) {
  if (tabId == null) return null;
  const key = TAB_RESULT_PREFIX + tabId;
  const obj = await chrome.storage.session.get(key);
  return obj[key] || null;
}
async function clearTabResult(tabId) {
  if (tabId == null) return;
  await chrome.storage.session.remove(TAB_RESULT_PREFIX + tabId);
}

function setBadge(tabId, result) {
  if (!tabId) return;
  let text = "";
  let color = "#888888";
  if (!result) {
    text = "";
  } else if (result.preprint) {
    // Paywalled but preprint found: blue PP. (If OA AND a preprint,
    // OA is the more useful headline, show OA.)
    if (result.oa) {
      text = "OA";
      color = "#2e7d32";
    } else {
      text = "PP";
      color = "#1565c0";
    }
  } else if (result.oa) {
    text = "OA";
    color = "#2e7d32";
  } else if (result.doi) {
    // Paywalled, no preprint found.
    text = "🔒"; // 🔒
    color = "#c62828";
  }
  chrome.action.setBadgeBackgroundColor({ color, tabId });
  chrome.action.setBadgeText({ text, tabId });
}

function pickPreprint(...sources) {
  // Prefer the first non-empty source. Within a source, take the first item.
  for (const list of sources) {
    if (list && list.length) {
      const p = list[0];
      // Drop entries we can't classify as a known preprint host unless they
      // came from a strong source (Crossref relation, bioRxiv API direct).
      if (p.server || classifyHost(p.url)) {
        return p;
      }
    }
  }
  return null;
}

async function runChain(article) {
  const { doi, title, authors } = article;
  const opts = await getOptions();

  // Cache check.
  if (doi) {
    const cached = await cacheGet(doi);
    if (cached) return { ...cached, fromCache: true };
  }

  const result = {
    doi: doi || null,
    title: title || null,
    oa: false,
    oaStatus: "unknown",
    bestOaUrl: null,
    preprint: null,
    sources: [],
  };

  if (!doi && !title) {
    return result;
  }

  // 1. Unpaywall (also gives OA status).
  let unpaywallPreprints = [];
  if (doi) {
    const up = await lookupUnpaywall(doi, opts.email);
    if (up) {
      result.oa = up.oa;
      result.oaStatus = up.oaStatus;
      result.bestOaUrl = up.bestOaUrl;
      unpaywallPreprints = up.preprints || [];
      result.sources.push("unpaywall");
    }
  }

  // 2. Crossref relation (authoritative when present). Also gates on type.
  let crossrefPreprints = [];
  if (doi) {
    const cr = await lookupCrossref(doi);
    if (cr) {
      result.sources.push("crossref");
      // Skip non-articles (editorials, news pieces sometimes have DOIs).
      if (cr.type && !/article|chapter|paper|proceedings/i.test(cr.type)) {
        // Still allow if Unpaywall already said OA, but skip preprint search.
      } else {
        crossrefPreprints = cr.preprints || [];
      }
      if (!result.title) result.title = cr.title;
    }
  }

  // 3. bioRxiv / medRxiv direct lookup.
  let biorxivPreprint = null;
  if (doi) {
    biorxivPreprint = await lookupBiorxiv(doi);
    if (biorxivPreprint) result.sources.push("biorxiv");
  }

  // 4. Europe PMC.
  let europePmcPreprints = [];
  if (doi) {
    const ep = await lookupEuropePmc(doi);
    if (ep) {
      europePmcPreprints = ep.preprints || [];
      result.sources.push("europepmc");
    }
  }

  // 5. Semantic Scholar.
  let s2Preprints = [];
  if (doi) {
    const s2 = await lookupSemanticScholar(doi);
    if (s2) {
      s2Preprints = s2.preprints || [];
      result.sources.push("semanticscholar");
    }
  }

  // Pick a preprint, in order of trust:
  //   1. bioRxiv/medRxiv direct API (highest confidence)
  //   2. Crossref relation (authoritative)
  //   3. Unpaywall preprint locations
  //   4. Europe PMC
  //   5. Semantic Scholar (arXiv)
  result.preprint = pickPreprint(
    biorxivPreprint ? [biorxivPreprint] : [],
    crossrefPreprints,
    unpaywallPreprints,
    europePmcPreprints,
    s2Preprints
  );

  // 6. Last resort: title fuzzy search (only if nothing found and we have title).
  if (!result.preprint && (result.title || title)) {
    const t = result.title || title;
    const a = (authors && authors[0]) || null;
    const ts = await lookupTitleSearch(t, a);
    if (ts) {
      result.preprint = ts;
      result.sources.push("titlesearch");
    }
  }

  if (doi) {
    await cacheSet(doi, result);
  }
  return result;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "lookup") {
    const tabId = sender.tab?.id;
    runChain(msg.article)
      .then(async (result) => {
        if (tabId != null) {
          await setTabResult(tabId, { result, url: sender.tab?.url || null });
          setBadge(tabId, result);
        }
        sendResponse({ ok: true, result });
      })
      .catch((err) => {
        sendResponse({ ok: false, error: String(err) });
      });
    return true; // async sendResponse
  }
  if (msg?.type === "popup-get-result") {
    getTabResult(msg.tabId).then((v) => sendResponse(v));
    return true;
  }
  if (msg?.type === "clear-cache") {
    cacheClear().then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => clearTabResult(tabId));
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "loading" && info.url) {
    clearTabResult(tabId);
    setBadge(tabId, null);
  }
});
