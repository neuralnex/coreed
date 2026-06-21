"use client";

import { createContext, useContext, ReactNode } from "react";
import { useWallet, WalletState } from "../hooks/useWallet";

interface WalletContextType extends WalletState {
  connect: (walletId?: string) => Promise<void>;
  disconnect: () => void;
  hasWallet: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const wallet = useWallet();

  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
}

export { WalletContext };