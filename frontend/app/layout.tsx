import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";
import { WalletProvider } from "@/lib/contexts/WalletContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Coreed — Agent Launchpad on 0G",
  description:
    "Route agent payloads through 0G Storage. Mint the receipt on-chain.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-coreed-void text-coreed-bone antialiased">
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
