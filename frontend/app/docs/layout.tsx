"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Laptop, Link as LinkIcon } from "lucide-react";

export default function DocsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const userWalkthroughItems = [
    { path: "/docs", label: "Overview" },
    { path: "/docs/getting-started", label: "Getting Started" },
    { path: "/docs/upload-model", label: "Upload Model" },
    { path: "/docs/deploy-space", label: "Deploy Space" },
    { path: "/docs/manage-spaces", label: "Manage Spaces" },
    { path: "/docs/collaborate", label: "Collaborate" },
    { path: "/docs/versioning", label: "Model Versioning" },
    { path: "/docs/analytics", label: "Analytics" },
  ];

  const developerItems = [
    { path: "/docs/cli-overview", label: "CLI Overview" },
    { path: "/docs/cli-installation", label: "CLI Installation" },
    { path: "/docs/cli-commands", label: "CLI Commands" },
    { path: "/docs/sdk-overview", label: "SDK Overview" },
    { path: "/docs/sdk-installation", label: "SDK Installation" },
    { path: "/docs/sdk-javascript", label: "JavaScript SDK" },
    { path: "/docs/sdk-python", label: "Python SDK" },
    { path: "/docs/contracts", label: "Smart Contracts" },
    { path: "/docs/api-reference", label: "API Reference" },
    { path: "/docs/examples", label: "Code Examples" },
  ];

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <aside className="hidden lg:block w-64 bg-modal-surface border-r border-modal-border flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white mb-6">
            COREED DOCS
          </h1>

          {/* User Walkthrough Section */}
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4 px-2">
              <BookOpen className="inline-block w-3.5 h-3.5 mr-1.5 -mt-0.5" /> USER WALKTHROUGH
            </h2>
            <nav className="space-y-1">
              {userWalkthroughItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(item.path)
                      ? "bg-modal-green/20 text-white font-medium"
                      : "text-modal-text-dim hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Developer Docs Section */}
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4 px-2">
              <Laptop className="inline-block w-3.5 h-3.5 mr-1.5 -mt-0.5" /> DEVELOPER DOCS
            </h2>
            <nav className="space-y-1">
              {developerItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(item.path)
                      ? "bg-modal-green/20 text-white font-medium"
                      : "text-modal-text-dim hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Quick Links */}
          <div className="border-t border-modal-border pt-6">
            <h2 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4 px-2">
              <LinkIcon className="inline-block w-3.5 h-3.5 mr-1.5 -mt-0.5" /> QUICK LINKS
            </h2>
            <nav className="space-y-1">
              <a
                href="https://github.com/neuralnex/coreed"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 rounded text-sm text-modal-text-dim hover:bg-white/5 hover:text-white transition-colors"
              >
                GitHub Repository
              </a>
              <a
                href="https://0g.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 rounded text-sm text-modal-text-dim hover:bg-white/5 hover:text-white transition-colors"
              >
                0G Chain
              </a>
              <a
                href="https://evmrpc-testnet.0g.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 rounded text-sm text-modal-text-dim hover:bg-white/5 hover:text-white transition-colors"
              >
                Galileo RPC
              </a>
              <a
                href="https://chainscan-galileo.0g.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 rounded text-sm text-modal-text-dim hover:bg-white/5 hover:text-white transition-colors"
              >
                Galileo Explorer
              </a>
            </nav>
          </div>

          {/* Version Info */}
          <div className="border-t border-modal-border pt-6 mt-6">
            <p className="text-xs text-modal-text-dim/50">
              Coreed v3.0.0
            </p>
            <p className="text-xs text-modal-text-dim/50">
              0G Chain Galileo Testnet
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
