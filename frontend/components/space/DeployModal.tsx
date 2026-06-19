"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useAgentSpaceRegistry } from "@/lib/useAgentSpaceRegistry";
import { useModelRegistry } from "@/lib/useModelRegistry";
import { SPACE_TEMPLATES, RUNTIME_OPTIONS } from "@/types/space";
import type { JsonRpcSigner } from "ethers";

interface DeployModalProps {
  signer: JsonRpcSigner | null;
  address: string | null;
  onClose: () => void;
  onDeploySuccess: (spaceId: string) => void;
}

export function DeployModal({ signer, address, onClose, onDeploySuccess }: DeployModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [runtime, setRuntime] = useState<string>("python");
  const [template, setTemplate] = useState<string>("fastapi");
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { deploySpace } = useAgentSpaceRegistry();
  const { getModelsByCreator } = useModelRegistry();

  const [models, setModels] = useState<Array<{ modelId: string; name: string }>>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Load user's models
  const loadModels = useCallback(async () => {
    if (!address) return;
    setLoadingModels(true);
    try {
      const userModels = await getModelsByCreator(address);
      setModels(userModels.map(m => ({ modelId: m.modelId, name: m.name })));
    } catch (err) {
      console.error("Failed to load models:", err);
    } finally {
      setLoadingModels(false);
    }
  }, [address, getModelsByCreator]);

  // Available templates for selected runtime
  const availableTemplates = RUNTIME_OPTIONS.includes(runtime as any)
    ? Object.entries(SPACE_TEMPLATES).filter(([_, t]) => t.runtime === runtime).map(([key]) => key)
    : [];

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signer || !name || !selectedModelId || !endpointUrl) {
      setError("Please fill in all required fields");
      return;
    }

    setDeploying(true);
    setError(null);

    try {
      const result = await deploySpace(signer, {
        name,
        description,
        version,
        modelId: selectedModelId,
        endpointUrl
      });
      
      onDeploySuccess(result.spaceId);
      onClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deployment failed");
    } finally {
      setDeploying(false);
    }
  };

  const handleRuntimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRuntime = e.target.value;
    setRuntime(newRuntime);
    // Switch to a compatible template
    const firstTemplate = Object.entries(SPACE_TEMPLATES)
      .find(([_, t]) => t.runtime === newRuntime)?.[0];
    if (firstTemplate) {
      setTemplate(firstTemplate);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-coreed-void rounded-lg border border-coreed-line max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-mono text-lg font-medium text-coreed-bone">
                Deploy Agent Space
              </h2>
              <p className="font-mono text-xs text-coreed-sage mt-1">
                Create a live deployment of your AI agent
              </p>
            </div>
            <button
              onClick={onClose}
              className="font-mono text-xs text-coreed-sage hover:text-coreed-bone"
            >
              ✕ Close
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded border border-coreed-clay bg-coreed-panel-raised p-3">
              <p className="font-mono text-xs text-coreed-clay" role="alert">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleDeploy} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block font-mono text-xs text-coreed-sage">
                Space Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My AI Agent"
                maxLength={128}
                className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone placeholder:text-coreed-sage/50 focus:border-coreed-moss"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block font-mono text-xs text-coreed-sage">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A chatbot powered by my LLM model..."
                maxLength={2048}
                rows={3}
                className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone placeholder:text-coreed-sage/50 focus:border-coreed-moss resize-none"
              />
            </div>

            {/* Version */}
            <div>
              <label className="mb-1.5 block font-mono text-xs text-coreed-sage">
                Version
              </label>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone placeholder:text-coreed-sage/50 focus:border-coreed-moss"
              />
            </div>

            {/* Model Selection */}
            <div>
              <label className="mb-1.5 block font-mono text-xs text-coreed-sage">
                Model *
              </label>
              {loadingModels ? (
                <div className="rounded border border-coreed-line bg-coreed-void px-3 py-2">
                  <p className="font-mono text-xs text-coreed-sage/70">Loading your models...</p>
                </div>
              ) : models.length === 0 ? (
                <div className="rounded border border-coreed-line bg-coreed-void px-3 py-2">
                  <p className="font-mono text-xs text-coreed-sage/70">
                    No models found. <a href="/hub/my-models" className="text-coreed-moss-bright underline">Upload a model first</a>
                  </p>
                </div>
              ) : (
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone focus:border-coreed-moss"
                >
                  <option value="">Select a model...</option>
                  {models.map((model) => (
                    <option key={model.modelId} value={model.modelId}>
                      {model.name} (ID: {model.modelId})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Runtime & Template */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block font-mono text-xs text-coreed-sage">
                  Runtime
                </label>
                <select
                  value={runtime}
                  onChange={handleRuntimeChange}
                  className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone focus:border-coreed-moss"
                >
                  {RUNTIME_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-xs text-coreed-sage">
                  Template
                </label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone focus:border-coreed-moss"
                >
                  {availableTemplates.map((t) => (
                    <option key={t} value={t}>
                      {SPACE_TEMPLATES[t].name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Endpoint URL */}
            <div>
              <label className="mb-1.5 block font-mono text-xs text-coreed-sage">
                Endpoint URL *
              </label>
              <input
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://my-agent.example.com or http://localhost:8000"
                className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone placeholder:text-coreed-sage/50 focus:border-coreed-moss"
              />
              <p className="mt-1 font-mono text-xs text-coreed-sage/70">
                Your agent must have a /health endpoint
              </p>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={deploying}
                className="rounded border border-coreed-line px-4 py-2 font-mono text-xs text-coreed-sage hover:border-coreed-moss disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deploying || !name || !selectedModelId || !endpointUrl}
                className="rounded border border-coreed-moss bg-coreed-panel-raised px-4 py-2 font-mono text-xs text-coreed-bone hover:border-coreed-moss-bright disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deploying ? "Deploying..." : "Deploy Space"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
