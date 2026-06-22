"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import { useAgentSpaceRegistry } from "@/lib/useAgentSpaceRegistry";
import { Check, Code, Container, FileText, GitBranch, Globe, Lock, Users } from "lucide-react";

export default function NewSpacePage() {
  const router = useRouter();
  const { address, isConnected, signer } = useWalletContext();
  const { deploySpace } = useAgentSpaceRegistry();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSdkDropdown, setShowSdkDropdown] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sdk: "gradio",
    visibility: "public",
    license: "mit",
  });

  // SDK options
  const sdkOptions = [
    { value: "gradio", label: "Gradio", icon: Code },
    { value: "docker", label: "Docker", icon: Container },
    { value: "static", label: "Static", icon: FileText },
  ];

  // Visibility options
  const visibilityOptions = [
    { value: "public", label: "Public", description: "Anyone can see this Space", icon: Globe, pro: false },
    { value: "protected", label: "Protected", description: "App is public, code is private", icon: Lock, pro: true },
    { value: "private", label: "Private", description: "Only you can see and access", icon: Users, pro: true },
  ] as const;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSdkSelect = (sdk: string) => {
    setFormData(prev => ({ ...prev, sdk: sdk }));
    setShowSdkDropdown(false);
  };

  const handleVisibilitySelect = (visibility: string) => {
    setFormData(prev => ({ ...prev, visibility: visibility }));
    setShowVisibilityDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!formData.name) {
      setError("Please enter a space name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      
      // ========================================================================
      // STEP 1: Create Git repo + 0G Compute setup (fast, main workflow)
      // ========================================================================
      const computeResponse = await fetch('/api/spaces/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          sdk: formData.sdk,
          template: formData.sdk === 'gradio' ? 'blank' : undefined,
          owner: address,
          slug: slug,
          skipOnChain: true
        })
      });

      const computeData = await computeResponse.json();
      setLoading(false);
      
      // Check if space creation was successful
      if (!computeResponse.ok || !computeData.success) {
        setError(computeData.error || 'Space creation failed');
        return;
      }

      // Store complete info in session storage to show on space page
      sessionStorage.setItem('lastSpaceInfo', JSON.stringify({
        spaceId: slug,
        compute: computeData.compute,
        deployment: computeData.deployment,
        repo: computeData.space?.gitRepo
      }));
      
      // ========================================================================
      // STEP 2: Try on-chain registration in background (non-blocking)
      // ========================================================================
      if (signer) {
        deploySpace(signer, {
          name: formData.name,
          description: formData.description,
          version: "1.0.0",
          modelId: 0,
          endpointUrl: `https://${slug}.coreed.app`
        }).catch(err => console.log('On-chain registration failed (optional):', err));
      }
      
      // Redirect to the new space with success
      router.push(`/spaces/${slug}`);
      
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const isFormValid = formData.name && address;

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create a new Space</h1>
        <p className="text-gray-400 text-sm">
          Spaces are Git repositories that host application code for Machine Learning demos.
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Enter a name below and we&apos;ll create a Git repository on the platform automatically.
        </p>
        <p className="text-gray-400 text-sm mt-1">
          You can build Spaces with Python libraries like Gradio, or using Docker images.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Owner Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Owner</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">@</span>
          </div>
          <div>
            <div className="text-white font-medium">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</div>
            <div className="text-gray-500 text-sm">Connected wallet</div>
          </div>
        </div>
        {!isConnected && (
          <div className="mt-2 text-yellow-500 text-sm">
            Connect your wallet to create a Space
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Space Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Space name *
          </label>
          <div className="relative">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="my-space"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Use lowercase letters, numbers, and hyphens. Must start with a letter.
          </p>
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Short description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="A short description of your Space..."
            rows={3}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <p className="text-gray-500 text-xs mt-1">
            This will appear in the Space card. Max 200 characters.
          </p>
        </div>

        {/* License */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            License
          </label>
          <select
            name="license"
            value={formData.license}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="mit">MIT</option>
            <option value="apache-2.0">Apache 2.0</option>
            <option value="gpl-3.0">GPL 3.0</option>
            <option value="bsd-3-clause">BSD 3-Clause</option>
            <option value="none">None</option>
          </select>
        </div>

        {/* Select SDK */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Select the Space SDK
          </label>
          <p className="text-gray-500 text-sm mb-3">
            You can choose between Gradio, Docker, or Static to host your Space.
          </p>
          
          <div className="space-y-3">
            {sdkOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSdkSelect(option.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  formData.sdk === option.value
                    ? "border-blue-500 bg-blue-900/20 ring-2 ring-blue-500"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <option.icon className="w-6 h-6 text-gray-400" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">{option.label}</div>
                  <div className="text-gray-500 text-sm">
                    {option.value === "gradio" ? "Interactive UI with Python" : 
                     option.value === "docker" ? "Custom Docker container" : 
                     "Static HTML/CSS/JS"}
                  </div>
                </div>
                {formData.sdk === option.value && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Choose Template (for Gradio) */}
        {formData.sdk === "gradio" && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Choose a Gradio template:
            </label>
            <div className="grid md:grid-cols-2 gap-3">
              <button
                type="button"
                className="p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors text-left"
              >
                <div className="font-medium text-white mb-1">Blank</div>
                <div className="text-gray-500 text-sm">Start from scratch</div>
              </button>
              <button
                type="button"
                className="p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors text-left"
              >
                <div className="font-medium text-white mb-1">Chatbot</div>
                <div className="text-gray-500 text-sm">Simple chat interface</div>
              </button>
            </div>
          </div>
        )}

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Visibility
          </label>
          <p className="text-gray-500 text-sm mb-3">
            Choose who can see and access your Space.
          </p>
          
          <div className="space-y-3">
            {visibilityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.pro && handleVisibilitySelect(option.value)}
                disabled={option.pro}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  formData.visibility === option.value
                    ? "border-blue-500 bg-blue-900/20 ring-2 ring-blue-500"
                    : "border-gray-700 hover:border-gray-600"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option.icon className="w-6 h-6 text-gray-400" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">{option.label}</div>
                  <div className="text-gray-500 text-sm">{option.description}</div>
                </div>
                {formData.visibility === option.value && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
                {option.pro && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded">PRO</span>
                )}
              </button>
            ))}
          </div>
          
          <p className="text-gray-500 text-xs mt-2">
            Tip: Install the official Coreed CLI so your AI agents can manage Spaces directly.
          </p>
        </div>

        {/* Submit */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={!isConnected || loading || !isFormValid}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Creating Space..." : "Create Space"}
          </button>
          
          <div className="mt-4 text-center">
            <Link
              href="/spaces"
              className="text-gray-500 hover:text-white text-sm transition-colors"
            >
              Cancel and go back to Spaces
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}
