const DEFAULTS = {
  email: "find.the.preprint@gmail.com",
  bannerEnabled: true,
};

function setStatus(msg) {
  const s = document.getElementById("status");
  s.textContent = msg;
  setTimeout(() => { s.textContent = ""; }, 1500);
}

async function load() {
  const o = await chrome.storage.sync.get(DEFAULTS);
  document.getElementById("email").value = o.email || "";
  document.getElementById("banner").checked = !!o.bannerEnabled;
}

async function save() {
  const email = document.getElementById("email").value.trim();
  const bannerEnabled = document.getElementById("banner").checked;
  await chrome.storage.sync.set({ email, bannerEnabled });
  setStatus("Saved");
}

async function clearCache() {
  await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "clear-cache" }, () => resolve());
  });
  setStatus("Cache cleared");
}

async function resetDismissed() {
  await chrome.storage.sync.set({ dismissed: {} });
  setStatus("Dismissed sites reset");
}

document.getElementById("save").addEventListener("click", save);
document.getElementById("clear-cache").addEventListener("click", clearCache);
document.getElementById("reset-dismissed").addEventListener("click", resetDismissed);
load();
