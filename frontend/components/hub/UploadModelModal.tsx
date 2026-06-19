"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { ModelCard, ModelMeta } from "@/types/model";
import type { JsonRpcSigner } from "ethers";
import { modelStorage } from "@/lib/modelStorage";
import { useModelRegistry } from "@/lib/useModelRegistry";
import { LICENSES, ARCHITECTURES } from "@/types/model";

interface UploadModelModalProps {
  signer: JsonRpcSigner | null;
  address: string | null;
  onClose: () => void;
  onSuccess: (model: ModelMeta) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function UploadModelModal({ signer, address, onClose, onSuccess }: UploadModelModalProps) {
  const [step, setStep] = useState<"form" | "uploading" | "registering" | "complete">("form");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [modelCard, setModelCard] = useState<ModelCard>({
    name: "",
    description: "",
    architecture: "",
    parameters: 0,
    license: "",
    tags: []
  });
  const [storageRootHash, setStorageRootHash] = useState<string>("");

  const { registerModel } = useModelRegistry();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    const primaryFile = acceptedFiles[0];
    if (primaryFile) {
      const nameWithoutExt = primaryFile.name.replace(/\.[^/.]+$/, "");
      setModelCard(prev => ({ ...prev, name: prev.name || nameWithoutExt }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
      "application/octet-stream": [".gguf", ".safetensors", ".bin"]
    },
    maxFiles: 5,
    multiple: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signer) {
      setError("Please connect your wallet");
      return;
    }
    
    if (!files.length) {
      setError("Please select at least one file");
      return;
    }
    
    if (!modelCard.name.trim()) {
      setError("Model name is required");
      return;
    }
    
    if (!modelCard.architecture) {
      setError("Architecture is required");
      return;
    }
    
    if (!modelCard.license) {
      setError("License is required");
      return;
    }

    setError(null);
    setStep("uploading");
    setStatus("Uploading to 0G Storage...");

    try {
      const primaryFile = files[0];
      const additionalFiles = files.slice(1);

      const result = await modelStorage.uploadModel(
        {
          modelCard,
          primaryFile,
          additionalFiles,
          onProgress: (stage, progress) => {
            setStatus(stage);
            if (progress !== undefined) {
              setStatus(`${stage} (${progress}%)`);
            }
          }
        },
        signer
      );

      setStorageRootHash(result.storageRootHash);
      setStep("registering");
      setStatus("Registering on-chain...");

      const uploadedModel = await registerModel(signer, modelCard, result.storageRootHash);
      
      setStep("complete");

      const modelMeta: ModelMeta = {
        modelId: uploadedModel.modelId,
        name: modelCard.name,
        description: modelCard.description,
        architecture: modelCard.architecture,
        parameters: modelCard.parameters,
        license: modelCard.license,
        storageRootHash: result.storageRootHash,
        creator: address || "",
        createdAt: Date.now(),
        downloadCount: 0,
        likeCount: 0,
        tags: modelCard.tags
      };

      onSuccess(modelMeta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStep("form");
    }
  };

  const handleClose = () => {
    setFiles([]);
    setModelCard({
      name: "",
      description: "",
      architecture: "",
      parameters: 0,
      license: "",
      tags: []
    });
    setStorageRootHash("");
    setStep("form");
    setStatus("");
    setError(null);
    onClose();
  };

  if (step === "uploading" || step === "registering") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-lg border border-coreed-line bg-coreed-panel p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-lg font-medium text-coreed-bone">
              Uploading Model
            </h2>
          </div>
          <div className="mb-6">
            <p className="font-mono text-sm text-coreed-sage">{status}</p>
            <div className="mt-4 h-2 w-full rounded-full bg-coreed-line/30">
              <div className="h-2 rounded-full bg-coreed-moss-bright transition-all duration-300" style={{ width: "100%" }} />
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-full rounded border border-coreed-clay px-4 py-2 font-mono text-xs text-coreed-clay hover:bg-coreed-panel-raised"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-lg border border-coreed-line bg-coreed-panel p-6 shadow-xl">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border border-coreed-moss-bright flex items-center justify-center">
              <span className="text-2xl text-coreed-moss-bright">✓</span>
            </div>
            <h2 className="font-mono text-lg font-medium text-coreed-bone">
              Model Uploaded Successfully!
            </h2>
            <p className="mt-2 text-sm text-coreed-sage">
              Your model has been uploaded to 0G Storage and registered on-chain.
            </p>
          </div>
          <div className="mb-6 rounded border border-coreed-line bg-coreed-void p-4">
            <p className="font-mono text-xs text-coreed-sage">Model ID</p>
            <p className="font-mono text-sm text-coreed-bone">{modelCard.name}</p>
            <p className="mt-2 font-mono text-xs text-coreed-sage truncate">
              Storage Hash: {storageRootHash.slice(0, 20)}...
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-full rounded border border-coreed-moss bg-coreed-panel-raised px-4 py-2 font-mono text-xs text-coreed-bone hover:border-coreed-moss-bright"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-coreed-line bg-coreed-panel p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-mono text-lg font-medium text-coreed-bone">
            Upload New Model
          </h2>
          <button
            onClick={handleClose}
            className="font-mono text-xl text-coreed-sage hover:text-coreed-bone"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded border border-coreed-clay bg-coreed-panel-raised p-3">
            <p className="font-mono text-xs text-coreed-clay" role="alert">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="model-name" className="mb-1.5 block font-mono text-xs text-coreed-sage">
              Model Name *
            </label>
            <input
              id="model-name"
              value={modelCard.name}
              onChange={(e) => setModelCard({ ...modelCard, name: e.target.value })}
              placeholder="e.g., FinanceBot-7B"
              maxLength={128}
              required
              className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone placeholder:text-coreed-sage/50 focus:border-coreed-moss"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block font-mono text-xs text-coreed-sage">
              Description
            </label>
            <textarea
              id="description"
              value={modelCard.description}
              onChange={(e) => setModelCard({ ...modelCard, description: e.target.value })}
              placeholder="Describe what this model does..."
              maxLength={2048}
              rows={3}
              className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone placeholder:text-coreed-sage/50 focus:border-coreed-moss resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="architecture" className="mb-1.5 block font-mono text-xs text-coreed-sage">
                Architecture *
              </label>
              <select
                id="architecture"
                value={modelCard.architecture}
                onChange={(e) => setModelCard({ ...modelCard, architecture: e.target.value })}
                required
                className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone focus:border-coreed-moss"
              >
                <option value="">Select architecture...</option>
                {ARCHITECTURES.map((arch) => (
                  <option key={arch} value={arch}>{arch}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="parameters" className="mb-1.5 block font-mono text-xs text-coreed-sage">
                Parameters
              </label>
              <input
                id="parameters"
                type="number"
                value={modelCard.parameters}
                onChange={(e) => setModelCard({ ...modelCard, parameters: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 7000000000"
                min={0}
                className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone placeholder:text-coreed-sage/50 focus:border-coreed-moss"
              />
            </div>
            <div>
              <label htmlFor="license" className="mb-1.5 block font-mono text-xs text-coreed-sage">
                License *
              </label>
              <select
                id="license"
                value={modelCard.license}
                onChange={(e) => setModelCard({ ...modelCard, license: e.target.value })}
                required
                className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone focus:border-coreed-moss"
              >
                <option value="">Select license...</option>
                {LICENSES.map((license) => (
                  <option key={license} value={license}>{license}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tags" className="mb-1.5 block font-mono text-xs text-coreed-sage">
                Tags (comma separated)
              </label>
              <input
                id="tags"
                value={modelCard.tags?.join(", ") || ""}
                onChange={(e) => setModelCard({ ...modelCard, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                placeholder="e.g., finance, analysis, llm"
                className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone placeholder:text-coreed-sage/50 focus:border-coreed-moss"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-xs text-coreed-sage">
              Model Files *
            </label>
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors ${
                isDragActive
                  ? "border-coreed-moss-bright bg-coreed-panel-raised"
                  : "border-coreed-line bg-coreed-void"
              } ${files.length > 0 ? "border-coreed-moss" : ""}`}
            >
              <input {...getInputProps()} />
              {files.length === 0 ? (
                <>
                  <span className="font-mono text-sm text-coreed-bone">
                    Drag & drop files here, or click to browse
                  </span>
                  <span className="font-mono text-xs text-coreed-sage">
                    Supports: .gguf, .safetensors, .bin, .json
                  </span>
                </>
              ) : (
                <div className="w-full space-y-2">
                  <p className="font-mono text-sm text-coreed-bone">
                    {files.length} file(s) selected
                  </p>
                  <ul className="space-y-1">
                    {files.map((file, index) => (
                      <li key={index} className="font-mono text-xs text-coreed-sage truncate max-w-full">
                        {file.name} ({formatFileSize(file.size)})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded border border-coreed-line px-4 py-2 font-mono text-xs text-coreed-sage hover:border-coreed-moss hover:text-coreed-bone"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!signer || !files.length || !modelCard.name.trim() || !modelCard.architecture || !modelCard.license}
              className="rounded border border-coreed-line bg-coreed-panel-raised px-4 py-2 font-mono text-xs text-coreed-bone transition-colors hover:border-coreed-moss disabled:cursor-not-allowed disabled:opacity-50"
            >
              Upload Model
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
