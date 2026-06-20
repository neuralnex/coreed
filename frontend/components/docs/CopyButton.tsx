"use client";

import { useState } from "react";

export function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`ml-2 px-3 py-1 rounded text-xs font-medium transition-colors ${className} ${
        copied
          ? "bg-green-900/20 text-green-400 border border-green-700/30"
          : "bg-coreed-line/20 text-coreed-sage border border-coreed-line/40 hover:bg-coreed-line/30 hover:text-coreed-bone"
      }`}
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}
