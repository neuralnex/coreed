"use client";

import { useState } from "react";
import { useTheme as useThemeContext } from "@/lib/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, isDark, setTheme } = useThemeContext();

  const themeIcons: Record<string, string> = {
    dark: "🌙",
    light: "☀️",
    system: "💻"
  };

  const themeLabels: Record<string, string> = {
    dark: "Dark",
    light: "Light",
    system: "System"
  };

  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 bg-coreed-panel-raised border border-coreed-line/30 rounded-md text-sm text-coreed-bone hover:border-coreed-moss transition-colors min-h-[40px] touch-manipulation active:scale-[0.98]"
        aria-label="Toggle theme"
      >
        <span>{themeIcons[theme] || themeIcons.system}</span>
        <span className="hidden md:inline">{themeLabels[theme] || themeLabels.system}</span>
        <span className="text-coreed-sage">∨</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-1 bg-coreed-panel border border-coreed-line/50 rounded-lg p-2 shadow-lg z-50 min-w-[150px]">
          <button
            onClick={() => {
              setTheme("light");
              setShowMenu(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${theme === "light" ? "bg-coreed-moss/20 text-coreed-bone" : "text-coreed-sage hover:bg-coreed-panel-raised"}`}
          >
            <span>☀️</span>
            <span>Light Mode</span>
          </button>
          <button
            onClick={() => {
              setTheme("dark");
              setShowMenu(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${theme === "dark" ? "bg-coreed-moss/20 text-coreed-bone" : "text-coreed-sage hover:bg-coreed-panel-raised"}`}
          >
            <span>🌙</span>
            <span>Dark Mode</span>
          </button>
          <button
            onClick={() => {
              setTheme("system");
              setShowMenu(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${theme === "system" ? "bg-coreed-moss/20 text-coreed-bone" : "text-coreed-sage hover:bg-coreed-panel-raised"}`}
          >
            <span>💻</span>
            <span>System</span>
          </button>
        </div>
      )}
    </div>
  );
}
