"use client";

import Link from "next/link";
import { BookOpen, Rocket, Package, Link2, Sliders, Laptop, Save, Code2, ScrollText, Bot, Moon, BarChart3 } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-12">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-modal-green mb-2 block">
          Documentation
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
          Coreed Documentation
        </h1>
        <p className="text-lg text-modal-text-dim">
          AI Agent Deployment Platform on 0G Chain
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* User Walkthrough Card */}
        <div className="modal-card">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-modal-green/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-modal-green" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">User Walkthrough</h2>
              <p className="text-modal-text-dim mt-1">
                Step-by-step guides for using Coreed
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Link
              href="/docs/getting-started"
              className="flex items-center gap-3 px-4 py-3 bg-black/50 border border-modal-border rounded-lg text-white hover:text-modal-green hover:border-modal-green transition-colors group"
            >
              <span className="w-8 h-8 bg-modal-green/10 rounded flex items-center justify-center group-hover:bg-modal-green/20 transition-colors">
                <Rocket className="w-4 h-4 text-modal-green" />
              </span>
              <span className="font-medium">Getting Started</span>
              <span className="text-modal-text-dim text-sm ml-auto">New to Coreed? Start here</span>
            </Link>

            <Link
              href="/docs/upload-model"
              className="flex items-center gap-3 px-4 py-3 bg-black/50 border border-modal-border rounded-lg text-white hover:text-modal-green hover:border-modal-green transition-colors group"
            >
              <span className="w-8 h-8 bg-modal-green/10 rounded flex items-center justify-center group-hover:bg-modal-green/20 transition-colors">
                <Package className="w-4 h-4 text-modal-green" />
              </span>
              <span className="font-medium">Upload Model</span>
              <span className="text-modal-text-dim text-sm ml-auto">Store models on 0G</span>
            </Link>

            <Link
              href="/docs/deploy-space"
              className="flex items-center gap-3 px-4 py-3 bg-black/50 border border-modal-border rounded-lg text-white hover:text-modal-green hover:border-modal-green transition-colors group"
            >
              <span className="w-8 h-8 bg-modal-green/10 rounded flex items-center justify-center group-hover:bg-modal-green/20 transition-colors">
                <Link2 className="w-4 h-4 text-modal-green" />
              </span>
              <span className="font-medium">Deploy Space</span>
              <span className="text-modal-text-dim text-sm ml-auto">Launch live AI agents</span>
            </Link>

            <Link
              href="/docs/manage-spaces"
              className="flex items-center gap-3 px-4 py-3 bg-black/50 border border-modal-border rounded-lg text-white hover:text-modal-green hover:border-modal-green transition-colors group"
            >
              <span className="w-8 h-8 bg-modal-green/10 rounded flex items-center justify-center group-hover:bg-modal-green/20 transition-colors">
                <Sliders className="w-4 h-4 text-modal-green" />
              </span>
              <span className="font-medium">Manage Spaces</span>
              <span className="text-modal-text-dim text-sm ml-auto">Monitor and control deployments</span>
            </Link>
          </div>
        </div>

        {/* Developer Docs Card */}
        <div className="modal-card">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-modal-green/10 rounded-lg flex items-center justify-center">
              <Laptop className="w-6 h-6 text-modal-green" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Developer Documentation</h2>
              <p className="text-modal-text-dim mt-1">
                CLI, SDK, and API references
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Link
              href="/docs/cli-overview"
              className="flex items-center gap-3 px-4 py-3 bg-black/50 border border-modal-border rounded-lg text-white hover:text-modal-green hover:border-modal-green transition-colors group"
            >
              <span className="w-8 h-8 bg-modal-green/10 rounded flex items-center justify-center group-hover:bg-modal-green/20 transition-colors">
                <Save className="w-4 h-4 text-modal-green" />
              </span>
              <span className="font-medium">CLI Overview</span>
              <span className="text-modal-text-dim text-sm ml-auto">Command-line interface</span>
            </Link>

            <Link
              href="/docs/sdk-javascript"
              className="flex items-center gap-3 px-4 py-3 bg-black/50 border border-modal-border rounded-lg text-white hover:text-modal-green hover:border-modal-green transition-colors group"
            >
              <span className="w-8 h-8 bg-modal-green/10 rounded flex items-center justify-center group-hover:bg-modal-green/20 transition-colors">
                <Package className="w-4 h-4 text-modal-green" />
              </span>
              <span className="font-medium">JavaScript SDK</span>
              <span className="text-modal-text-dim text-sm ml-auto">npm package</span>
            </Link>

            <Link
              href="/docs/sdk-python"
              className="flex items-center gap-3 px-4 py-3 bg-black/50 border border-modal-border rounded-lg text-white hover:text-modal-green hover:border-modal-green transition-colors group"
            >
              <span className="w-8 h-8 bg-modal-green/10 rounded flex items-center justify-center group-hover:bg-modal-green/20 transition-colors">
                <Code2 className="w-4 h-4 text-modal-green" />
              </span>
              <span className="font-medium">Python SDK</span>
              <span className="text-modal-text-dim text-sm ml-auto">pip package</span>
            </Link>

            <Link
              href="/docs/contracts"
              className="flex items-center gap-3 px-4 py-3 bg-black/50 border border-modal-border rounded-lg text-white hover:text-modal-green hover:border-modal-green transition-colors group"
            >
              <span className="w-8 h-8 bg-modal-green/10 rounded flex items-center justify-center group-hover:bg-modal-green/20 transition-colors">
                <ScrollText className="w-4 h-4 text-modal-green" />
              </span>
              <span className="font-medium">Smart Contracts</span>
              <span className="text-modal-text-dim text-sm ml-auto">ABI and addresses</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="modal-card p-8 mb-8">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-modal-green mb-2 block">
          Platform
        </span>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-8">Platform Features</h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-modal-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-modal-green" />
            </div>
            <h3 className="font-bold text-white mb-2">AI Agent Deployment</h3>
            <p className="text-sm text-modal-text-dim/70">
              Deploy LLMs and AI models as live agents with a single command
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-modal-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-modal-green" />
            </div>
            <h3 className="font-bold text-white mb-2">Model Storage</h3>
            <p className="text-sm text-modal-text-dim/70">
              Store model weights on 0G Storage, only Merkle root on-chain
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-modal-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-8 h-8 text-modal-green" />
            </div>
            <h3 className="font-bold text-white mb-2">On-Chain Registry</h3>
            <p className="text-sm text-modal-text-dim/70">
              Mint Agentic IDs on Galileo Testnet for permanent model records
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-modal-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-8 h-8 text-modal-green" />
            </div>
            <h3 className="font-bold text-white mb-2">Live Spaces</h3>
            <p className="text-sm text-modal-text-dim/70">
              Deploy live inference endpoints with health monitoring and auto-sleep
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-modal-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Moon className="w-8 h-8 text-modal-green" />
            </div>
            <h3 className="font-bold text-white mb-2">Auto-Sleep</h3>
            <p className="text-sm text-modal-text-dim/70">
              Save costs with automatic sleep after inactivity periods
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-modal-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-modal-green" />
            </div>
            <h3 className="font-bold text-white mb-2">Analytics</h3>
            <p className="text-sm text-modal-text-dim/70">
              Track usage, requests, latency, and health metrics in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="modal-card p-8 mb-8 border-modal-green/20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-modal-green mb-2 block">
          Getting Started
        </span>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-4">Quick Start</h2>
        <p className="text-modal-text-dim mb-6">
          Get started with Coreed in just a few steps:
        </p>

        <ol className="space-y-6">
          <li className="flex items-start gap-4">
            <span className="w-8 h-8 bg-modal-green/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
            <div>
              <h3 className="font-bold text-white">Connect Your Wallet</h3>
              <p className="text-modal-text-dim/70 text-sm">
                Install MetaMask, OKX Wallet, or any EIP-1193 compatible wallet and connect to Galileo Testnet (Chain ID: 16602)
              </p>
            </div>
          </li>

          <li className="flex items-start gap-4">
            <span className="w-8 h-8 bg-modal-green/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
            <div>
              <h3 className="font-bold text-white">Upload Your Model</h3>
              <p className="text-modal-text-dim/70 text-sm">
                Upload your AI model to 0G Storage using the CLI or web interface. Only the 32-byte Merkle root goes on-chain.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-4">
            <span className="w-8 h-8 bg-modal-green/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
            <div>
              <h3 className="font-bold text-white">Register on ModelRegistry</h3>
              <p className="text-modal-text-dim/70 text-sm">
                Mint a unique Agentic ID for your model. This creates a permanent, on-chain record of your model.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-4">
            <span className="w-8 h-8 bg-modal-green/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
            <div>
              <h3 className="font-bold text-white">Deploy a Space</h3>
              <p className="text-modal-text-dim/70 text-sm">
                Deploy your model as a live space. Choose from Gradio, FastAPI, Express, or Docker templates.
              </p>
            </div>
          </li>
        </ol>

        <div className="flex gap-4 mt-8">
          <Link
            href="/docs/getting-started"
            className="modal-button-primary"
          >
            View Getting Started Guide
          </Link>
          <Link
            href="/"
            className="modal-button-secondary"
          >
            Return to Home
          </Link>
        </div>
      </div>

      {/* Network Info */}
      <div className="mt-12 pt-8 border-t border-modal-border">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-modal-green mb-2 block">
          Network
        </span>
        <h2 className="text-4xl font-bold tracking-tight text-white mb-8">Network Information</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="modal-card">
            <h3 className="text-lg font-bold text-white mb-4">0G Chain Galileo Testnet</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-modal-text-dim/70">RPC URL:</span>
                <code className="bg-black/50 px-2 py-1 rounded text-xs font-mono text-white">
                  https://evmrpc-testnet.0g.ai
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-modal-text-dim/70">Chain ID:</span>
                <code className="bg-black/50 px-2 py-1 rounded text-xs font-mono text-white">
                  16602
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-modal-text-dim/70">Storage Indexer:</span>
                <code className="bg-black/50 px-2 py-1 rounded text-xs font-mono text-white truncate">
                  https://indexer-storage-testnet-turbo.0g.ai
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-modal-text-dim/70">Compute Router:</span>
                <code className="bg-black/50 px-2 py-1 rounded text-xs font-mono text-white">
                  https://router-api.0g.ai/v1
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-modal-text-dim/70">Explorer:</span>
                <code className="bg-black/50 px-2 py-1 rounded text-xs font-mono text-white">
                  https://chainscan-galileo.0g.ai
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-modal-text-dim/70">Faucet:</span>
                <code className="bg-black/50 px-2 py-1 rounded text-xs font-mono text-white">
                  https://faucet.0g.ai
                </code>
              </div>
            </div>
          </div>

          <div className="modal-card">
            <h3 className="text-lg font-bold text-white mb-4">Contract Addresses</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-modal-text-dim/70">ModelRegistry:</span>
                <code className="bg-black/50 px-2 py-1 rounded text-xs font-mono text-white">
                  0xFA81...230d4216
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-modal-text-dim/70">AgentRegistry:</span>
                <code className="bg-black/50 px-2 py-1 rounded text-xs font-mono text-white">
                  0xff34...Acc235C
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-modal-text-dim/70">AgentSpaceRegistry:</span>
                <code className="bg-black/50 px-2 py-1 rounded text-xs font-mono text-white">
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
