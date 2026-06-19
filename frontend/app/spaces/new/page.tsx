"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StatusStrip } from "@/components/StatusStrip";
import { DeployModal } from "@/components/space/DeployModal";
import { useModelRegistry } from "@/lib/useModelRegistry";
import type { JsonRpcSigner } from "ethers";

export default function NewSpacePage() {
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployedSpaceId, setDeployedSpaceId] = useState<string | null>(null);

  const { getModelsByCreator } = useModelRegistry();

  const handleDeploySuccess = (spaceId: string) => {
    setDeployedSpaceId(spaceId);
  };

  const handleCloseDeployModal = useCallback(() => {
    setShowDeployModal(false);
  }, []);

  useEffect(() => {
    if (deployedSpaceId) {
      // Redirect to the new space after a brief delay
      const timer = setTimeout(() => {
        window.location.href = `/spaces/${deployedSpaceId}`;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [deployedSpaceId]);

  return (
    <>
      <StatusStrip
        address={address}
        onConnect={(s, addr) => {
          setSigner(s);
          setAddress(addr);
        }}
      />

      <main className="mx-auto flex max-w-6xl flex-1 flex-col px-6 py-12">
        <div className="mb-8">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="font-mono text-2xl font-medium tracking-tight text-coreed-bone">
                new agent space
              </h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-coreed-sage">
                Deploy a live AI agent from one of your models.
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/spaces"
                className="font-mono text-xs text-coreed-sage hover:text-coreed-bone"
              >
                ← back to spaces
              </Link>
            </div>
          </div>
        </div>

        {deployedSpaceId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-coreed-moss flex items-center justify-center">
                <span className="font-mono text-2xl text-coreed-sage">✓</span>
              </div>
              <h2 className="font-mono text-lg text-coreed-bone mb-2">
                Space Deployed!
              </h2>
              <p className="font-mono text-sm text-coreed-sage mb-4">
                Space ID: {deployedSpaceId}
              </p>
              <p className="font-mono text-xs text-coreed-sage/70">
                Redirecting to space details...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <div className="max-w-3xl mx-auto rounded border border-coreed-line bg-coreed-panel p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full border border-coreed-line flex items-center justify-center">
                  <span className="font-mono text-3xl text-coreed-sage">🚀</span>
                </div>
                <h2 className="font-mono text-xl text-coreed-bone mb-2">
                  Ready to Deploy
                </h2>
                <p className="font-mono text-sm text-coreed-sage">
                  Turn your model into a live API endpoint that can be accessed from anywhere.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 rounded border border-coreed-line/50">
                  <div className="w-12 h-12 mx-auto mb-3 rounded border border-coreed-moss flex items-center justify-center">
                    <span className="font-mono text-lg text-coreed-bone">📦</span>
                  </div>
                  <h3 className="font-mono text-sm text-coreed-bone mb-1">Choose a Model</h3>
                  <p className="font-mono text-xs text-coreed-sage/70">
                    Select from your uploaded models
                  </p>
                </div>
                <div className="text-center p-4 rounded border border-coreed-line/50">
                  <div className="w-12 h-12 mx-auto mb-3 rounded border border-coreed-moss flex items-center justify-center">
                    <span className="font-mono text-lg text-coreed-bone">⚙️</span>
                  </div>
                  <h3 className="font-mono text-sm text-coreed-bone mb-1">Select Runtime</h3>
                  <p className="font-mono text-xs text-coreed-sage/70">
                    Python, Node.js, or Java
                  </p>
                </div>
                <div className="text-center p-4 rounded border border-coreed-line/50">
                  <div className="w-12 h-12 mx-auto mb-3 rounded border border-coreed-moss flex items-center justify-center">
                    <span className="font-mono text-lg text-coreed-bone">🌐</span>
                  </div>
                  <h3 className="font-mono text-sm text-coreed-bone mb-1">Set Endpoint</h3>
                  <p className="font-mono text-xs text-coreed-sage/70">
                    Your live API URL
                  </p>
                </div>
              </div>

              {address ? (
                <button
                  onClick={() => setShowDeployModal(true)}
                  className="w-full rounded border border-coreed-moss bg-coreed-panel-raised py-3 font-mono text-sm text-coreed-bone hover:border-coreed-moss-bright transition-colors"
                >
                  Deploy Agent Space
                </button>
              ) : (
                <div className="text-center p-6 rounded border border-coreed-clay bg-coreed-panel-raised">
                  <p className="font-mono text-xs text-coreed-clay mb-4">
                    Connect your wallet to deploy an agent space
                  </p>
                </div>
              )}
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-mono text-sm text-coreed-bone mb-3">
                  Requirements
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-xs text-coreed-moss-bright mt-0.5">●</span>
                    <span className="font-mono text-xs text-coreed-sage">
                      A registered model in the Coreed Model Hub
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-xs text-coreed-moss-bright mt-0.5">●</span>
                    <span className="font-mono text-xs text-coreed-sage">
                      A running server with /health endpoint
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-xs text-coreed-moss-bright mt-0.5">●</span>
                    <span className="font-mono text-xs text-coreed-sage">
                      Model file downloaded from 0G Storage
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-mono text-sm text-coreed-bone mb-3">
                  Quick Start
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-xs text-coreed-moss-bright mt-0.5">1</span>
                    <span className="font-mono text-xs text-coreed-sage">
                      Upload a model to /hub/my-models
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-xs text-coreed-moss-bright mt-0.5">2</span>
                    <span className="font-mono text-xs text-coreed-sage">
                      Download model using 0G Storage CLI
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-xs text-coreed-moss-bright mt-0.5">3</span>
                    <span className="font-mono text-xs text-coreed-sage">
                      Start server using a template
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-xs text-coreed-moss-bright mt-0.5">4</span>
                    <span className="font-mono text-xs text-coreed-sage">
                      Deploy to Coreed Space Registry
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {showDeployModal && (
          <DeployModal
            signer={signer}
            address={address}
            onClose={handleCloseDeployModal}
            onDeploySuccess={handleDeploySuccess}
          />
        )}
      </main>
    </>
  );
}
