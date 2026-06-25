"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StatusStrip } from "@/components/StatusStrip";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import { FileBrowser } from "@/components/space/FileBrowser";
import { useAgentSpaceRegistry } from "@/lib/useAgentSpaceRegistry";
import { useModelRegistry } from "@/lib/useModelRegistry";
import { useAgentRegistry } from "@/lib/useAgentRegistry";
import { 
  GitBranch, 
  Globe, 
  PlayCircle, 
  StopCircle, 
  RefreshCw, 
  Terminal, 
  Heart, 
  FileText, 
  Settings as SettingsIcon,
  Play,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Lock,
  Cpu
} from "lucide-react";
import type { AgentSpace } from "@/types/space";
import type { JsonRpcSigner } from "ethers";

export default function SpaceDetailPage() {
  const params = useParams();
  const spaceId = params.id as string;

  const { signer, address } = useWalletContext();
  const [space, setSpace] = useState<AgentSpace | null>(null);
  const [modelName, setModelName] = useState<string>("");
  const [modelStorageHash, setModelStorageHash] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [updatingHealth, setUpdatingHealth] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [spaceRunning, setSpaceRunning] = useState(false);
  const [spacePort, setSpacePort] = useState<number | null>(null);
  const [spaceActionLoading, setSpaceActionLoading] = useState<string | null>(null);
  
  // Tab navigation state: app, files, logs, settings
  const [activeTab, setActiveTab] = useState<'app' | 'files' | 'logs' | 'settings'>('app');
  const [likes, setLikes] = useState(12);
  const [liked, setLiked] = useState(false);

  // Real-time logs state
  const [logs, setLogs] = useState<{ timestamp: string; phase: 'build' | 'run' | 'system' | 'error'; message: string }[]>([]);

  // Secrets editor state
  const [secrets, setSecrets] = useState<{ key: string; value: string }[]>([]);
  const [secretsLoading, setSecretsLoading] = useState(false);
  const [savingSecrets, setSavingSecrets] = useState(false);
  const [secretsError, setSecretsError] = useState<string | null>(null);

  const fetchSecrets = async () => {
    setSecretsLoading(true);
    setSecretsError(null);
    try {
      const response = await fetch(`/api/spaces/secrets?spaceId=${spaceId}`);
      if (response.ok) {
        const data = await response.json();
        setSecrets(data.secrets || []);
      } else {
        const error = await response.json();
        setSecretsError(error.error || 'Failed to load secrets');
      }
    } catch (err) {
      setSecretsError(err instanceof Error ? err.message : String(err));
    } finally {
      setSecretsLoading(false);
    }
  };

  const handleSaveSecrets = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSecrets(true);
    setSecretsError(null);
    try {
      const response = await fetch('/api/spaces/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId, secrets })
      });
      if (response.ok) {
        alert('Secrets saved successfully! Click Restart to apply the new environment variables.');
        fetchSecrets();
      } else {
        const error = await response.json();
        setSecretsError(error.error || 'Failed to save secrets');
      }
    } catch (err) {
      setSecretsError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingSecrets(false);
    }
  };

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
            platformUrl: storedInfo.space?.platformUrl,
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
            template: storedInfo.space?.template || 'blank',
            status: storedInfo.space?.status || 'created'
          };
          setSpace(spaceFromSession);

          if (address && spaceFromSession.owner.toLowerCase() === address.toLowerCase()) {
            setIsOwner(true);
          }
          setModelName("0G Compute Router");
          setModelStorageHash("");
          setLoading(false);
          checkSpaceRunning(spaceFromSession);
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
        checkSpaceRunning(spaceData);
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
            platformUrl: storedInfo.space?.platformUrl,
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
            template: storedInfo.space?.template || 'blank',
            status: storedInfo.space?.status || 'created'
          };
          setSpace(spaceFromSession);
          setModelName("0G Compute Router");
          setModelStorageHash("");
          checkSpaceRunning(spaceFromSession);
        }
      }

    } catch (err) {
      console.error("Failed to fetch space:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkSpaceRunning = async (spaceData: AgentSpace) => {
    try {
      const response = await fetch(`/api/spaces/run?spaceId=${spaceData.spaceId}`);
      if (response.ok) {
        const data = await response.json();
        setSpaceRunning(data.isRunning);
        setSpacePort(data.port || null);
      }
    } catch {
      setSpaceRunning(false);
      setSpacePort(null);
    }
  };

  const handleSpaceAction = async (action: 'start' | 'stop' | 'restart' | 'install-deps') => {
    if (!space) return;

    setSpaceActionLoading(action);
    
    // Add logs
    const actionLabel = action === 'start' ? 'Starting process' : 
                        action === 'stop' ? 'Stopping process' : 
                        action === 'restart' ? 'Restarting process' : 
                        'Installing dependencies';
    addLog(`[System] ${actionLabel} for space ${space.spaceId}...`);

    try {
      const response = await fetch('/api/spaces/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId: space.spaceId, action })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (action === 'start' || action === 'restart') {
            addLog(`[System] Process listening on local port: ${data.port || 7860}`);
            addLog(`[System] Service successfully deployed.`);
          } else if (action === 'stop') {
            addLog(`[System] Process terminated.`);
          } else if (action === 'install-deps') {
            addLog(`[System] Dependency logs:\n${data.message || 'Dependencies successfully synchronized.'}`);
          }
          checkSpaceRunning(space);
        }
      } else {
        const error = await response.json();
        addLog(`[Error] Action failed: ${error.error || 'Server returned an error'}`);
        console.error('Space action error:', error);
      }
    } catch (err) {
      addLog(`[Error] Connection failed: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Failed to perform space action:', err);
    } finally {
      setSpaceActionLoading(null);
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

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, phase: 'system', message: msg }]);
  };

  // Poll real-time logs from backend when logs tab is active
  useEffect(() => {
    if (activeTab !== 'logs' || !spaceId) return;

    let active = true;
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/spaces/logs?spaceId=${spaceId}`);
        if (response.ok && active) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error("Failed to fetch space logs:", err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 1500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeTab, spaceId]);

  useEffect(() => {
    refreshSpace();
  }, [spaceId, address, getSpace, getModel]);

  useEffect(() => {
    if (activeTab === 'settings' && space) {
      fetchSecrets();
    }
  }, [activeTab, spaceId, space]);

  const toggleLike = () => {
    if (liked) {
      setLikes(prev => prev - 1);
      setLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setLiked(true);
    }
  };

  if (loading) {
    return (
      <>
        <StatusStrip />
        <main className="mx-auto flex max-w-5xl flex-1 flex-col px-6 py-12">
          <p className="font-mono text-modal-green animate-pulse text-sm">Loading Space Details...</p>
        </main>
      </>
    );
  }

  if (!space) {
    return (
      <>
        <StatusStrip />
        <main className="mx-auto flex max-w-5xl flex-1 flex-col px-6 py-12 text-center">
          <h1 className="text-xl font-semibold mb-4 text-white">Space Not Found</h1>
          <p className="text-white/50 text-sm mb-6">Space with ID "{spaceId}" does not exist.</p>
          <Link href="/spaces" className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all inline-block max-w-xs mx-auto">
            Back to Spaces
          </Link>
        </main>
      </>
    );
  }

  const ownerShort = space.owner ? `${space.owner.slice(0, 6).toLowerCase()}...${space.owner.slice(-4).toLowerCase()}` : "community";

  return (
    <>
      <StatusStrip />

      <main className="w-full flex-grow bg-[#080809] min-h-screen text-white pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Hugging Face Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-xl">
                🚀
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-1.5 font-mono">
                    <span className="text-white/40 font-normal">{ownerShort}</span>
                    <span className="text-white/40 font-light">/</span>
                    <span className="text-white font-bold">{space.name}</span>
                  </h1>

                  {/* SDK Pill */}
                  <span className="px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider bg-white/5 border border-white/10 rounded-md text-white/60">
                    {space.sdk}
                  </span>

                  {/* Running Status Badge */}
                  <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium font-mono ${
                    spaceRunning 
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' 
                      : 'bg-amber-950/40 text-amber-400 border border-amber-800/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${spaceRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    {spaceRunning ? 'Running' : 'Stopped'}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-1 font-mono">{space.description || "No description provided"}</p>
              </div>
            </div>

            {/* Header Action Pills */}
            <div className="flex items-center gap-2 self-start md:self-center">
              <button 
                onClick={toggleLike}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold font-mono transition-all cursor-pointer ${
                  liked 
                    ? 'bg-pink-900/20 border-pink-700/40 text-pink-400' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                <span>{likes}</span>
              </button>

              <a 
                href={spaceRunning ? `http://localhost:${spacePort || 7860}` : space.endpointUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold font-mono text-white/80 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open App</span>
              </a>
            </div>
          </div>

          {spaceError && (
            <div className="mb-6 rounded-xl border border-red-950 bg-red-950/10 p-4">
              <p className="text-red-400 text-xs font-mono" role="alert">
                {spaceError}
              </p>
            </div>
          )}

          {/* Navigation Tabs (App, Files, Logs, Settings) */}
          <div className="flex border-b border-white/10 mb-6 overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab('app')}
              className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-all border-b-2 tracking-tight cursor-pointer ${
                activeTab === 'app' 
                  ? 'border-modal-green text-white font-semibold' 
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <span>🚀 App</span>
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-all border-b-2 tracking-tight cursor-pointer ${
                activeTab === 'files' 
                  ? 'border-modal-green text-white font-semibold' 
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <span>📁 Files</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-all border-b-2 tracking-tight cursor-pointer ${
                activeTab === 'logs' 
                  ? 'border-modal-green text-white font-semibold' 
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <span>📝 Logs</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-5 py-2.5 font-medium text-sm transition-all border-b-2 tracking-tight cursor-pointer ${
                activeTab === 'settings' 
                  ? 'border-modal-green text-white font-semibold' 
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <span>⚙️ Settings</span>
            </button>
          </div>

          {/* Tab Content Views */}
          <div className="min-h-[500px]">
            
            {/* 1. App Tab */}
            {activeTab === 'app' && (
              <div className="w-full h-full">
                {spaceRunning ? (
                  <div className="border border-white/10 rounded-2xl overflow-hidden bg-white h-[650px] shadow-2xl relative">
                    <iframe
                      src={`http://localhost:${spacePort || 7860}`}
                      className="w-full h-full border-none"
                      title={space.name}
                    />
                  </div>
                ) : (
                  <div className="w-full min-h-[480px] border border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5 p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-2xl">
                      💤
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Space is Stopped</h2>
                    <p className="text-sm text-white/50 max-w-sm mb-6 leading-relaxed">
                      This Space is currently asleep or stopped. Wake it up to run inference and test the model interactions.
                    </p>
                    <button
                      onClick={() => handleSpaceAction('start')}
                      disabled={spaceActionLoading === 'start'}
                      className="px-6 py-2.5 bg-modal-green text-black font-semibold text-sm rounded-xl hover:brightness-110 disabled:opacity-50 flex items-center gap-2.5 cursor-pointer shadow-lg shadow-modal-green/10"
                    >
                      {spaceActionLoading === 'start' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Starting...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Start Space</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. Files Tab */}
            {activeTab === 'files' && (
              <div className="space-y-6">
                {/* FileBrowser Wrapper */}
                {(() => {
                  const sessionData = sessionStorage.getItem('lastSpaceInfo');
                  let repoPath = '';
                  let cloneUrl = '';
                  
                  if (sessionData) {
                    const storedInfo = JSON.parse(sessionData);
                    if (storedInfo.spaceId === spaceId && storedInfo.repo) {
                      repoPath = storedInfo.repo.repoPath;
                      cloneUrl = storedInfo.repo.cloneUrl;
                    }
                  }

                  // Default mock paths if session cleared
                  if (!repoPath) {
                    repoPath = `./storage/repos/${space.owner || '0x...'}/${spaceId}`;
                    cloneUrl = `file:///${repoPath}`;
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <FileBrowser
                          repoPath={repoPath}
                          cloneUrl={cloneUrl}
                        />
                      </div>
                      <div className="space-y-6">
                        {/* Repository details */}
                        <div className="bg-[#0c0c0d] border border-white/10 rounded-2xl p-5">
                          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-modal-green" />
                            Git Integration
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] text-white/50 uppercase tracking-wider font-mono mb-1.5">Clone Repository</p>
                              <div className="bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-emerald-400 break-all select-all">
                                git clone {cloneUrl}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-white/50 uppercase tracking-wider font-mono mb-1.5">Local Storage Path</p>
                              <div className="bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-white/70 break-all select-all">
                                {repoPath}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const text = `git clone ${cloneUrl}\ncd ${spaceId}\n${space.sdk === 'gradio' || space.sdk === 'fastapi' ? 'pip install -r requirements.txt' : 'npm install'}\n${space.sdk === 'gradio' ? 'python app.py' : space.sdk === 'fastapi' ? 'uvicorn main:app' : 'node index.js'}`;
                                navigator.clipboard.writeText(text);
                                alert('Setup commands copied!');
                              }}
                              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold font-mono text-white/80 transition-all cursor-pointer"
                            >
                              Copy Setup Instructions
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 3. Logs Tab */}
            {activeTab === 'logs' && (
              <div className="bg-[#0c0c0d] border border-white/10 rounded-2xl overflow-hidden font-mono text-xs shadow-2xl flex flex-col h-[520px]">
                <div className="bg-[#121214] px-4 py-3 border-b border-white/10 flex justify-between items-center flex-shrink-0">
                  <span className="text-white/40 uppercase font-semibold tracking-wider text-[10px]">Console Output</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-emerald-400 font-semibold text-[10px] uppercase">Logs active</span>
                  </div>
                </div>
                <div className="flex-1 p-5 overflow-y-auto space-y-1.5 text-white/80 bg-black leading-relaxed font-mono text-[11px]">
                  {logs.length === 0 ? (
                    <p className="text-white/30 italic">No output logs received yet.</p>
                  ) : (
                    logs.map((log, i) => {
                      let colorClass = "text-white/60";
                      if (log.phase === 'error') colorClass = "text-red-400 font-medium";
                      else if (log.phase === 'system') colorClass = "text-emerald-400 font-medium";
                      else if (log.phase === 'build') colorClass = "text-cyan-400";
                      
                      return (
                        <div key={i} className={`whitespace-pre-wrap select-text selection:bg-modal-green/30 ${colorClass}`}>
                          <span className="opacity-30 select-none mr-2">[{log.timestamp}]</span>
                          <span className="opacity-40 select-none mr-2">[{log.phase.toUpperCase()}]</span>
                          <span>{log.message}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 4. Settings Tab */}
            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left controls panel */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-[#0c0c0d] border border-white/10 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold mb-4 text-white">Space Control Station</h3>
                    <p className="text-xs text-white/50 mb-5 leading-relaxed">
                      Manage the container lifecycle of your Space. Trigger local package installations or reset the running state.
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {!spaceRunning ? (
                        <button
                          onClick={() => handleSpaceAction('start')}
                          disabled={spaceActionLoading === 'start'}
                          className="px-4 py-2.5 bg-modal-green text-black font-semibold text-xs rounded-xl hover:brightness-110 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all"
                        >
                          <PlayCircle className="w-3.5 h-3.5 fill-current" />
                          <span>{spaceActionLoading === 'start' ? 'Starting...' : 'Start Space'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSpaceAction('stop')}
                          disabled={spaceActionLoading === 'stop'}
                          className="px-4 py-2.5 bg-red-900/20 hover:bg-red-900/30 border border-red-700/40 text-red-400 font-semibold text-xs rounded-xl disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all"
                        >
                          <StopCircle className="w-3.5 h-3.5" />
                          <span>{spaceActionLoading === 'stop' ? 'Stopping...' : 'Stop Space'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleSpaceAction('restart')}
                        disabled={spaceActionLoading === 'restart'}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold font-mono text-white/80 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{spaceActionLoading === 'restart' ? 'Restarting...' : 'Restart'}</span>
                      </button>

                      <button
                        onClick={() => handleSpaceAction('install-deps')}
                        disabled={spaceActionLoading === 'install-deps'}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold font-mono text-white/80 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>{spaceActionLoading === 'install-deps' ? 'Installing...' : 'Synchronize Deps'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#0c0c0d] border border-white/10 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold mb-2 text-white flex items-center gap-2">
                      <span className="text-emerald-400">🔑</span> Space Secrets & Environment Variables
                    </h3>
                    <p className="text-xs text-white/50 mb-5 leading-relaxed">
                      Configure environment variables (such as <code className="text-emerald-400 font-mono text-[11px] bg-white/5 px-1.5 py-0.5 rounded">OG_COMPUTE_API_KEY</code>) for your Space. These will be injected into the running process.
                    </p>

                    {secretsError && (
                      <div className="mb-4 p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-xs text-red-400 font-mono">
                        ⚠️ {secretsError}
                      </div>
                    )}

                    {secretsLoading ? (
                      <div className="flex items-center gap-2 py-4 text-xs text-white/50 font-mono">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading secrets...</span>
                      </div>
                    ) : (
                      <form onSubmit={handleSaveSecrets} className="space-y-4">
                        {secrets.map((secret, index) => (
                          <div key={index} className="flex gap-3 items-end">
                            <div className="flex-1">
                              <label className="text-[10px] text-white/50 font-mono uppercase tracking-wider mb-1.5 block">Variable Name (Key)</label>
                              <input
                                type="text"
                                value={secret.key}
                                onChange={(e) => {
                                  const updated = [...secrets];
                                  updated[index].key = e.target.value;
                                  setSecrets(updated);
                                }}
                                placeholder="e.g. OG_COMPUTE_API_KEY"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-white/20 focus:outline-none focus:border-modal-green/50 transition-all"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] text-white/50 font-mono uppercase tracking-wider mb-1.5 block">Value</label>
                              <input
                                type="password"
                                value={secret.value}
                                onChange={(e) => {
                                  const updated = [...secrets];
                                  updated[index].value = e.target.value;
                                  setSecrets(updated);
                                }}
                                placeholder="••••••••••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-white/20 focus:outline-none focus:border-modal-green/50 transition-all"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSecrets(secrets.filter((_, idx) => idx !== index));
                              }}
                              className="px-3.5 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-700/40 text-red-400 text-xs font-semibold rounded-xl transition-all cursor-pointer h-[38px] flex items-center justify-center"
                              title="Delete Variable"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}

                        {secrets.length === 0 && (
                          <p className="text-xs text-white/30 italic py-2">No custom environment variables configured.</p>
                        )}

                        <div className="flex gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSecrets([...secrets, { key: '', value: '' }]);
                            }}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold font-mono text-white/80 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span>➕</span> Add Variable
                          </button>
                          <button
                            type="submit"
                            disabled={savingSecrets}
                            className="px-4 py-2 bg-modal-green text-black font-semibold text-xs rounded-xl hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-modal-green/10"
                          >
                            {savingSecrets ? 'Saving...' : '💾 Save Secrets'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {isOwner && (
                    <div className="bg-[#0c0c0d] border border-white/10 rounded-2xl p-5">
                      <h3 className="text-sm font-semibold mb-4 text-white">Owner Operations</h3>
                      <p className="text-xs text-white/50 mb-5 leading-relaxed">
                        Update the active on-chain status flags of the space registry. Make it discoverable on the Hub or completely deactivate it.
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          onClick={() => handleUpdateHealth(!space.isActive)}
                          disabled={updatingHealth || !signer}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold font-mono text-white/80 disabled:opacity-50 cursor-pointer transition-all"
                        >
                          {updatingHealth ? "Updating..." : space.isActive ? "Mark Offline" : "Mark Online"}
                        </button>
                        <button
                          onClick={handleDeactivate}
                          disabled={!signer}
                          className="px-4 py-2 bg-red-950/20 hover:bg-red-950/30 border border-red-900/40 text-red-400 font-semibold text-xs rounded-xl disabled:opacity-50 cursor-pointer transition-all"
                        >
                          Deactivate Space
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right metadata details */}
                <div className="space-y-6">
                  <div className="bg-[#0c0c0d] border border-white/10 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-modal-green" />
                      Registry Metadata
                    </h3>
                    
                    <div className="border-t border-white/5 pt-3">
                      <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider mb-1">Space Registry ID</p>
                      <p className="text-sm text-white font-mono">{space.spaceId}</p>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider mb-1">Model Registry ID</p>
                      <p className="text-sm text-white font-mono">{space.modelId}</p>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider mb-1">Creation Date</p>
                      <p className="text-sm text-white font-mono flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-white/40" />
                        {new Date(space.deployedAt * 1000).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider mb-1">On-Chain Verification</p>
                      <p className="text-sm text-white font-mono flex items-center gap-1.5 text-emerald-400">
                        <ShieldCheck className="w-4 h-4 fill-emerald-950/20" />
                        <span>Registry Validated</span>
                      </p>
                    </div>
                  </div>

                  {/* Wallet & Owner details */}
                  <div className="bg-[#0c0c0d] border border-white/10 rounded-2xl p-5 space-y-3">
                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4 h-4 text-modal-green" />
                      Access Control
                    </h3>
                    <div className="border-t border-white/5 pt-3">
                      <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider mb-1">Owner Address</p>
                      <p className="text-xs text-white/70 font-mono break-all leading-normal select-all bg-white/5 border border-white/10 p-2.5 rounded-xl">
                        {space.owner || 'N/A'}
                      </p>
                    </div>
                    {isOwner && (
                      <button
                        onClick={handleLaunchAgent}
                        disabled={!signer}
                        className="w-full mt-3 py-2 bg-modal-green/10 border border-modal-green/30 hover:bg-modal-green/20 rounded-xl text-xs font-semibold font-mono text-modal-green transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Launch On-Chain Agent
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      </main>
    </>
  );
}
