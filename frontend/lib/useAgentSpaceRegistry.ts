"use client";

import { useCallback, useState } from "react";
import { Contract, JsonRpcProvider, type JsonRpcSigner } from "ethers";
import agentSpaceRegistryAbi from "./agentSpaceRegistryAbi.json";
import { GALILEO_RPC_URL } from "./wallet";
import type { AgentSpace, SpaceMeta, DeploySpaceResult, HealthCheck, SpaceHealthStatus, SleepConfig } from "@/types/space";

const AGENT_SPACE_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_AGENT_SPACE_REGISTRY_ADDRESS ?? "";

function getReadProvider(): JsonRpcProvider {
  return new JsonRpcProvider(GALILEO_RPC_URL);
}

function getContract(signerOrProvider: JsonRpcSigner | JsonRpcProvider): Contract {
  if (!AGENT_SPACE_REGISTRY_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_AGENT_SPACE_REGISTRY_ADDRESS is not set. Deploy AgentSpaceRegistry.sol and add the address to frontend/.env.local."
    );
  }
  return new Contract(AGENT_SPACE_REGISTRY_ADDRESS, agentSpaceRegistryAbi, signerOrProvider);
}

function parseDescription(description: string) {
  let parsedDesc = description;
  let storageRootHash = "";
  let storageTxHash = "";
  let sdk = "gradio";
  let template = "blank";
  try {
    if (description && description.trim().startsWith("{")) {
      const meta = JSON.parse(description);
      parsedDesc = meta.description || "";
      storageRootHash = meta.storageRootHash || "";
      storageTxHash = meta.storageTxHash || "";
      sdk = meta.sdk || sdk;
      template = meta.template || template;
    }
  } catch (e) {
    // Fallback to plain description text
  }
  return {
    description: parsedDesc,
    storageRootHash,
    storageTxHash,
    sdk,
    template
  };
}

