"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StatusStrip } from "@/components/StatusStrip";
import { HealthBadge } from "@/components/space/HealthBadge";
import { ComputeStatus } from "@/components/space/ComputeStatus";
import { FileBrowser } from "@/components/space/FileBrowser";
import { useAgentSpaceRegistry } from "@/lib/useAgentSpaceRegistry";
import { useModelRegistry } from "@/lib/useModelRegistry";
import { useAgentRegistry } from "@/lib/useAgentRegistry";
import { GitBranch, Globe } from "lucide-react";
import type { AgentSpace, SpaceDeployment } from "@/types/space";
import type { JsonRpcSigner, TransactionResponse } from "ethers";

export default function SpaceDetailPage() {
  const params = useParams();
  const spaceId = params.id as string;

  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [space, setSpace] = useState<AgentSpace | null>(null);
  const [modelName, setModelName] = useState<string>("");
  const [modelStorageHash, setModelStorageHash] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [updatingHealth, setUpdatingHealth] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const {
    getSpace,
    checkHealth,
    updateHealthStatus,
    deactivateSpace,
    error: spaceError
  } = useAgentSpaceRegistry();
  const { getModel } = useModelRegistry();
  const { launchAgent } = useAgentRegistry();

  const refreshSpace = async () => {
    try {
      setLoading(true);

      const sessionData = sessionStorage.getItem('lastSpaceInfo');
      if (sessionData) {
        const storedInfo = JSON.parse(sessionData);
        if (storedInfo.spaceId === spaceId) {
          const spaceFromSession: AgentSpace = {
            spaceId: storedInfo.spaceId,
            name: storedInfo.space?.name || storedInfo.spaceId,
            description: storedInfo.space?.description || '',
            version: '1.0.0',
            modelId: '0',
            endpointUrl: storedInfo.space?.endpointUrl || storedInfo.space?.localEndpointUrl || `http://localhost:7860`,
            localEndpointUrl: storedInfo.space?.localEndpointUrl,
            deployedAt: Date.now() / 1000,
            lastHealthCheck: 0,
            lastActivity: 0,
            isActive: true,
            isAsleep: false,
            sleepTimeout: 0,
            owner: storedInfo.space?.owner || '',
            requestCount: 0,
            sdk: storedInfo.space?.sdk || 'gradio',
            template: storedInfo.space?.template || 'blank'
          };
          setSpace(spaceFromSession);

          if (address && spaceFromSession.owner.toLowerCase() === address.toLowerCase()) {
            setIsOwner(true);
          }
          setModelName("0G Compute Router");
          setModelStorageHash("");
          setLoading(false);
          return;
        }
      }

      try {
        const spaceData = await getSpace(spaceId);
        setSpace(spaceData);

        if (address && spaceData.owner.toLowerCase() === address.toLowerCase()) {
          setIsOwner(true);
        }

        try {
          const model = await getModel(spaceData.modelId);
          setModelName(model.name);
          setModelStorageHash(model.storageRootHash);
        } catch {
          setModelName("Unknown Model");
          setModelStorageHash("");
        }
      } catch (chainErr) {
        console.log("On-chain lookup failed:", chainErr);
        if (sessionData) {
          const storedInfo = JSON.parse(sessionData);
          const spaceFromSession: AgentSpace = {
            spaceId: storedInfo.spaceId,
            name: storedInfo.space?.name || storedInfo.spaceId,
            description: storedInfo.space?.description || '',
            version: '1.0.0',
            modelId: '0',
            endpointUrl: storedInfo.space?.endpointUrl || storedInfo.space?.localEndpointUrl || `http://localhost:7860`,
            localEndpointUrl: storedInfo.space?.localEndpointUrl,
            deployedAt: Date.now() / 1000,
            lastHealthCheck: 0,
            lastActivity: 0,
            isActive: true,
            isAsleep: false,
            sleepTimeout: 0,
            owner: storedInfo.space?.owner || '',
            requestCount: 0,
            sdk: storedInfo.space?.sdk || 'gradio',
            template: storedInfo.space?.template || 'blank'
          };
          setSpace(spaceFromSession);
          setModelName("0G Compute Router");
          setModelStorageHash("");
        }
      }

    } catch (err) {
      console.error("Failed to fetch space:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshHealth = async () => {
    if (!space) return;
    setHealthLoading(true);
    try {
      await checkHealth(space.spaceId);
      await refreshSpace();
    } catch (err) {
      console.error("Failed to check health:", err);
    } finally {
      setHealthLoading(false);
    }
  };

  const handleUpdateHealth = async (isActive: boolean) => {
    if (!signer || !space) return;
    setUpdatingHealth(true);
    try {
      await updateHealthStatus(signer, space.spaceId, isActive);
      await refreshSpace();
    } catch (err) {
      console.error("Failed to update health:", err);
    } finally {
      setUpdatingHealth(false);
    }
  };

  const handleDeactivate = async () => {
    if (!signer || !space || !isOwner) return;
    if (!confirm("Are you sure you want to deactivate this space?")) return;

    try {
      await deactivateSpace(signer, space.spaceId);
      await refreshSpace();
    } catch (err) {
      console.error("Failed to deactivate space:", err);
    }
  };

  const handleLaunchAgent = async () => {
    if (!signer || !space || !modelStorageHash) return;

    try {
      const result = await launchAgent(signer, modelName || `Space ${space.spaceId}`, modelStorageHash);
      alert(`Agent launched with ID: ${result.agentId}`);
    } catch (err) {
      console.error("Failed to launch agent:", err);
    }
  };

  useEffect(() => {
    refreshSpace();
  }, [spaceId, address, getSpace, getModel]);

  if (loading) {
    return (
      <>
        <StatusStrip
          address={address}
          onConnect={(s, addr) => {
            setSigner(s);
            setAddress(addr);
          }}
        />
        <main className="mx-auto flex max-w-4xl flex-1 flex-col px-6 py-12">
          <p className="font-mono text-coreed-sage coreed-pulse">Loading space details...</p>
        </main>
      </>
    );
  }

  if (!space) {
    return (
      <>
        <StatusStrip
          address={address}
          onConnect={(s, addr) => {
            setSigner(s);
            setAddress(addr);
          }}
        />
        <main className="mx-auto flex max-w-4xl flex-1 flex-col px-6 py-12">
          <div className="text-center">
            <h1 className="font-mono text-xl text-coreed-bone mb-4">
              Space Not Found
            </h1>
            <p className="font-mono text-sm text-coreed-sage">
              Space with ID {spaceId} does not exist.
            </p>
            <Link
              href="/spaces"
              className="inline-block mt-6 rounded border border-coreed-line px-4 py-2 font-mono text-xs text-coreed-sage hover:border-coreed-moss"
            >
              Back to Spaces
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <StatusStrip
        address={address}
        onConnect={(s, addr) => {
          setSigner(s);
          setAddress(addr);
        }}
      />

      <main className="mx-auto flex max-w-4xl flex-1 flex-col px-6 py-12">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4">
            <div>
              <h1 className="font-mono text-xl md:text-2xl font-medium tracking-tight text-coreed-bone">
                {space.name}
              </h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-coreed-sage">
                Agent Space ID: {space.spaceId}
              </p>
            </div>
        <div className="flex flex-wrap gap-4">
              <Link
                href="/spaces"
                className="font-mono text-xs text-coreed-sage hover:text-coreed-bone"
              >
                all spaces
              </Link>
            </div>
          </div>
        </div>

        {spaceError && (
          <div className="mb-6 rounded border border-coreed-clay bg-coreed-panel-raised p-4">
            <p className="font-mono text-xs text-coreed-clay" role="alert">
              {spaceError}
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <HealthBadge isActive={space.isActive} lastChecked={space.lastHealthCheck} />
            <button
              onClick={refreshHealth}
              disabled={healthLoading}
              className="font-mono text-xs text-coreed-sage hover:text-coreed-bone disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
          <span className="font-mono text-xs text-coreed-sage">
            v{space.version}
          </span>
          <span className="font-mono text-xs text-coreed-sage">
            Model: {modelName}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded border border-coreed-line bg-coreed-panel p-5">
            <h3 className="font-mono text-xs text-coreed-sage mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Endpoint
            </h3>
            <p className="font-mono text-xs text-coreed-sage/70 mb-1">Coreed URL</p>
            <p className="font-mono text-sm text-coreed-bone break-all">
              {space.endpointUrl}
            </p>
            <a
              href={space.endpointUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-coreed-moss-bright hover:text-coreed-bone mt-2 inline-block"
            >
              visit
            </a>

            {space.localEndpointUrl && space.localEndpointUrl !== space.endpointUrl && (
              <>
                <p className="font-mono text-xs text-coreed-sage/70 mb-1 mt-3">Local Dev URL</p>
                <p className="font-mono text-sm text-coreed-sage break-all">
                  {space.localEndpointUrl}
                </p>
              </>
            )}
          </div>
          <div className="rounded border border-coreed-line bg-coreed-panel p-5">
            <h3 className="font-mono text-xs text-coreed-sage mb-3">
              Owner
            </h3>
            <p className="font-mono text-sm text-coreed-bone">
              {space.owner.slice(0, 10)}...{space.owner.slice(-8)}
            </p>
          </div>
          <div className="rounded border border-coreed-line bg-coreed-panel p-5">
            <h3 className="font-mono text-xs text-coreed-sage mb-3">
              Requests
            </h3>
            <p className="font-mono text-sm text-coreed-bone">
              {space.requestCount}
            </p>
          </div>
        </div>

        <div className="rounded border border-coreed-line bg-coreed-panel p-5 mb-8">
          <h3 className="font-mono text-xs text-coreed-sage mb-3">
            Description
          </h3>
          <p className="font-mono text-sm text-coreed-sage/80">
            {space.description || "No description provided"}
          </p>
        </div>

        {(() => {
          const sessionData = sessionStorage.getItem('lastSpaceInfo');
          if (sessionData) {
            const storedInfo = JSON.parse(sessionData);
            if (storedInfo.spaceId === spaceId && storedInfo.repo) {
              return (
                <div className="rounded border border-coreed-line bg-coreed-panel p-5 mb-8">
                  <h3 className="font-mono text-xs text-coreed-sage mb-3 flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Git Repository
                  </h3>
                  <div className="mb-4">
                    <p className="font-mono text-xs text-coreed-sage/70 mb-1">Clone URL</p>
                    <p className="font-mono text-sm text-coreed-bone break-all">
                      {storedInfo.repo.cloneUrl}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="font-mono text-xs text-coreed-sage/70 mb-1">Local Path</p>
                    <p className="font-mono text-sm text-coreed-sage break-all">
                      {storedInfo.repo.repoPath}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const text = `git clone ${storedInfo.repo.cloneUrl}\ncd ${spaceId}\n${space.sdk === 'gradio' || space.sdk === 'fastapi' ? 'pip install -r requirements.txt' : 'npm install'}\n${space.sdk === 'gradio' ? 'python app.py' : space.sdk === 'fastapi' ? 'uvicorn main:app' : 'node index.js'}`;
                        navigator.clipboard.writeText(text);
                        alert('Commands copied to clipboard!');
                      }}
                      className="rounded border border-coreed-moss px-3 py-1 font-mono text-xs text-coreed-bone hover:border-coreed-moss-bright"
                    >
                      Copy Setup Commands
                    </button>
                  </div>
                </div>
              );
            }
          }
          return null;
        })()}

        {(() => {
          const sessionData = sessionStorage.getItem('lastSpaceInfo');
          if (sessionData) {
            const storedInfo = JSON.parse(sessionData);
            if (storedInfo.spaceId === spaceId && storedInfo.repo) {
              return (
                <FileBrowser
                  repoPath={storedInfo.repo.repoPath}
                  cloneUrl={storedInfo.repo.cloneUrl}
                />
              );
            }
          }
          return null;
        })()}

        <ComputeStatus spaceId={spaceId} />

        <div className="rounded border border-coreed-line bg-coreed-panel p-5 mb-8">
          <h3 className="font-mono text-xs text-coreed-sage mb-3">
            Metadata
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-xs text-coreed-sage/70 mb-1">Space ID</p>
              <p className="font-mono text-sm text-coreed-bone">{space.spaceId}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-coreed-sage/70 mb-1">Model ID</p>
              <p className="font-mono text-sm text-coreed-bone">{space.modelId}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-coreed-sage/70 mb-1">Deployed</p>
              <p className="font-mono text-sm text-coreed-bone">
                {new Date(space.deployedAt * 1000).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-mono text-xs text-coreed-sage/70 mb-1">Last Health Check</p>
              <p className="font-mono text-sm text-coreed-bone">
                {space.lastHealthCheck > 0
                  ? new Date(space.lastHealthCheck * 1000).toLocaleString()
                  : "Never"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={refreshHealth}
            disabled={healthLoading}
            className="rounded border border-coreed-line px-4 py-2 font-mono text-xs text-coreed-sage hover:border-coreed-moss disabled:opacity-50"
          >
            {healthLoading ? "Refreshing..." : "Refresh Health"}
          </button>

          <button
            onClick={handleLaunchAgent}
            disabled={!signer}
            className="rounded border border-coreed-line px-4 py-2 font-mono text-xs text-coreed-sage hover:border-coreed-moss disabled:opacity-50"
          >
            Launch Agent
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => handleUpdateHealth(!space.isActive)}
                disabled={updatingHealth || !signer}
                className="rounded border border-coreed-moss px-4 py-2 font-mono text-xs text-coreed-bone hover:border-coreed-moss-bright disabled:opacity-50"
              >
                {updatingHealth ? "Updating..." : space.isActive ? "Mark Unhealthy" : "Mark Healthy"}
              </button>
              <button
                onClick={handleDeactivate}
                disabled={!signer}
                className="rounded border border-coreed-clay px-4 py-2 font-mono text-xs text-coreed-clay hover:border-red-400 hover:text-red-400"
              >
                Deactivate Space
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
