"use client";

import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-coreed-moss-bright to-coreed-clay bg-clip-text text-transparent mb-4">
          Coreed Documentation
        </h1>
        <p className="text-lg text-coreed-sage">
          AI Agent Deployment Platform on 0G Chain
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* User Walkthrough Card */}
        <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-coreed-moss/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-coreed-bone">User Walkthrough</h2>
              <p className="text-coreed-sage mt-1">
                Step-by-step guides for using Coreed
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-coreed-sage/70 mb-4">
              Learn how to use Coreed to deploy AI agents on 0G Chain:
            </p>
            
            <div className="space-y-2">
              <Link
                href="/docs/getting-started"
                className="flex items-center gap-3 px-4 py-2 bg-coreed-panel hover:bg-coreed-line/10 border border-coreed-line/30 rounded-lg text-coreed-bone hover:text-coreed-moss-bright transition-colors group"
              >
                <span className="w-8 h-8 bg-coreed-moss/10 rounded flex items-center justify-center group-hover:bg-coreed-moss/20 transition-colors">
                  <span>🚀</span>
                </span>
                <span className="font-medium">Getting Started</span>
                <span className="text-coreed-sage text-sm">New to Coreed? Start here</span>
              </Link>

              <Link
                href="/docs/upload-model"
                className="flex items-center gap-3 px-4 py-2 bg-coreed-panel hover:bg-coreed-line/10 border border-coreed-line/30 rounded-lg text-coreed-bone hover:text-coreed-moss-bright transition-colors group"
              >
                <span className="w-8 h-8 bg-coreed-moss/10 rounded flex items-center justify-center group-hover:bg-coreed-moss/20 transition-colors">
                  <span>📦</span>
                </span>
                <span className="font-medium">Upload Model</span>
                <span className="text-coreed-sage text-sm">Store models on 0G</span>
              </Link>

              <Link
                href="/docs/deploy-space"
                className="flex items-center gap-3 px-4 py-2 bg-coreed-panel hover:bg-coreed-line/10 border border-coreed-line/30 rounded-lg text-coreed-bone hover:text-coreed-moss-bright transition-colors group"
              >
                <span className="w-8 h-8 bg-coreed-moss/10 rounded flex items-center justify-center group-hover:bg-coreed-moss/20 transition-colors">
                  <span>⛓️</span>
                </span>
                <span className="font-medium">Deploy Space</span>
                <span className="text-coreed-sage text-sm">Launch live AI agents</span>
              </Link>

              <Link
                href="/docs/manage-spaces"
                className="flex items-center gap-3 px-4 py-2 bg-coreed-panel hover:bg-coreed-line/10 border border-coreed-line/30 rounded-lg text-coreed-bone hover:text-coreed-moss-bright transition-colors group"
              >
                <span className="w-8 h-8 bg-coreed-moss/10 rounded flex items-center justify-center group-hover:bg-coreed-moss/20 transition-colors">
                  <span>🎛️</span>
                </span>
                <span className="font-medium">Manage Spaces</span>
                <span className="text-coreed-sage text-sm">Monitor and control deployments</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Developer Docs Card */}
        <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-coreed-moss/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💻</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-coreed-bone">Developer Documentation</h2>
              <p className="text-coreed-sage mt-1">
                CLI, SDK, and API references
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-coreed-sage/70 mb-4">
              Integrate Coreed into your applications:
            </p>
            
            <div className="space-y-2">
              <Link
                href="/docs/cli-overview"
                className="flex items-center gap-3 px-4 py-2 bg-coreed-panel hover:bg-coreed-line/10 border border-coreed-line/30 rounded-lg text-coreed-bone hover:text-coreed-moss-bright transition-colors group"
              >
                <span className="w-8 h-8 bg-coreed-moss/10 rounded flex items-center justify-center group-hover:bg-coreed-moss/20 transition-colors">
                  <span>💾</span>
                </span>
                <span className="font-medium">CLI Overview</span>
                <span className="text-coreed-sage text-sm">Command-line interface</span>
              </Link>

              <Link
                href="/docs/sdk-javascript"
                className="flex items-center gap-3 px-4 py-2 bg-coreed-panel hover:bg-coreed-line/10 border border-coreed-line/30 rounded-lg text-coreed-bone hover:text-coreed-moss-bright transition-colors group"
              >
                <span className="w-8 h-8 bg-coreed-moss/10 rounded flex items-center justify-center group-hover:bg-coreed-moss/20 transition-colors">
                  <span>📦</span>
                </span>
                <span className="font-medium">JavaScript SDK</span>
                <span className="text-coreed-sage text-sm">npm package</span>
              </Link>

              <Link
                href="/docs/sdk-python"
                className="flex items-center gap-3 px-4 py-2 bg-coreed-panel hover:bg-coreed-line/10 border border-coreed-line/30 rounded-lg text-coreed-bone hover:text-coreed-moss-bright transition-colors group"
              >
                <span className="w-8 h-8 bg-coreed-moss/10 rounded flex items-center justify-center group-hover:bg-coreed-moss/20 transition-colors">
                  <span>🐍</span>
                </span>
                <span className="font-medium">Python SDK</span>
                <span className="text-coreed-sage text-sm">pip package</span>
              </Link>

              <Link
                href="/docs/contracts"
                className="flex items-center gap-3 px-4 py-2 bg-coreed-panel hover:bg-coreed-line/10 border border-coreed-line/30 rounded-lg text-coreed-bone hover:text-coreed-moss-bright transition-colors group"
              >
                <span className="w-8 h-8 bg-coreed-moss/10 rounded flex items-center justify-center group-hover:bg-coreed-moss/20 transition-colors">
                  <span>📜</span>
                </span>
                <span className="font-medium">Smart Contracts</span>
                <span className="text-coreed-sage text-sm">ABI and addresses</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-semibold text-coreed-bone mb-6">Platform Features</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-coreed-moss/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <h3 className="font-semibold text-coreed-bone mb-2">AI Agent Deployment</h3>
            <p className="text-sm text-coreed-sage/70">
              Deploy LLMs and AI models as live agents with a single command
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-coreed-moss/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📦</span>
            </div>
            <h3 className="font-semibold text-coreed-bone mb-2">Model Storage</h3>
            <p className="text-sm text-coreed-sage/70">
              Store model weights on 0G Storage, only Merkle root on-chain
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-coreed-moss/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⛓️</span>
            </div>
            <h3 className="font-semibold text-coreed-bone mb-2">On-Chain Registry</h3>
            <p className="text-sm text-coreed-sage/70">
              Mint Agentic IDs on Galileo Testnet for permanent model records
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-coreed-moss/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚀</span>
            </div>
            <h3 className="font-semibold text-coreed-bone mb-2">Live Spaces</h3>
            <p className="text-sm text-coreed-sage/70">
              Deploy live inference endpoints with health monitoring and auto-sleep
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-coreed-moss/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💤</span>
            </div>
            <h3 className="font-semibold text-coreed-bone mb-2">Auto-Sleep</h3>
            <p className="text-sm text-coreed-sage/70">
              Save costs with automatic sleep after inactivity periods
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-coreed-moss/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="font-semibold text-coreed-bone mb-2">Analytics</h3>
            <p className="text-sm text-coreed-sage/70">
              Track usage, requests, latency, and health metrics in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="bg-gradient-to-r from-coreed-moss/10 to-coreed-clay/10 border border-coreed-moss/20 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-coreed-bone mb-4">Quick Start</h2>
        <p className="text-coreed-sage mb-6">
          Get started with Coreed in just a few steps:
        </p>
        
        <ol className="space-y-4">
          <li className="flex items-start gap-4">
            <span className="w-8 h-8 bg-coreed-moss/20 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">1</span>
            <div>
              <h3 className="font-semibold text-coreed-bone">Connect Your Wallet</h3>
              <p className="text-coreed-sage/70 text-sm">
                Install MetaMask, OKX Wallet, or any EIP-1193 compatible wallet and connect to Galileo Testnet (Chain ID: 16602)
              </p>
            </div>
          </li>
          
          <li className="flex items-start gap-4">
            <span className="w-8 h-8 bg-coreed-moss/20 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">2</span>
            <div>
              <h3 className="font-semibold text-coreed-bone">Upload Your Model</h3>
              <p className="text-coreed-sage/70 text-sm">
                Upload your AI model to 0G Storage using the CLI or web interface. Only the 32-byte Merkle root goes on-chain.
              </p>
            </div>
          </li>
          
          <li className="flex items-start gap-4">
            <span className="w-8 h-8 bg-coreed-moss/20 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">3</span>
            <div>
              <h3 className="font-semibold text-coreed-bone">Register on ModelRegistry</h3>
              <p className="text-coreed-sage/70 text-sm">
                Mint a unique Agentic ID for your model. This creates a permanent, on-chain record of your model.
              </p>
            </div>
          </li>
          
          <li className="flex items-start gap-4">
            <span className="w-8 h-8 bg-coreed-moss/20 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">4</span>
            <div>
              <h3 className="font-semibold text-coreed-bone">Deploy a Space</h3>
              <p className="text-coreed-sage/70 text-sm">
                Deploy your model as a live space. Choose from Gradio, FastAPI, Express, or Docker templates.
              </p>
            </div>
          </li>
        </ol>
        
        <div className="flex gap-4 mt-8">
          <Link
            href="/docs/getting-started"
            className="px-6 py-3 bg-coreed-moss hover:bg-coreed-moss-bright text-coreed-void rounded-md font-medium transition-colors"
          >
            View Getting Started Guide
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-coreed-panel-raised border border-coreed-line/30 text-coreed-bone rounded-md font-medium hover:border-coreed-moss transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>

      {/* Network Info */}
      <div className="mt-12 pt-8 border-t border-coreed-line/30">
        <h2 className="text-xl font-semibold text-coreed-bone mb-6">Network Information</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-coreed-bone mb-4">0G Chain Galileo Testnet</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-coreed-sage/70">RPC URL:</span>
                <code className="bg-coreed-line/20 px-2 py-1 rounded text-xs font-mono text-coreed-bone">
                  https://evmrpc-testnet.0g.ai
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-coreed-sage/70">Chain ID:</span>
                <code className="bg-coreed-line/20 px-2 py-1 rounded text-xs font-mono text-coreed-bone">
                  16602
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-coreed-sage/70">Storage Indexer:</span>
                <code className="bg-coreed-line/20 px-2 py-1 rounded text-xs font-mono text-coreed-bone truncate">
                  https://indexer-storage-testnet-turbo.0g.ai
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-coreed-sage/70">Compute Router:</span>
                <code className="bg-coreed-line/20 px-2 py-1 rounded text-xs font-mono text-coreed-bone">
                  https://router-api.0g.ai/v1
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-coreed-sage/70">Explorer:</span>
                <code className="bg-coreed-line/20 px-2 py-1 rounded text-xs font-mono text-coreed-bone">
                  https://chainscan-galileo.0g.ai
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-coreed-sage/70">Faucet:</span>
                <code className="bg-coreed-line/20 px-2 py-1 rounded text-xs font-mono text-coreed-bone">
                  https://faucet.0g.ai
                </code>
              </div>
            </div>
          </div>
          
          <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-coreed-bone mb-4">Contract Addresses</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-coreed-sage/70">ModelRegistry:</span>
                <code className="bg-coreed-line/20 px-2 py-1 rounded text-xs font-mono text-coreed-bone">
                  0xFA81...230d4216
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-coreed-sage/70">AgentRegistry:</span>
                <code className="bg-coreed-line/20 px-2 py-1 rounded text-xs font-mono text-coreed-bone">
                  0xff34...Acc235C
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-coreed-sage/70">AgentSpaceRegistry:</span>
                <code className="bg-coreed-line/20 px-2 py-1 rounded text-xs font-mono text-coreed-bone">
                  0xedF4...cA510A
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
