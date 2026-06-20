"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import { ModelCard } from "@/components/hub/ModelCard";
import { useModelRegistry } from "@/lib/useModelRegistry";
import type { ModelMeta } from "@/types/model";

export default function MyModelsPage() {
  const { address, isConnected, signer } = useWalletContext();
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [loading, setLoading] = useState(true);

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
  };

  if (!isConnected || !address) {
    return (
      <main className="mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center px-6 py-12">
        <p className="mb-4 text-coreed-sage">
          Please connect your wallet to view your models.
        </p>
        <Link
          href="/hub"
          className="px-4 py-2 bg-coreed-moss hover:bg-coreed-moss-bright text-coreed-void rounded-md text-sm transition-colors"
        >
          Back to Hub
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-coreed-moss-bright to-coreed-clay bg-clip-text text-transparent mb-2">
          MY MODELS
        </h1>
        <p className="text-coreed-sage">
          {models.length} {models.length === 1 ? "model" : "models"} registered by you
        </p>
      </div>

      <div className="flex gap-2 mb-8">
        <Link
          href="/hub"
          className="px-4 py-2 text-coreed-sage hover:bg-coreed-panel-raised rounded-md text-sm transition-colors"
        >
          ← Back to Hub
        </Link>
        <Link
          href="/hub/models/new"
          className="px-4 py-2 bg-coreed-moss hover:bg-coreed-moss-bright text-coreed-void rounded-md text-sm transition-colors"
        >
          + Upload Model
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded border border-coreed-clay bg-coreed-panel-raised p-4">
          <p className="font-mono text-sm text-coreed-clay" role="alert">
            {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-coreed-sage coreed-pulse">Loading your models...</p>
        </div>
      ) : (
        <>
          {models.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-xl text-coreed-sage/70 mb-2">
                  No models yet
                </p>
                <p className="text-coreed-sage/50 text-sm mb-4">
                  Upload your first model to get started
                </p>
                <Link
                  href="/hub/models/new"
                  className="inline-block px-4 py-2 bg-coreed-moss hover:bg-coreed-moss-bright text-coreed-void rounded-md text-sm transition-colors"
                >
                  Upload Model
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {models.map((model) => (
                  <ModelCard key={model.modelId} model={model} />
                ))}
              </div>

              {/* Stats */}
              <div className="mt-8 pt-6 border-t border-coreed-line/30 text-center text-sm text-coreed-sage">
                Showing {models.length} model{models.length !== 1 ? "s" : ""}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}