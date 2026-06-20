"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = "coreed_theme";

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored) return stored;
  
  // Check system preference
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  const [isDark, setIsDark] = useState<boolean>(false);

  // Update isDark whenever theme or system preference changes
  useEffect(() => {
    const updateDarkMode = () => {
      if (theme === "system") {
        setIsDark(getSystemTheme() === "dark");
      } else {
        setIsDark(theme === "dark");
      }
    };

    updateDarkMode();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        updateDarkMode();
      }
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  // Persist theme to localStorage
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
    setTheme(newTheme);
  };

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export { ThemeContext };
