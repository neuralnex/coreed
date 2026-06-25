"use client";

import { useState } from "react";
import { useWalletContext } from "@/lib/contexts/WalletContext";

interface WalletConnectorProps {
  onClose: () => void;
  onConnect: (walletId: string) => void;
}

// SVG Icons for social and wallet providers
const Icons = {
  google: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  ),
  github: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  ),
  apple: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
    </svg>
  ),
  discord: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
    </svg>
  ),
  metamask: "🦊",
  okx: "🔶",
  walletconnect: "🔗",
  coinbase: "💰",
};

export function WalletConnector({ onClose, onConnect }: WalletConnectorProps) {
  const { connect, connectPrivy } = useWalletContext();
  const [email, setEmail] = useState("");
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleWalletConnect = async (walletId: string) => {
    setIsConnecting(walletId);
    setError(null);
    try {
      await connect(walletId);
      onConnect(walletId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsConnecting(null);
    }
  };

  const handleSocialConnect = async (provider: string, mockValue?: string) => {
    setIsConnecting(provider);
    setError(null);
    try {
      const loginEmail = mockValue || `${provider}_user@coreed.app`;

      const response = await fetch('/api/auth/privy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, provider })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to authenticate via Privy');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Privy auth failed');
      }

      // Connect Privy session details using the real response
      connectPrivy(data.email, data.address, data.walletId);
      
      // Save to sessionStorage for any legacy components reading it
      if (typeof window !== "undefined") {
        sessionStorage.setItem("privy_email", data.email);
      }

      onConnect("privy");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsConnecting(null);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    handleSocialConnect("email", email);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[#0c0c0d] border border-white/10 rounded-2xl p-7 max-w-[400px] w-full shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white text-xl transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Privy Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-3">
            <span className="text-modal-green font-bold text-lg">C</span>
          </div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Log in to Coreed</h2>
          <p className="text-xs text-white/50 mt-1">Deploy and manage AI spaces on 0G Chain</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/20 border border-red-800/40 rounded-xl">
            <p className="text-red-400 text-xs text-center">{error}</p>
          </div>
        )}

        {/* Email Login Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-2 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-modal-green/50 transition-colors"
            disabled={isConnecting !== null}
          />
          <button
            type="submit"
            disabled={isConnecting !== null || !email}
            className="w-full py-2.5 bg-modal-green text-black font-semibold text-sm rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isConnecting === "email" ? "Logging in..." : "Continue"}
          </button>
        </form>

        {/* Social Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <button
            onClick={() => handleSocialConnect("google")}
            disabled={isConnecting !== null}
            className="flex justify-center items-center py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
            title="Google"
          >
            {Icons.google}
          </button>
          <button
            onClick={() => handleSocialConnect("github")}
            disabled={isConnecting !== null}
            className="flex justify-center items-center py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
            title="Github"
          >
            {Icons.github}
          </button>
          <button
            onClick={() => handleSocialConnect("apple")}
            disabled={isConnecting !== null}
            className="flex justify-center items-center py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
            title="Apple"
          >
            {Icons.apple}
          </button>
          <button
            onClick={() => handleSocialConnect("discord")}
            disabled={isConnecting !== null}
            className="flex justify-center items-center py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
            title="Discord"
          >
            {Icons.discord}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-[1px] bg-white/10"></div>
          <span className="text-[10px] uppercase font-semibold text-white/30 tracking-wider">or connect wallet</span>
          <div className="flex-1 h-[1px] bg-white/10"></div>
        </div>

        {/* Wallet connection list */}
        <div className="space-y-2">
          <button
            onClick={() => handleWalletConnect("metamask")}
            disabled={isConnecting !== null}
            className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{Icons.metamask}</span>
              <span className="text-sm font-medium text-white">MetaMask</span>
            </div>
            {isConnecting === "metamask" && <span className="text-xs text-modal-green">Connecting...</span>}
          </button>

          <button
            onClick={() => handleWalletConnect("okx")}
            disabled={isConnecting !== null}
            className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{Icons.okx}</span>
              <span className="text-sm font-medium text-white">OKX Wallet</span>
            </div>
            {isConnecting === "okx" && <span className="text-xs text-modal-green">Connecting...</span>}
          </button>

          <button
            onClick={() => handleWalletConnect("walletconnect")}
            disabled={isConnecting !== null}
            className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{Icons.walletconnect}</span>
              <span className="text-sm font-medium text-white">WalletConnect</span>
            </div>
            {isConnecting === "walletconnect" && <span className="text-xs text-modal-green">Connecting...</span>}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-7 pt-4 border-t border-white/5 flex justify-center items-center gap-1.5 text-[10px] text-white/30">
          <span>Protected by</span>
          <span className="font-semibold text-white/50 tracking-wider">PRIVY</span>
        </div>
      </div>
    </div>
  );
}
