// Simple IndexedDB cache for DOI lookup results.
// Key: DOI string. Value: { result, ts }. TTL: 30 days.

const DB_NAME = "find-preprint-cache";
const STORE = "lookups";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheGet(doi) {
  if (!doi) return null;
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(doi);
    req.onsuccess = () => {
      const v = req.result;
      if (!v) return resolve(null);
      if (Date.now() - v.ts > TTL_MS) return resolve(null);
      resolve(v.result);
    };
    req.onerror = () => resolve(null);
  });
}

export async function cacheSet(doi, result) {
  if (!doi) return;
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ result, ts: Date.now() }, doi);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function cacheClear() {
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}
