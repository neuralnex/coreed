"use client";

import { useEffect, useRef, useState } from "react";

const HEX_CHARS = "0123456789abcdef";

function randomHex(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
  }
  return out;
}

interface ResolvingHashProps {
  value: string | null | undefined;
  pending: boolean;
  className?: string;
}

export function ResolvingHash({ value, pending, className = "" }: ResolvingHashProps) {
  const [display, setDisplay] = useState<string>(() => "0x" + randomHex(64));
  const [justResolved, setJustResolved] = useState(false);
  const wasPending = useRef(pending);

  useEffect(() => {
    if (!pending || value) return;
    const interval = setInterval(() => {
      setDisplay("0x" + randomHex(64));
    }, 65);
    return () => clearInterval(interval);
  }, [pending, value]);

  useEffect(() => {
    if (value) {
      setDisplay(value);
      if (wasPending.current) {
        setJustResolved(true);
        const t = setTimeout(() => setJustResolved(false), 300);
        return () => clearTimeout(t);
      }
    }
    wasPending.current = pending;
  }, [value, pending]);

  const truncated = value
    ? `${value.slice(0, 18)}…${value.slice(-12)}`
    : `${display.slice(0, 18)}…${display.slice(-12)}`;

  return (
    <span
      className={`font-mono tabular-nums tracking-tight ${
        value ? "text-coreed-moss-bright" : "text-coreed-sage coreed-pulse"
      } ${justResolved ? "coreed-resolve" : ""} ${className}`}
      aria-live="polite"
      aria-label={value ? `Resolved root hash ${value}` : "Computing root hash"}
    >
      {truncated}
    </span>
  );
}
