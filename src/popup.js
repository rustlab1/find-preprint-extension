async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getResultForTab(tabId) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "popup-get-result", tabId }, (res) => {
      resolve(res || null);
    });
  });
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}

function render(state) {
  const root = document.getElementById("root");
  root.innerHTML = "";

  if (state.error) {
    root.appendChild(el("div", { class: "empty" }, state.error));
    return;
  }
  if (!state.result) {
    root.appendChild(
      el(
        "div",
        { class: "empty" },
        "No article detected on this page. Open a journal article and try again."
      )
    );
    return;
  }

  const r = state.result;

  if (r.title) {
    root.appendChild(el("div", { class: "title" }, r.title));
  }
  if (r.doi) {
    root.appendChild(el("div", { class: "doi" }, `DOI: ${r.doi}`));
  }

  // Status row.
  const statusRow = el("div", { class: "row" });
  if (r.oa) {
    statusRow.appendChild(el("span", { class: "pill oa" }, "OPEN ACCESS"));
  } else if (r.doi) {
    statusRow.appendChild(el("span", { class: "pill paywall" }, "PAYWALLED"));
  }
  if (r.preprint) {
    statusRow.appendChild(el("span", { class: "pill preprint" }, "PREPRINT FOUND"));
    if (r.preprint.confidence === "likely") {
      statusRow.appendChild(el("span", { class: "pill likely" }, "LIKELY MATCH"));
    }
  }
  root.appendChild(statusRow);

  // Main result section. Adapt the framing to the situation:
  //   - OA: lead with "open access", preprint is bonus info if present.
  //   - paywalled + preprint: lead with the preprint.
  //   - paywalled + no preprint: explain what we tried.
  const sec = el("div", { class: "section" });

  if (r.oa && !r.preprint) {
    sec.appendChild(el("h3", {}, "Open access"));
    sec.appendChild(
      el("div", { class: "empty" },
        "This article is open access, so a preprint is not needed.")
    );
    if (r.bestOaUrl) {
      sec.appendChild(
        el("div", { class: "row" },
          el("a", {
            class: "btn",
            href: r.bestOaUrl,
            target: "_blank",
            rel: "noopener noreferrer",
          }, "Open free version")
        )
      );
    }
  } else if (r.preprint) {
    sec.appendChild(el("h3", {}, r.oa ? "Preprint (bonus)" : "Preprint"));
    const meta = [r.preprint.server];
    if (r.preprint.version) meta.push(`v${r.preprint.version}`);
    if (r.preprint.date) meta.push(r.preprint.date);
    sec.appendChild(el("div", {}, meta.join(" · ")));
    sec.appendChild(
      el("div", { class: "row" },
        el("a", {
          class: "btn",
          href: r.preprint.url,
          target: "_blank",
          rel: "noopener noreferrer",
        }, "Open preprint"),
        el("button", {
          class: "btn secondary",
          onclick: () => navigator.clipboard.writeText(r.preprint.url),
        }, "Copy link"),
        r.preprint.doi
          ? el("button", {
              class: "btn secondary",
              onclick: () => navigator.clipboard.writeText(r.preprint.doi),
            }, "Copy DOI")
          : null
      )
    );
  } else if (r.bestOaUrl) {
    sec.appendChild(el("h3", {}, "Free version"));
    sec.appendChild(el("div", { class: "empty" },
      "No preprint found, but a free version is available."));
    sec.appendChild(
      el("div", { class: "row" },
        el("a", {
          class: "btn",
          href: r.bestOaUrl,
          target: "_blank",
          rel: "noopener noreferrer",
        }, "Open free version")
      )
    );
  } else {
    sec.appendChild(el("h3", {}, "No preprint found"));
    const sources = (r.sources || []).length
      ? `Checked ${(r.sources || []).join(", ")}.`
      : "No metadata sources responded.";
    sec.appendChild(el("div", { class: "empty" }, sources));
  }
  root.appendChild(sec);

  // Footer.
  const sources = (r.sources || []).join(", ");
  root.appendChild(
    el(
      "div",
      { class: "footer" },
      sources ? `Sources: ${sources}` : "",
      el("br"),
      el("a", { href: "#", onclick: (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); } }, "Settings")
    )
  );
}

(async () => {
  try {
    const tab = await getActiveTab();
    if (!tab) {
      render({ error: "No active tab." });
      return;
    }
    const res = await getResultForTab(tab.id);
    if (!res) {
      render({ result: null });
      return;
    }
    render({ result: res.result });
  } catch (e) {
    render({ error: String(e) });
  }
})();
