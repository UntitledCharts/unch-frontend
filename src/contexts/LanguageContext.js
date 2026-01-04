"use client";
import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState("en");
    const [translations, setTranslations] = useState({});
    const [supportedLangs, setSupportedLangs] = useState({});
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        fetch("/api/supported")
            .then((res) => res.json())
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
        setLoading(true);
        fetch(`/api/languages/${language}`)
            .then((res) => res.json())
            .then((data) => {
                setTranslations(data);
                localStorage.setItem("language", language);
                setLoading(false);
            })
            .catch((err) => {
                console.error(`Failed to load translations for ${language}:`, err);
                setLoading(false);
            });
    }, [language]);

    const changeLanguage = (langCode) => {
        if (supportedLangs[langCode]) {
            setLanguage(langCode);
        }
    };


    // For a robust fallback, we should ideally have English translations loaded
    const [enTranslations, setEnTranslations] = useState({});

    useEffect(() => {
        if (language !== 'en') {
            fetch(`/api/languages/en`)
                .then(res => res.json())
                .then(data => setEnTranslations(data))
                .catch(err => console.error("Failed to load English fallback:", err));
        }
    }, [language]);

    const t = (key, params = {}) => {
        let defaultValue = key; // Default return is key
        let actualParams = params;

        // Support optional default value as 2nd argument
        if (typeof params === 'string') {
            defaultValue = params;
            actualParams = {};
        }

        const keys = key.split(".");
        let value = translations;
        for (const k of keys) {
            value = value?.[k];
        }

        // Fallback to English if not found
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
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t, supportedLangs, loading }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
