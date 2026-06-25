"use client";

import { createContext, useContext, ReactNode, useState } from "react";
import { useWallet, WalletState } from "../hooks/useWallet";

interface WalletContextType extends WalletState {
  connect: (walletId?: string) => Promise<void>;
  connectPrivy: (email: string, address: string, walletId: string) => void;
  disconnect: () => void;
  hasWallet: boolean;
  showWalletModal: boolean;
  setShowWalletModal: (show: boolean) => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const wallet = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  return (
    <WalletContext.Provider value={{ ...wallet, showWalletModal, setShowWalletModal }}>
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