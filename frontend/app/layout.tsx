import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/contexts/WalletContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { Navbar } from "@/components/Navbar";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coreed — AI Agent Launchpad on 0G",
  description:
    "Upload models to 0G Storage, mint Agentic IDs on-chain, and deploy live agent spaces in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${manrope.variable} ${jetbrainsMono.variable} min-h-full flex flex-col bg-black text-white antialiased font-sans`}>
        <ThemeProvider>
          <WalletProvider>
            <Navbar />
            <main className="flex-grow">{children}</main>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
