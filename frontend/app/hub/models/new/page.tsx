"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import { useModelRegistry } from "@/lib/useModelRegistry";
import { LICENSES, ARCHITECTURES } from "@/types/model";

export default function NewModelPage() {
  const router = useRouter();
  const { signer, isConnected } = useWalletContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { registerModel } = useModelRegistry();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    architecture: "",
    parameters: "",
    license: "MIT",
    tags: "" as string | string[],
    storageRootHash: "",
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleTagChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert comma-separated string to array
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, tags: tagsArray }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signer) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare model card data
      const modelCard = {
        name: formData.name,
        description: formData.description,
        architecture: formData.architecture,
        parameters: formData.parameters ? parseInt(formData.parameters) : 0,
        license: formData.license,
        tags: typeof formData.tags === 'string' ? formData.tags.split(',').map(t => t.trim()) : formData.tags,
      };

      // Register the model
      const result = await registerModel(signer, modelCard, formData.storageRootHash);
      
      // Wait for transaction to complete
      // Note: In production, you'd want to show a transaction pending state
      // and wait for confirmation
      
      setError(null);
      router.push(`/hub/my-models`);
      
    } catch (err) {
      console.error("Failed to register model:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.storageRootHash;

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-coreed-moss-bright to-coreed-clay bg-clip-text text-transparent mb-2">
          REGISTER NEW MODEL
        </h1>
        <p className="text-coreed-sage">
          Upload your AI model metadata to Coreed
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 mb-8">
        <Link
          href="/hub"
          className="px-4 py-2 text-coreed-sage hover:bg-coreed-panel-raised rounded-md text-sm transition-colors"
        >
          ← Back to Hub
        </Link>
      </div>

      <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg p-8 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-coreed-bone">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="name">
                Model Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="My AI Model"
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
                placeholder="A description of your AI model..."
                rows={3}
                className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright resize-none"
              />
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-4 pt-6 border-t border-coreed-line/30">
            <h2 className="text-lg font-semibold text-coreed-bone">Technical Details</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="architecture">
                  Architecture
                </label>
                <select
                  id="architecture"
                  name="architecture"
                  value={formData.architecture}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright"
                >
                  <option value="">Select Architecture</option>
                  {ARCHITECTURES.map((arch) => (
                    <option key={arch} value={arch}>{arch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="license">
                  License
                </label>
                <select
                  id="license"
                  name="license"
                  value={formData.license}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright"
                >
                  {LICENSES.map((license) => (
                    <option key={license} value={license}>{license}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="parameters">
                  Parameters (count)
                </label>
                <input
                  id="parameters"
                  name="parameters"
                  type="number"
                  value={formData.parameters}
                  onChange={handleChange}
                  placeholder="7000000000"
                  className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="tags">
                  Tags (comma separated)
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={typeof formData.tags === 'string' ? formData.tags : formData.tags.join(', ') || ''}
                  onChange={handleTagChange}
                  placeholder="llm, text-generation, qwen"
                  className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright"
                />
              </div>
            </div>
          </div>

          {/* Storage Information */}
          <div className="space-y-4 pt-6 border-t border-coreed-line/30">
            <h2 className="text-lg font-semibold text-coreed-bone">Storage Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-coreed-bone/70 mb-2" htmlFor="storageRootHash">
                0G Storage Root Hash *
              </label>
              <input
                id="storageRootHash"
                name="storageRootHash"
                type="text"
                value={formData.storageRootHash}
                onChange={handleChange}
                placeholder="0x..."
                required
                className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright font-mono"
              />
              <p className="text-xs text-coreed-sage/60 mt-2">
                Upload your model to 0G Storage first and provide the root hash
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-coreed-clay/10 border border-coreed-clay/30 rounded-md">
              <p className="text-sm text-coreed-clay">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={!isConnected || loading || !isFormValid}
              className="flex-1 px-6 py-3 bg-coreed-moss hover:bg-coreed-moss-bright disabled:bg-coreed-line disabled:cursor-not-allowed text-coreed-void rounded-md font-medium transition-colors"
            >
              {loading ? "Registering..." : "Register Model"}
            </button>
            <Link
              href="/hub"
              className="px-6 py-3 bg-coreed-panel-raised border border-coreed-line/30 text-coreed-bone rounded-md font-medium hover:border-coreed-line transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>

        {!isConnected && (
          <div className="mt-6 p-4 bg-coreed-panel-raised border border-coreed-clay/20 rounded-md">
            <p className="text-sm text-coreed-sage">
              Connect your wallet to register models
            </p>
          </div>
        )}
      </div>
    </main>
  );
}