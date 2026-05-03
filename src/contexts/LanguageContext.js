"use client";
import { createContext, useContext, useState, useEffect, useCallback, useMemo, Fragment } from "react";

const LanguageContext = createContext({
    t: (key) => key,
    language: 'en',
    locale: 'en-US',
    changeLanguage: () => { },
    supportedLangs: {},
    loading: false
});

function getCachedTranslations(lang) {
    try {
        const raw = localStorage.getItem(`translations_${lang}`);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');
    const [translations, setTranslations] = useState({});
    const [supportedLangs, setSupportedLangs] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedLang = localStorage.getItem('language') || 'en';
        const cached = getCachedTranslations(savedLang);
        const cachedEn = getCachedTranslations('en');
        if (Object.keys(cached).length > 0) {
            setTranslations(cached);
            setLoading(false);
        }
        if (Object.keys(cachedEn).length > 0) setEnTranslations(cachedEn);
        setLanguage(savedLang);
    }, []);


    useEffect(() => {
        fetch("/api/supported")
            .then((res) => {
                if (!res.ok) throw new Error(`supported: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                setSupportedLangs(data);
                const savedLang = localStorage.getItem("language");
                if (savedLang && data[savedLang]) {
                    setLanguage(savedLang);
                } else {
                    const browserLang = navigator.language.split("-")[0];
                    if (data[browserLang]) {
                        setLanguage(browserLang);
                    }
                }
            })
            .catch((err) => console.error("Failed to load supported languages:", err));
    }, []);


    useEffect(() => {
        let stale = false;
        setLoading(true);
        fetch(`/api/languages/${language}`)
            .then((res) => res.json())
            .then((data) => {
                if (stale) return;
                setTranslations(data);
                localStorage.setItem("language", language);
                try { localStorage.setItem(`translations_${language}`, JSON.stringify(data)); } catch {}
            })
            .catch((err) => {
                if (stale) return;
                console.error(`Failed to load translations for ${language}:`, err);
            })
            .finally(() => { if (!stale) setLoading(false); });
        return () => { stale = true; };
    }, [language]);

    const changeLanguage = useCallback((langCode) => {
        if (!langCode) return;
        setLanguage(langCode);
        localStorage.setItem('language', langCode);
    }, []);

    const [enTranslations, setEnTranslations] = useState({});

    useEffect(() => {
        if (language !== 'en') {
            let stale = false;
            fetch(`/api/languages/en`)
                .then(res => res.json())
                .then(data => {
                    if (stale) return;
                    setEnTranslations(data);
                    try { localStorage.setItem('translations_en', JSON.stringify(data)); } catch {}
                })
                .catch(err => { if (!stale) console.error("Failed to load English fallback:", err); });
            return () => { stale = true; };
        }
    }, [language]);

    const t = useCallback((key, params = {}) => {
        let defaultValue = key;
        let actualParams = params;

        if (typeof params === 'string') {
            defaultValue = params;
            actualParams = {};
        }

        const keys = key.split(".");
        let value = translations;
        for (const k of keys) {
            value = value?.[k];
        }

        if (value === undefined && language !== 'en') {
            let enValue = enTranslations;
            for (const k of keys) {
                enValue = enValue?.[k];
            }
            if (enValue !== undefined) {
                value = enValue;
            }
        }

        if (value === undefined) return defaultValue;

        if (typeof value === 'string') {
            return value.replace(/\{(\w+)\}/g, (_, k) => {
                return actualParams[k] !== undefined ? actualParams[k] : `{${k}}`;
            });
        }

        return value;
    }, [translations, enTranslations, language]);

    const tReact = useCallback((key, elements = {}) => {
        const raw = t(key);
        return raw.split(/(\{\d+\})/g).map((part, i) => {
            const m = part.match(/^\{(\d+)\}$/);
            if (m && elements[m[1]] !== undefined) return <Fragment key={i}>{elements[m[1]]}</Fragment>;
            return part || null;
        }).filter(Boolean);
    }, [t]);

    const locale = supportedLangs[language]?.locale || 'en-US';

    const contextValue = useMemo(() => ({
        language, locale, changeLanguage, t, tReact, supportedLangs, loading
    }), [language, locale, changeLanguage, t, tReact, supportedLangs, loading]);

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
