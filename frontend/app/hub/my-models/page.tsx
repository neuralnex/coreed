"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusStrip } from "@/components/StatusStrip";
import { ModelCard } from "@/components/hub/ModelCard";
import { UploadModelModal } from "@/components/hub/UploadModelModal";
import { useModelRegistry } from "@/lib/useModelRegistry";
import type { ModelMeta } from "@/types/model";
import type { JsonRpcSigner } from "ethers";

export default function MyModelsPage() {
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { getModelsByCreator, error } = useModelRegistry();

  useEffect(() => {
    if (address) {
      const fetchModels = async () => {
        try {
          setLoading(true);
          const userModels = await getModelsByCreator(address);
          setModels(userModels);
        } catch (err) {
          console.error("Failed to fetch user models:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchModels();
    } else {
      setModels([]);
      setLoading(false);
    }
  }, [address, getModelsByCreator]);

  const handleSuccess = (newModel: ModelMeta) => {
    setModels([newModel, ...models]);
    setShowUploadModal(false);
  };

  if (!address) {
    return (
      <>
        <StatusStrip
          address={address}
          onConnect={(s, addr) => {
            setSigner(s);
            setAddress(addr);
          }}
        />
        <main className="mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center px-6 py-12">
          <p className="mb-4 font-mono text-coreed-sage">
            Please connect your wallet to view your models.
          </p>
          <Link
            href="/hub"
            className="rounded border border-coreed-line px-4 py-2 font-mono text-xs text-coreed-sage hover:border-coreed-moss hover:text-coreed-bone"
          >
            ← Back to Hub
          </Link>
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
      {showUploadModal && (
        <UploadModelModal
          signer={signer}
          address={address}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      <main className="mx-auto flex max-w-6xl flex-1 flex-col px-6 py-12">
        <div className="mb-8">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="font-mono text-2xl font-medium tracking-tight text-coreed-bone">
                my models
              </h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-coreed-sage">
                Manage your uploaded models.
              </p>
            </div>
            <Link
              href="/hub"
              className="font-mono text-xs text-coreed-sage hover:text-coreed-bone"
            >
              ← back to hub
            </Link>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="rounded border border-coreed-line bg-coreed-panel-raised px-3 py-1.5 font-mono text-xs text-coreed-bone hover:border-coreed-moss"
          >
            + Upload New Model
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded border border-coreed-clay bg-coreed-panel-raised p-4">
            <p className="font-mono text-xs text-coreed-clay" role="alert">
              {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-mono text-coreed-sage coreed-pulse">Loading your models...</p>
          </div>
        ) : models.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center rounded border border-coreed-line bg-coreed-panel p-12">
            <p className="mb-4 font-mono text-coreed-sage">
              You haven't uploaded any models yet.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="rounded border border-coreed-line bg-coreed-panel-raised px-4 py-2 font-mono text-xs text-coreed-bone hover:border-coreed-moss"
            >
              Upload Your First Model
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <ModelCard key={model.modelId} model={model} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
