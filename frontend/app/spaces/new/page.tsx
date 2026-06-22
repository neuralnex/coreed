"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import { useAgentSpaceRegistry } from "@/lib/useAgentSpaceRegistry";
import { Terminal, FileCode, Box } from "lucide-react";
import { SPACE_TEMPLATES, type DeploymentConfig } from "@/types/space";

export default function NewSpacePage() {
  const router = useRouter();
  const { signer, isConnected } = useWalletContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { deploySpace, setSleepTimeout } = useAgentSpaceRegistry();

  const [formData, setFormData] = useState<DeploymentConfig & { name: string; description: string; modelId: string; endpointUrl: string }>({
    modelId: "",
    name: "",
    description: "",
    version: "1.0.0",
    runtime: "python",
    template: "gradio",
    port: 7860,
    healthEndpoint: "/health",
    endpointUrl: "",
    sleepTimeout: 0,
    autoSleep: false
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }, []);

  const handleTemplateChange = useCallback((templateName: string) => {
    const template = SPACE_TEMPLATES[templateName as keyof typeof SPACE_TEMPLATES];
    if (template) {
      setFormData(prev => ({
        ...prev,
        template: templateName,
        runtime: template.runtime,
        port: template.port,
        healthEndpoint: template.healthEndpoint
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signer) {
      setError("Please connect your wallet first");
      return;
    }

    if (!formData.name || !formData.endpointUrl) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Deploy the space
      const result = await deploySpace(signer, {
        name: formData.name,
        description: formData.description,
        version: formData.version,
        modelId: formData.modelId ? parseInt(formData.modelId) : 0,
        endpointUrl: formData.endpointUrl
      });

      if (formData.autoSleep && Number(formData.sleepTimeout) > 0) {
        await setSleepTimeout(signer, result.spaceId, Number(formData.sleepTimeout));
      }

      setSuccess(`Space deployed successfully! Space ID: ${result.spaceId}`);
      setFormData({
        modelId: "",
        name: "",
        description: "",
        version: "1.0.0",
        runtime: "python",
        template: "gradio",
        port: 7860,
        healthEndpoint: "/health",
        endpointUrl: "",
        sleepTimeout: 0,
        autoSleep: false
      });

      // Redirect to spaces page after a delay
      setTimeout(() => {
        router.push(`/spaces`);
      }, 2000);
      
    } catch (err) {
      console.error("Failed to deploy space:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.endpointUrl;

  // Show template selection UI
  if (!formData.template) {
    return (
      <main className="mx-auto flex max-w-4xl flex-1 flex-col px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-coreed-moss-bright to-coreed-clay bg-clip-text text-transparent mb-2">
            DEPLOY NEW SPACE
          </h1>
          <p className="text-coreed-sage">
            Choose a template to get started
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          <Link
            href="/spaces"
            className="px-4 py-2 text-coreed-sage hover:bg-coreed-panel-raised rounded-md text-sm transition-colors"
          >
            ← Back to Spaces
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(SPACE_TEMPLATES).map(([name, template]) => (
            <button
              key={name}
              onClick={() => handleTemplateChange(name)}
              className="p-6 bg-coreed-panel-raised border border-coreed-line/30 rounded-lg hover:border-coreed-moss-bright transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-coreed-moss/20 rounded-lg flex items-center justify-center">
                  {template.runtime === "python" ? <Terminal className="w-6 h-6 text-coreed-moss-bright" /> : template.runtime === "node" ? <FileCode className="w-6 h-6 text-coreed-moss-bright" /> : <Box className="w-6 h-6 text-coreed-moss-bright" />}
                </div>
                <div>
                  <h3 className="font-semibold text-coreed-bone mb-1">{template.name}</h3>
                  <p className="text-sm text-coreed-sage/70">{template.description}</p>
                  <div className="flex gap-2 mt-2 text-xs text-coreed-sage/50">
                    <span>{template.runtime}</span>
                    <span>• Port: {template.port}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  // Show main deployment form
  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-coreed-moss-bright to-coreed-clay bg-clip-text text-transparent mb-2">
          DEPLOY NEW SPACE
        </h1>
        <p className="text-coreed-sage">
          Deploy a live app space. You can load open-source models at runtime or run a simple app without registering a model.
        </p>
      </div>

      <div className="flex gap-2 mb-8">
        <Link
          href="/spaces"
          className="px-4 py-2 text-coreed-sage hover:bg-coreed-panel-raised rounded-md text-sm transition-colors"
        >
          ← Back to Spaces
        </Link>
        <button
          onClick={() => setFormData({ ...formData, template: "" })}
          className="px-4 py-2 text-coreed-sage hover:bg-coreed-panel-raised rounded-md text-sm transition-colors"
        >
          Change Template
        </button>
      </div>

      <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg p-4 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Info */}
          <div className="p-4 bg-coreed-panel border border-coreed-line/20 rounded-lg mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-coreed-moss/20 rounded-lg flex items-center justify-center">
                {formData.runtime === "python" ? <Terminal className="w-5 h-5 text-coreed-moss-bright" /> : formData.runtime === "node" ? <FileCode className="w-5 h-5 text-coreed-moss-bright" /> : <Box className="w-5 h-5 text-coreed-moss-bright" />}
              </div>
              <div>
                <h3 className="font-semibold text-coreed-bone">{SPACE_TEMPLATES[formData.template as keyof typeof SPACE_TEMPLATES].name}</h3>
                <p className="text-sm text-coreed-sage/70">
                  {SPACE_TEMPLATES[formData.template as keyof typeof SPACE_TEMPLATES].description}
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-coreed-bone mb-4">
              Basic Information
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="name">
                Space Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="My Agent Space"
                required
                className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="A description of your agent space..."
                rows={3}
                className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="modelId">
                Registered Model ID
              </label>
              <input
                id="modelId"
                name="modelId"
                type="number"
                min={0}
                value={formData.modelId}
                onChange={handleChange}
                placeholder="Optional. Leave empty for a standalone Space."
                className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright"
              />
              <p className="text-xs text-coreed-sage/60 mt-2">
                Most Spaces should leave this empty and load models from code, package dependencies, or external open-source sources.
              </p>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4 pt-6 border-t border-coreed-line/30">
            <h2 className="text-lg font-semibold text-coreed-bone mb-4">
              Configuration
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="version">
                  Version
                </label>
                <input
                  id="version"
                  name="version"
                  type="text"
                  value={formData.version}
                  onChange={handleChange}
                  placeholder="1.0.0"
                  className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="port">
                  Port
                </label>
                <input
                  id="port"
                  name="port"
                  type="number"
                  value={formData.port}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="healthEndpoint">
                  Health Endpoint
                </label>
                <input
                  id="healthEndpoint"
                  name="healthEndpoint"
                  type="text"
                  value={formData.healthEndpoint}
                  onChange={handleChange}
                  placeholder="/health"
                  className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="endpointUrl">
                  Endpoint URL *
                </label>
                <input
                  id="endpointUrl"
                  name="endpointUrl"
                  type="url"
                  value={formData.endpointUrl}
                  onChange={handleChange}
                  placeholder="https://my-agent.example.com"
                  required
                  className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright"
                />
                <p className="text-xs text-coreed-sage/60 mt-2">
                  Deploy your app with a reachable health endpoint before registering it on-chain.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="block text-sm font-medium text-coreed-bone/70 cursor-pointer">
                  <input
                    type="checkbox"
                    name="autoSleep"
                    checked={formData.autoSleep}
                    onChange={handleChange}
                    className="mr-2 accent-coreed-moss"
                  />
                  Auto-Sleep
                </label>
              </div>

              {formData.autoSleep && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="sleepTimeout">
                    Sleep Timeout (seconds)
                  </label>
                  <input
                    id="sleepTimeout"
                    name="sleepTimeout"
                    type="number"
                    value={formData.sleepTimeout}
                    onChange={handleChange}
                    placeholder="3600"
                    className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright"
                  />
                  <p className="text-xs text-coreed-sage/60 mt-2">
                    Space will automatically sleep after this period of inactivity
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 bg-coreed-clay/10 border border-coreed-clay/30 rounded-md">
              <p className="text-sm text-coreed-clay">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-coreed-moss/10 border border-coreed-moss/30 rounded-md">
              <p className="text-sm text-coreed-moss-bright">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              disabled={!isConnected || loading || !isFormValid}
              className="flex-1 px-6 py-3 bg-coreed-moss hover:bg-coreed-moss-bright disabled:bg-coreed-line disabled:cursor-not-allowed text-coreed-void rounded-md font-medium transition-colors"
            >
              {loading ? "Deploying..." : "Deploy Space"}
            </button>
            <Link
              href="/spaces"
              className="px-6 py-3 bg-coreed-panel-raised border border-coreed-line/30 text-coreed-bone rounded-md font-medium hover:border-coreed-line transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>

        {!isConnected && (
          <div className="mt-6 p-4 bg-coreed-panel-raised border border-coreed-clay/20 rounded-md">
            <p className="text-sm text-coreed-sage">
              Connect your wallet to deploy spaces
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
