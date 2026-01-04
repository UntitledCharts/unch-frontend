"use client";
import { createContext, useContext, useState, useEffect } from "react";

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

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.body.classList.toggle("light-mode", newTheme === "light");
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
