import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { translations } from "../constants/translations";
import {
  getActiveLang,
  setActiveLang,
  toggleActiveLang,
  onLanguageChange,
  translateText,
  getCachedTranslation,
} from "../services/translateService";

export { translations };

export const LangContext = createContext();

export default function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => getActiveLang());
  const [, setTick] = useState(0);

  useEffect(() => {
    // S'abonner aux changements de langue émis par le service de traduction
    const unsubscribe = onLanguageChange((newLang) => {
      setLangState(newLang);
    });
    return unsubscribe;
  }, []);

  const triggerUpdate = useCallback(() => {
    setTick((prev) => prev + 1);
  }, []);

  const setLang = useCallback((newLang) => {
    setActiveLang(newLang);
  }, []);

  const toggleLang = useCallback(() => {
    toggleActiveLang();
  }, []);

  const translate = useCallback(
    (text, targetLang = lang) => {
      return translateText(text, targetLang);
    },
    [lang]
  );

  /**
   * Objet/Fonction "t" intelligent :
   * 1. Utilisable comme fonction : t("Texte dynamique à traduire", "fallback")
   * 2. Utilisable comme objet : t.collection, t.cart, t.searchPlaceholder, etc.
   * 3. Supporte les fonctions comme t.itemsInCart(3)
   */
  const t = useMemo(() => {
    const currentDict = translations[lang] || translations.fr || {};

    const fn = (text, fallback = null) => {
      if (!text || typeof text !== "string") return fallback || text || "";
      const clean = text.trim();
      if (!clean) return fallback || text;

      // 1. Si le texte correspond exactement à une clé du dictionnaire de base
      if (currentDict[clean]) {
        return currentDict[clean];
      }

      // 2. Vérifier si la traduction est dans le cache dynamique
      const cached = getCachedTranslation(clean, lang);
      if (cached) {
        return cached;
      }

      // 3. Déclencher la traduction dynamique via l'API gratuite en arrière-plan
      translateText(clean, lang)
        .then((result) => {
          if (result && result !== clean) {
            triggerUpdate();
          }
        })
        .catch(() => {});

      // En attendant la réponse de l'API, afficher le fallback ou le texte original
      return fallback || text;
    };

    return new Proxy(fn, {
      get(target, prop, receiver) {
        if (
          typeof prop === "symbol" ||
          prop === "then" ||
          prop === "prototype" ||
          prop === "length" ||
          prop === "name"
        ) {
          return Reflect.get(target, prop, receiver);
        }

        // Si la propriété existe dans le dictionnaire statique de base
        if (prop in currentDict) {
          return currentDict[prop];
        }

        // Sinon, traduction dynamique de la clé ou de la chaîne
        return target(prop);
      },
    });
  }, [lang, triggerUpdate]);

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, translate, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => {
  const context = useContext(LangContext);
  if (!context) {
    // Si utilisé en dehors de LangProvider, fallback gracieux autonome
    const currentLang = getActiveLang();
    const currentDict = translations[currentLang] || translations.fr || {};
    return {
      lang: currentLang,
      setLang: setActiveLang,
      toggleLang: toggleActiveLang,
      translate: (text) => translateText(text, currentLang),
      t: (text) => currentDict[text] || getCachedTranslation(text, currentLang) || text,
    };
  }
  return context;
};