export function useAgentSpaceRegistry() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deploySpace = useCallback(
    async (
      signer: JsonRpcSigner,
      spaceMeta: SpaceMeta
    ): Promise<DeploySpaceResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(signer);
        const tx = await contract.deploySpace(
          spaceMeta.name,
          spaceMeta.description,
          spaceMeta.version,
          spaceMeta.modelId,
          spaceMeta.endpointUrl
        );
        const receipt = await tx.wait();

        const deployedEvent = receipt.logs
          .map((log: unknown) => {
            try {
              return contract.interface.parseLog(log as { topics: string[]; data: string });
            } catch {
              return null;
            }
          })
          .find((parsed: { name: string } | null) => parsed?.name === "SpaceDeployed");

        if (!deployedEvent) {
          throw new Error("SpaceDeployed event not found in transaction receipt.");
        }

        return {
          spaceId: deployedEvent.args.spaceId.toString(),
          txHash: receipt.hash
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Deployment failed");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateEndpoint = useCallback(
    async (signer: JsonRpcSigner, spaceId: string | number, newEndpoint: string): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(signer);
        const tx = await contract.updateEndpoint(spaceId, newEndpoint);
        await tx.wait();
        return newEndpoint;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update endpoint");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateHealthStatus = useCallback(
    async (signer: JsonRpcSigner, spaceId: string | number, isActive: boolean): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(signer);
        const tx = await contract.updateHealthStatus(spaceId, isActive);
        await tx.wait();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update health status");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const addOperator = useCallback(
    async (signer: JsonRpcSigner, spaceId: string | number, newOperator: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(signer);
        const tx = await contract.addOperator(spaceId, newOperator);
        await tx.wait();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add operator");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const removeOperator = useCallback(
    async (signer: JsonRpcSigner, spaceId: string | number, oldOperator: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(signer);
        const tx = await contract.removeOperator(spaceId, oldOperator);
        await tx.wait();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove operator");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deactivateSpace = useCallback(
    async (signer: JsonRpcSigner, spaceId: string | number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(signer);
        const tx = await contract.deactivateSpace(spaceId);
        await tx.wait();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to deactivate space");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const recordRequest = useCallback(
    async (spaceId: string | number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(getReadProvider());
        const tx = await contract.recordRequest(spaceId);
        await tx.wait();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to record request");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getSpace = useCallback(async (spaceId: string | number): Promise<AgentSpace> => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(getReadProvider());
      const result = await contract.getSpace(spaceId);
      const parsedMeta = parseDescription(result.description);

      return {
        spaceId: spaceId.toString(),
        name: result.name,
        description: parsedMeta.description,
        version: result.version,
        modelId: result.modelId.toString(),
        endpointUrl: result.endpointUrl,
        deployedAt: Number(result.deployedAt),
        lastHealthCheck: Number(result.lastHealthCheck),
        lastActivity: Number(result.lastActivity),
        isActive: result.isActive,
        isAsleep: result.isAsleep,
        sleepTimeout: Number(result.sleepTimeout),
        owner: result.owner,
        requestCount: Number(result.requestCount),
        storageRootHash: parsedMeta.storageRootHash,
        storageTxHash: parsedMeta.storageTxHash,
        sdk: parsedMeta.sdk,
        template: parsedMeta.template
      };
    } catch (err) {
      // If on-chain fails, try to get from in-memory store
      try {
        const response = await fetch(`/api/spaces?spaceId=${spaceId}`);
        if (response.ok) {
          const spaceData = await response.json();
          return {
            spaceId: spaceData.spaceId || spaceId.toString(),
            name: spaceData.name,
            description: spaceData.description || '',
            version: '1.0.0',
            modelId: '0',
            endpointUrl: spaceData.endpointUrl || `http://localhost:7860`,
            deployedAt: spaceData.createdAt ? Math.floor(spaceData.createdAt / 1000) : Math.floor(Date.now() / 1000),
            lastHealthCheck: 0,
            lastActivity: 0,
            isActive: true,
            isAsleep: false,
            sleepTimeout: 0,
            owner: spaceData.owner,
            requestCount: 0,
            sdk: spaceData.sdk,
            template: spaceData.template,
            storageRootHash: spaceData.storageRootHash,
            storageTxHash: spaceData.storageTxHash
          };
        }
      } catch {
        // Fall through to error
      }
      
      setError(err instanceof Error ? err.message : "Failed to fetch space");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSpacesByOwner = useCallback(async (owner: string): Promise<AgentSpace[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(getReadProvider());
      const spaceIds: bigint[] = await contract.getSpacesByOwner(owner);

      const spaces = await Promise.all(
        spaceIds.map(async (id) => {
          const result = await contract.getSpace(id);
          const parsedMeta = parseDescription(result.description);
          return {
            spaceId: id.toString(),
            name: result.name,
            description: parsedMeta.description,
            version: result.version,
            modelId: result.modelId.toString(),
            endpointUrl: result.endpointUrl,
            deployedAt: Number(result.deployedAt),
            lastHealthCheck: Number(result.lastHealthCheck),
            lastActivity: Number(result.lastActivity),
            isActive: result.isActive,
            isAsleep: result.isAsleep,
            sleepTimeout: Number(result.sleepTimeout),
            owner: result.owner,
            requestCount: Number(result.requestCount),
            storageRootHash: parsedMeta.storageRootHash,
            storageTxHash: parsedMeta.storageTxHash,
            sdk: parsedMeta.sdk,
            template: parsedMeta.template
          };
        })
      );

      return spaces;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch owner spaces");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSpacesByModel = useCallback(async (modelId: string | number): Promise<AgentSpace[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(getReadProvider());
      const spaceIds: bigint[] = await contract.getSpacesByModel(modelId);

      const spaces = await Promise.all(
        spaceIds.map(async (id) => {
          const result = await contract.getSpace(id);
          const parsedMeta = parseDescription(result.description);
          return {
            spaceId: id.toString(),
            name: result.name,
            description: parsedMeta.description,
            version: result.version,
            modelId: result.modelId.toString(),
            endpointUrl: result.endpointUrl,
            deployedAt: Number(result.deployedAt),
            lastHealthCheck: Number(result.lastHealthCheck),
            lastActivity: Number(result.lastActivity),
            isActive: result.isActive,
            isAsleep: result.isAsleep,
            sleepTimeout: Number(result.sleepTimeout),
            owner: result.owner,
            requestCount: Number(result.requestCount),
            storageRootHash: parsedMeta.storageRootHash,
            storageTxHash: parsedMeta.storageTxHash,
            sdk: parsedMeta.sdk,
            template: parsedMeta.template
          };
        })
      );

      return spaces;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch model spaces");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAllSpaces = useCallback(async (): Promise<AgentSpace[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(getReadProvider());
      const totalSpacesBig: bigint = await contract.totalSpaces();
      const totalSpaces = Number(totalSpacesBig);
      
      if (totalSpaces === 0) return [];
      
      // Fetch all space IDs from 1 to totalSpaces
      const spaceIds: bigint[] = Array.from({ length: totalSpaces }, (_, i) => BigInt(i + 1));
      
      const spaces = await Promise.all(
        spaceIds.map(async (id) => {
          try {
            const result = await contract.getSpace(id);
            const parsedMeta = parseDescription(result.description);
            return {
              spaceId: id.toString(),
              name: result.name,
              description: parsedMeta.description,
              version: result.version,
              modelId: result.modelId.toString(),
              endpointUrl: result.endpointUrl,
              deployedAt: Number(result.deployedAt),
              lastHealthCheck: Number(result.lastHealthCheck),
              lastActivity: Number(result.lastActivity),
              isActive: result.isActive,
              isAsleep: result.isAsleep,
              sleepTimeout: Number(result.sleepTimeout),
              owner: result.owner,
              requestCount: Number(result.requestCount),
              storageRootHash: parsedMeta.storageRootHash,
              storageTxHash: parsedMeta.storageTxHash,
              sdk: parsedMeta.sdk,
              template: parsedMeta.template
            };
          } catch {
            // Space might not exist (if deleted)
            return null;
          }
        })
      );
      
      return spaces.filter(Boolean) as AgentSpace[];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch all spaces");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getActiveSpaces = useCallback(async (): Promise<AgentSpace[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract(getReadProvider());
      const spaceIds: bigint[] = await contract.getActiveSpaces();

      const spaces = await Promise.all(
        spaceIds.map(async (id) => {
          const result = await contract.getSpace(id);
          const parsedMeta = parseDescription(result.description);
          return {
            spaceId: id.toString(),
            name: result.name,
            description: parsedMeta.description,
            version: result.version,
            modelId: result.modelId.toString(),
            endpointUrl: result.endpointUrl,
            deployedAt: Number(result.deployedAt),
            lastHealthCheck: Number(result.lastHealthCheck),
            lastActivity: Number(result.lastActivity),
            isActive: result.isActive,
            isAsleep: result.isAsleep,
            sleepTimeout: Number(result.sleepTimeout),
            owner: result.owner,
            requestCount: Number(result.requestCount),
            storageRootHash: parsedMeta.storageRootHash,
            storageTxHash: parsedMeta.storageTxHash,
            sdk: parsedMeta.sdk,
            template: parsedMeta.template
          };
        })
      );

      return spaces;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch active spaces");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkHealth = useCallback(
    async (spaceId: string | number): Promise<SpaceHealthStatus> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(getReadProvider());
        const result = await contract.checkHealth(spaceId);

        return {
          isActive: result[0],
          lastChecked: Number(result[1]),
          isAsleep: result[2]
        };
      } catch (err) {
        // For slug-based spaces, return a default healthy status
        // since they don't have on-chain health checks
        console.log("Health check failed for space (likely slug-based):", spaceId);
        return {
          isActive: true,
          lastChecked: Math.floor(Date.now() / 1000),
          isAsleep: false
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getSleepStatus = useCallback(
    async (spaceId: string | number): Promise<SleepConfig> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(getReadProvider());
        const result = await contract.getSleepStatus(spaceId);

        return {
          isAsleep: result[0],
          sleepTimeout: Number(result[1]),
          timeUntilSleep: Number(result[2])
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get sleep status");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const pauseSpace = useCallback(
    async (signer: JsonRpcSigner, spaceId: string | number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(signer);
        const tx = await contract.pauseSpace(spaceId);
        await tx.wait();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to pause space");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resumeSpace = useCallback(
    async (signer: JsonRpcSigner, spaceId: string | number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(signer);
        const tx = await contract.resumeSpace(spaceId);
        await tx.wait();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to resume space");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const setSleepTimeout = useCallback(
    async (signer: JsonRpcSigner, spaceId: string | number, timeoutInSeconds: number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(signer);
        const tx = await contract.setSleepTimeout(spaceId, timeoutInSeconds);
        await tx.wait();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to set sleep timeout");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const wakeSpace = useCallback(
    async (signer: JsonRpcSigner, spaceId: string | number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract(signer);
        const tx = await contract.wakeSpace(spaceId);
        await tx.wait();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to wake space");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const isOperator = useCallback(
    async (spaceId: string | number, account: string): Promise<boolean> => {
      try {
        const contract = getContract(getReadProvider());
        return await contract.isOperator(spaceId, account);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check operator status");
        throw err;
      }
    },
    []
  );

  const getTotalSpaces = useCallback(async (): Promise<number> => {
    try {
      const contract = getContract(getReadProvider());
      const total: bigint = await contract.totalSpaces();
      return Number(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch total spaces");
      throw err;
    }
  }, []);

  return {
    isLoading,
    error,
    setError,
    deploySpace,
    updateEndpoint,
    updateHealthStatus,
    addOperator,
    removeOperator,
    deactivateSpace,
    recordRequest,
    getSpace,
    getAllSpaces,
    getSpacesByOwner,
    getSpacesByModel,
    getActiveSpaces,
    checkHealth,
    isOperator,
    getTotalSpaces,
    getSleepStatus,
    pauseSpace,
    resumeSpace,
    setSleepTimeout,
    wakeSpace
  };
}
