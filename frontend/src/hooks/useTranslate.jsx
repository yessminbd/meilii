import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getActiveLang,
  setActiveLang,
  toggleActiveLang,
  onLanguageChange,
  translateText,
  getCachedTranslation,
} from '../services/translateService';

/**
 * Hook personnalisé pour traduire du texte dynamiquement sans dépendre de LangContext
 * @returns {object} { lang, setLang, toggleLang, t, translateAsync }
 */
export function useTranslate() {
  const [lang, setLangState] = useState(() => getActiveLang());
  const [, setTick] = useState(0);

  useEffect(() => {
    // S'abonner aux changements de langue émis par translateService
    const unsubscribe = onLanguageChange((newLang) => {
      setLangState(newLang);
    });
    return unsubscribe;
  }, []);

  const triggerUpdate = useCallback(() => {
    setTick((prev) => prev + 1);
  }, []);

  /**
   * Fonction dynamique t(text, fallback):
   * - Retourne la traduction depuis le cache si disponible
   * - Sinon lance la traduction en arrière-plan via l'API gratuite et actualise le composant
   */
  const t = useMemo(() => {
    return (text, fallback = null) => {
      if (!text || typeof text !== 'string') return fallback || text || '';
      const clean = text.trim();
      if (!clean) return fallback || text;

      const cached = getCachedTranslation(clean, lang);
      if (cached) return cached;

      // Déclencher la traduction asynchrone
      translateText(clean, lang)
        .then((translated) => {
          if (translated && translated !== clean) {
            triggerUpdate();
          }
        })
        .catch(() => {});

      return fallback || text;
    };
  }, [lang, triggerUpdate]);

  const translateAsync = useCallback(
    (text, targetLang = lang) => {
      return translateText(text, targetLang);
    },
    [lang]
  );

  return {
    lang,
    setLang: setActiveLang,
    toggleLang: toggleActiveLang,
    t,
    translateAsync,
  };
}

/**
 * Composant React dynamique pour traduire n'importe quel texte ou élément JSX
 * Exemple: <Translate text={product.description} />
 * Exemple: <Translate text="Livraison garantie partout en Tunisie" as="p" className="text-sm text-gray-500" />
 */
export function Translate({
  text,
  children,
  as: Component = 'span',
  className = '',
  fallback = null,
  ...props
}) {
  const content = text || (typeof children === 'string' ? children : '');
  const { lang } = useTranslate();
  const [translated, setTranslated] = useState(() => {
    if (!content) return '';
    return getCachedTranslation(content, lang) || content;
  });

  useEffect(() => {
    let isMounted = true;
    if (!content || typeof content !== 'string') {
      setTranslated('');
      return;
    }

    const cached = getCachedTranslation(content, lang);
    if (cached) {
      setTranslated(cached);
      return;
    }

    // Traduction dynamique via l'API
    translateText(content, lang).then((result) => {
      if (isMounted && result) {
        setTranslated(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [content, lang]);

  if (!content) return null;

  return (
    <Component className={className} {...props}>
      {translated || fallback || content}
    </Component>
  );
}

export default useTranslate;
