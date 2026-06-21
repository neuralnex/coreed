"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ErrorBlob({ error }: { error: string | null }) {
  const [open, setOpen] = useState(false);

  if (!error) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {open ? (
        <div className="w-80 rounded-xl border border-yellow-500/20 bg-yellow-500/10 backdrop-blur-xl p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-yellow-400 text-sm mb-1">
                Configuration Required
              </p>
              <p className="font-mono text-xs text-yellow-300/70 leading-relaxed break-words">
                {error}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-yellow-400/50 hover:text-yellow-400 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center hover:bg-yellow-500/20 transition-all hover:scale-105"
        >
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
        </button>
      )}
    </div>
  );
}
