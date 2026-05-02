"use client";
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            setTheme(savedTheme);
            document.body.classList.toggle("light-mode", savedTheme === "light");
            document.documentElement.setAttribute("data-theme", savedTheme);
        } else {
            document.body.classList.remove("light-mode");
            document.documentElement.setAttribute("data-theme", "dark");
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const newTheme = prev === "dark" ? "light" : "dark";
            localStorage.setItem("theme", newTheme);
            document.body.classList.toggle("light-mode", newTheme === "light");
            document.documentElement.setAttribute("data-theme", newTheme);
            return newTheme;
        });
    }, []);

    const contextValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
