/**
 * translateService.js
 * Service de traduction dynamique gratuit et résilient.
 * Moteur 1 : Google Translate Clients5 (Gratuit, rapide, CORS *)
 * Moteur 2 : Google Translate GTX
 * Moteur 3 : MyMemory Translation API (Fallback)
 * Cache local persistant en mémoire et localStorage.
 */

const STORAGE_LANG_KEY = 'sw_lang';
const CACHE_STORAGE_KEY = 'sw_trans_cache_v2';
const DEFAULT_LANG = 'fr';

const isBrowser = typeof window !== 'undefined';
const hasLocalStorage = typeof localStorage !== 'undefined';

// Cache en mémoire initialisé depuis le localStorage
let memoryCache = new Map();
if (hasLocalStorage) {
  try {
    const saved = localStorage.getItem(CACHE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.entries(parsed).forEach(([key, val]) => memoryCache.set(key, val));
    }
  } catch (e) {
    console.warn('[translateService] Erreur lecture cache localStorage:', e);
  }
}

// Sauvegarde debouncée du cache dans localStorage
let saveTimeout = null;
function persistCacheDebounced() {
  if (!hasLocalStorage) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const entries = Array.from(memoryCache.entries());
      const trimmed = entries.slice(-2500);
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(Object.fromEntries(trimmed)));
    } catch (e) {
      console.warn('[translateService] Erreur écriture cache localStorage:', e);
    }
  }, 1000);
}

// Map des requêtes réseau en cours pour éviter les appels multiples simultanés
const inFlightRequests = new Map();

/**
 * Récupère la langue active courante ('fr', 'en', etc.)
 */
export function getActiveLang() {
  if (hasLocalStorage) {
    try {
      return localStorage.getItem(STORAGE_LANG_KEY) || DEFAULT_LANG;
    } catch {
      return DEFAULT_LANG;
    }
  }
  return DEFAULT_LANG;
}

/**
 * Définit la langue active et notifie tous les écouteurs de l'application
 */
export function setActiveLang(newLang) {
  if (!newLang || typeof newLang !== 'string') return;
  const target = newLang.toLowerCase();
  if (hasLocalStorage) {
    try {
      localStorage.setItem(STORAGE_LANG_KEY, target);
    } catch (e) {
      console.warn('[translateService] Impossible de stocker la langue:', e);
    }
  }
  if (isBrowser) {
    window.dispatchEvent(new CustomEvent('sw:lang_change', { detail: target }));
  }
}

/**
 * Alterne entre 'fr' et 'en'
 */
export function toggleActiveLang() {
  const current = getActiveLang();
  const next = current === 'en' ? 'fr' : 'en';
  setActiveLang(next);
  return next;
}

/**
 * Permet de s'abonner aux changements de langue
 * @param {Function} callback (newLang) => void
 * @returns {Function} unsubscribe
 */
export function onLanguageChange(callback) {
  if (!isBrowser || typeof callback !== 'function') return () => {};
  const handler = (e) => callback(e.detail);
  window.addEventListener('sw:lang_change', handler);
  return () => window.removeEventListener('sw:lang_change', handler);
}

/**
 * Génère la clé de cache
 */
function makeCacheKey(text, targetLang) {
  return `${targetLang.toLowerCase()}:${text.trim().toLowerCase()}`;
}

/**
 * Vérifie si une traduction existe déjà dans le cache
 */
export function getCachedTranslation(text, targetLang = getActiveLang()) {
  if (!text || typeof text !== 'string') return text;
  const clean = text.trim();
  if (!clean) return text;
  const key = makeCacheKey(clean, targetLang);
  return memoryCache.get(key) || null;
}

/**
 * Moteur 1 : Google Clients5 (Très rapide, CORS ouvert, autodetect)
 */
async function fetchGoogleClients5(text, targetLang, sourceLang = 'auto') {
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(
    sourceLang
  )}&tl=${encodeURIComponent(targetLang)}&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Clients5 returned status ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data) && data[0]) {
    const item = data[0];
    const translated = Array.isArray(item) ? item[0] : item;
    if (typeof translated === 'string' && translated.trim()) {
      return translated.trim();
    }
  }
  throw new Error('Clients5 empty response');
}

/**
 * Moteur 2 : Google Translate GTX
 */
async function fetchGoogleGTX(text, targetLang, sourceLang = 'auto') {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
    sourceLang
  )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`GTX returned status ${res.status}`);
  const data = await res.json();
  if (data && Array.isArray(data[0])) {
    const translated = data[0].map((item) => item[0]).join('');
    if (translated) return translated.trim();
  }
  throw new Error('GTX empty response');
}

