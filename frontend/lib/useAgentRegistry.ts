"use client";

import { useCallback } from "react";
import { Contract, JsonRpcProvider, type JsonRpcSigner } from "ethers";
import agentRegistryAbi from "./agentRegistryAbi.json";
import { AGENT_REGISTRY_ADDRESS, GALILEO_RPC_URL } from "./wallet";

export interface AgentMeta {
  agentId: string;
  name: string;
  storageRootHash: string;
  developer: string;
  launchTimestamp: number;
}

function getReadProvider(): JsonRpcProvider {
  return new JsonRpcProvider(GALILEO_RPC_URL);
}

function getContract(signerOrProvider: JsonRpcSigner | JsonRpcProvider): Contract {
  if (!AGENT_REGISTRY_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS is not set. Deploy AgentRegistry.sol and add the address to frontend/.env.local."
    );
  }
  return new Contract(AGENT_REGISTRY_ADDRESS, agentRegistryAbi, signerOrProvider);
}

export function useAgentRegistry() {
  const launchAgent = useCallback(
    async (signer: JsonRpcSigner, name: string, rootHash: string): Promise<{ agentId: string; txHash: string }> => {
      const contract = getContract(signer);
      const tx = await contract.launchAgent(name, rootHash);
      const receipt = await tx.wait();

      const launchedEvent = receipt.logs
        .map((log: unknown) => {
          try {
            return contract.interface.parseLog(log as { topics: string[]; data: string });
          } catch {
            return null;
          }
        })
        .find((parsed: { name: string } | null) => parsed?.name === "AgentLaunched");

      if (!launchedEvent) {
        throw new Error("AgentLaunched event not found in transaction receipt.");
      }

      return {
        agentId: launchedEvent.args.agentId.toString(),
        txHash: receipt.hash,
      };
    },
    []
  );

  const getAgent = useCallback(async (agentId: string | number): Promise<AgentMeta> => {
    const contract = getContract(getReadProvider());
    const result = await contract.getAgent(agentId);
    return {
      agentId: agentId.toString(),
      name: result.name ?? result[0],
      storageRootHash: result.storageRootHash ?? result[1],
      developer: result.developer ?? result[2],
      launchTimestamp: Number(result.launchTimestamp ?? result[3]),
    };
  }, []);

  const getAgentsByDeveloper = useCallback(async (developer: string): Promise<string[]> => {
    const contract = getContract(getReadProvider());
    const ids: bigint[] = await contract.getAgentsByDeveloper(developer);
    return ids.map((id) => id.toString());
  }, []);

  const getTotalAgentsLaunched = useCallback(async (): Promise<number> => {
    const contract = getContract(getReadProvider());
    const total: bigint = await contract.totalAgentsLaunched();
    return Number(total);
  }, []);

  return { launchAgent, getAgent, getAgentsByDeveloper, getTotalAgentsLaunched };
}
