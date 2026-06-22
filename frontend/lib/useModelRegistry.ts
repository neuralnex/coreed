"use client";

import { useCallback, useState } from "react";
import { Contract, JsonRpcProvider, type JsonRpcSigner } from "ethers";
import modelRegistryAbi from "./modelRegistryAbi.json";
import { GALILEO_RPC_URL } from "./wallet";
import type { ModelCard, ModelMeta, UploadModelResult, SearchFilters, SearchResults } from "@/types/model";

const MODEL_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_MODEL_REGISTRY_ADDRESS ?? "";

function getReadProvider(): JsonRpcProvider {
  return new JsonRpcProvider(GALILEO_RPC_URL);
}

function getContract(signerOrProvider: JsonRpcSigner | JsonRpcProvider): Contract {
  if (!MODEL_REGISTRY_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_MODEL_REGISTRY_ADDRESS is not set. Deploy ModelRegistry.sol and add the address to frontend/.env.local."
    );
  }
  return new Contract(MODEL_REGISTRY_ADDRESS, modelRegistryAbi, signerOrProvider);
}

export function useModelRegistry() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerModel = useCallback(
    async (
      signer: JsonRpcSigner,
      modelCard: ModelCard,
      storageRootHash: string
    ): Promise<UploadModelResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(signer);
        const tx = await contract.registerModel(
          modelCard.name,
          modelCard.description || "",
          modelCard.architecture,
          modelCard.parameters,
          modelCard.license,
          storageRootHash
        );
        const receipt = await tx.wait();

        const registeredEvent = receipt.logs
          .map((log: unknown) => {
            try {
              return contract.interface.parseLog(log as { topics: string[]; data: string });
            } catch {
              return null;
            }
          })
          .find((parsed: { name: string } | null) => parsed?.name === "ModelRegistered");

        if (!registeredEvent) {
          throw new Error("ModelRegistered event not found in transaction receipt.");
        }

        return {
          modelId: registeredEvent.args.modelId.toString(),
          storageRootHash,
          txHash: receipt.hash
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Registration failed");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getModel = useCallback(async (modelId: string | number): Promise<ModelMeta> => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(getReadProvider());
      const result = await contract.getModel(modelId);

      return {
        modelId: modelId.toString(),
        name: result.name,
        description: result.description,
        architecture: result.architecture,
        parameters: Number(result.parameters),
        license: result.license,
        storageRootHash: result.storageRootHash,
        creator: result.creator,
        createdAt: Number(result.createdAt),
        downloadCount: Number(result.downloadCount),
        likeCount: Number(result.likeCount)
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch model");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getModelsByCreator = useCallback(async (creator: string): Promise<ModelMeta[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(getReadProvider());
      const modelIds: bigint[] = await contract.getModelsByCreator(creator);
      
      const models = await Promise.all(
        modelIds.map(async (id) => {
          const result = await contract.getModel(id);
          return {
            modelId: id.toString(),
            name: result.name,
            description: result.description,
            architecture: result.architecture,
            parameters: Number(result.parameters),
            license: result.license,
            storageRootHash: result.storageRootHash,
            creator: result.creator,
            createdAt: Number(result.createdAt),
            downloadCount: Number(result.downloadCount),
            likeCount: Number(result.likeCount)
          };
        })
      );

      return models;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch creator models");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchModels = useCallback(async (filters: SearchFilters): Promise<SearchResults> => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(getReadProvider());
      const totalModels: bigint = await contract.totalModels();
      const total = Number(totalModels);

      const page = filters.sortBy === "recent" ? 1 : (filters.sortBy === "popular" ? 2 : 1);
      const pageSize = 20;
      const limit = Math.min(pageSize, total);
      const offset = 0;

      let modelIds: bigint[];
      
      if (filters.architecture || filters.license) {
        modelIds = await contract.searchModels(
          filters.query || "",
          filters.architecture || "",
          filters.license || "",
          limit,
          offset
        );
      } else {
        modelIds = [];
        for (let i = 1; i <= Math.min(limit, total); i++) {
          modelIds.push(BigInt(i));
        }
      }

      const models = await Promise.all(
        modelIds.map(async (id) => {
          const result = await contract.getModel(id);
          return {
            modelId: id.toString(),
            name: result.name,
            description: result.description,
            architecture: result.architecture,
            parameters: Number(result.parameters),
            license: result.license,
            storageRootHash: result.storageRootHash,
            creator: result.creator,
            createdAt: Number(result.createdAt),
            downloadCount: Number(result.downloadCount),
            likeCount: Number(result.likeCount)
          };
        })
      );

      return {
        models,
        total,
        page: 1,
        pageSize
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recordDownload = useCallback(async (modelId: string | number, signer: JsonRpcSigner) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(signer);
      const tx = await contract.recordDownload(modelId);
      await tx.wait();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record download");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const likeModel = useCallback(async (modelId: string | number, signer: JsonRpcSigner) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(signer);
      const tx = await contract.likeModel(modelId);
      await tx.wait();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to like model");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unlikeModel = useCallback(async (modelId: string | number, signer: JsonRpcSigner) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(signer);
      const tx = await contract.unlikeModel(modelId);
      await tx.wait();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlike model");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkLike = useCallback(async (modelId: string | number, userAddress: string): Promise<boolean> => {
    try {
      const contract = getContract(getReadProvider());
      return await contract.didLikeModel(modelId, userAddress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check like status");
      throw err;
    }
  }, []);

  const getTrendingModels = useCallback(async (limit: number = 10): Promise<ModelMeta[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(getReadProvider());
      const totalModels: bigint = await contract.totalModels();
      const total = Number(totalModels);

      const modelIds: bigint[] = [];
      const start = Math.max(1, total - limit);
      for (let i = start; i <= total; i++) {
        modelIds.push(BigInt(i));
      }

      const models = await Promise.all(
        modelIds.map(async (id) => {
          const result = await contract.getModel(id);
          return {
            modelId: id.toString(),
            name: result.name,
            description: result.description,
            architecture: result.architecture,
            parameters: Number(result.parameters),
            license: result.license,
            storageRootHash: result.storageRootHash,
            creator: result.creator,
            createdAt: Number(result.createdAt),
            downloadCount: Number(result.downloadCount),
            likeCount: Number(result.likeCount)
          };
        })
      );

      return models.sort((a, b) => b.likeCount - a.likeCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trending models");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTotalModels = useCallback(async (): Promise<number> => {
    try {
      const contract = getContract(getReadProvider());
      const total: bigint = await contract.totalModels();
      return Number(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch total models");
      throw err;
    }
  }, []);

  return {
    isLoading,
    error,
    setError,
    registerModel,
    getModel,
    getModelsByCreator,
    searchModels,
    recordDownload,
    likeModel,
    unlikeModel,
    checkLike,
    getTrendingModels,
    getTotalModels
  };
}