/**
 * Moteur 3 : MyMemory API (Fallback)
 */
async function fetchMyMemory(text, targetLang, sourceLang = 'auto') {
  const cleanTarget = targetLang.toLowerCase();
  let cleanSource = sourceLang === 'auto' ? (cleanTarget === 'en' ? 'fr' : 'en') : sourceLang;
  if (cleanSource === cleanTarget) {
    cleanSource = cleanTarget === 'en' ? 'fr' : 'en';
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${cleanSource}|${cleanTarget}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`MyMemory returned status ${res.status}`);
  const data = await res.json();
  if (data?.responseData?.translatedText) {
    const result = data.responseData.translatedText;
    if (!result.includes('PLEASE SELECT TWO DISTINCT LANGUAGES')) {
      return result.trim();
    }
  }
  throw new Error('MyMemory empty response');
}

/**
 * Traduit un texte de façon dynamique via l'API gratuite avec cache local
 * @param {string} text - Le texte à traduire
 * @param {string} targetLang - Langue cible (défaut: langue active courante)
 * @param {string} sourceLang - Langue source ('auto' par défaut)
 * @returns {Promise<string>}
 */
export async function translateText(text, targetLang = getActiveLang(), sourceLang = 'auto') {
  if (!text || typeof text !== 'string') return text;
  const clean = text.trim();
  if (!clean) return text;

  // Si c'est un pur nombre, symbole ou prix (ex: "120 DT")
  if (/^[\d\s.,\-+%/€$DT]+$/.test(clean)) {
    return text;
  }

  const cacheKey = makeCacheKey(clean, targetLang);

  // 1. Vérifier le cache en mémoire
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  // 2. Dédupliquer les requêtes en cours
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // 3. Exécuter l'appel avec cascade de secours
  const requestPromise = (async () => {
    try {
      let result = null;

      // Essayer Clients5 en priorité
      try {
        result = await fetchGoogleClients5(clean, targetLang, sourceLang);
      } catch (err1) {
        // Essayer GTX
        try {
          result = await fetchGoogleGTX(clean, targetLang, sourceLang);
        } catch (err2) {
          // Essayer MyMemory
          result = await fetchMyMemory(clean, targetLang, sourceLang);
        }
      }

      if (result) {
        memoryCache.set(cacheKey, result);
        persistCacheDebounced();
        return result;
      }
    } catch (err) {
      console.warn('[translateService] Tous les moteurs ont échoué pour:', clean, err.message);
    } finally {
      inFlightRequests.delete(cacheKey);
    }
    return text;
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Traduit une liste de textes en une seule requête optimisée (batch)
 * @param {string[]} texts - Tableau de textes
 * @param {string} targetLang - Langue cible
 * @param {string} sourceLang - Langue source
 * @returns {Promise<string[]>}
 */
export async function translateBatch(texts, targetLang = getActiveLang(), sourceLang = 'auto') {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const DELIMITER = ' ___DELIM___ ';
  const uncachedIndexes = [];
  const uncachedTexts = [];
  const results = new Array(texts.length);

  // Vérifier le cache pour chaque élément
  texts.forEach((txt, idx) => {
    if (!txt || typeof txt !== 'string' || !txt.trim()) {
      results[idx] = txt;
      return;
    }
    const cached = getCachedTranslation(txt, targetLang);
    if (cached) {
      results[idx] = cached;
    } else {
      uncachedIndexes.push(idx);
      uncachedTexts.push(txt.trim());
    }
  });

  if (uncachedTexts.length === 0) {
    return results;
  }

  // Effectuer la requête groupée
  try {
    const combined = uncachedTexts.join(DELIMITER);
    const translatedCombined = await translateText(combined, targetLang, sourceLang);
    const splitResults = translatedCombined.split(/ ___DELIM___ |___DELIM___/i).map((s) => s.trim());

    uncachedIndexes.forEach((origIdx, i) => {
      const translated = splitResults[i] || uncachedTexts[i];
      results[origIdx] = translated;
      const key = makeCacheKey(uncachedTexts[i], targetLang);
      memoryCache.set(key, translated);
    });

    persistCacheDebounced();
  } catch (err) {
    console.warn('[translateService] Batch translation failed:', err.message);
    uncachedIndexes.forEach((origIdx, i) => {
      results[origIdx] = uncachedTexts[i];
    });
  }

  return results;
}

/**
 * Vider le cache de traduction
 */
export function clearTranslationCache() {
  memoryCache.clear();
  if (hasLocalStorage) {
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (e) {
      console.warn('[translateService] Erreur clear cache:', e);
    }
  }
}
