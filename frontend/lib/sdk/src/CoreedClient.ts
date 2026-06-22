import { ethers } from 'ethers';
import { AgentSpaceRegistryABI, ModelRegistryABI, AgentRegistryABI, DEFAULT_CONTRACT_ADDRESSES, DEFAULT_NETWORK } from './contracts';
import type { CoreedConfig, ModelMetadata, SpaceConfig, SleepStatus, SpaceHealth, ModelInfo, SpaceInfo } from './types';

export class CoreedClient {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | ethers.JsonRpcSigner | ethers.JsonRpcProvider;
  private modelRegistry: ethers.Contract;
  private agentRegistry: ethers.Contract;
  private agentSpaceRegistry: ethers.Contract;

  constructor(config: CoreedConfig = {}) {
    const rpcUrl = config.rpcUrl || DEFAULT_NETWORK.rpcUrl;
    const chainId = config.chainId || DEFAULT_NETWORK.chainId;
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
    
    // Use provided signer or create from private key
    if (config.privateKey) {
      this.signer = new ethers.Wallet(config.privateKey, this.provider);
    } else {
      this.signer = this.provider;
    }

    // Initialize contracts with provided or default addresses
    const modelRegistryAddress = config.modelRegistryAddress || DEFAULT_CONTRACT_ADDRESSES.modelRegistry;
    const agentRegistryAddress = config.agentRegistryAddress || DEFAULT_CONTRACT_ADDRESSES.agentRegistry;
    const agentSpaceRegistryAddress = config.agentSpaceRegistryAddress || DEFAULT_CONTRACT_ADDRESSES.agentSpaceRegistry;

    this.modelRegistry = new ethers.Contract(modelRegistryAddress, ModelRegistryABI, this.signer);
    this.agentRegistry = new ethers.Contract(agentRegistryAddress, AgentRegistryABI, this.signer);
    this.agentSpaceRegistry = new ethers.Contract(agentSpaceRegistryAddress, AgentSpaceRegistryABI, this.signer);
  }

  // ==================== Model Registry Methods ====================

  async registerModel(metadata: ModelMetadata): Promise<string> {
    const tx = await this.modelRegistry.registerModel(
      metadata.name,
      metadata.description || '',
      metadata.architecture || '',
      metadata.parameters || 0,
      metadata.license || 'MIT',
      metadata.storageRootHash
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getModel(modelId: number | string): Promise<ModelInfo> {
    const result = await this.modelRegistry.getModel(modelId);
    return {
      modelId,
      name: result.name ?? result[0],
      description: result.description ?? result[1],
      architecture: result.architecture ?? result[2],
      parameters: Number(result.parameters ?? result[3]),
      license: result.license ?? result[4],
      storageRootHash: result.storageRootHash ?? result[5],
      owner: result.creator ?? result[6],
      tags: [],
    };
  }

  async getModelsByOwner(owner: string): Promise<number[]> {
    const result = await this.modelRegistry.getModelsByCreator(owner);
    return result.map((id: bigint) => Number(id));
  }

  async getModelsByCreator(creator: string): Promise<number[]> {
    return this.getModelsByOwner(creator);
  }

  async likeModel(modelId: number | string): Promise<string> {
    const tx = await this.modelRegistry.likeModel(modelId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async recordDownload(modelId: number | string): Promise<string> {
    const tx = await this.modelRegistry.recordDownload(modelId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  // ==================== Agent Space Registry Methods ====================

  async deploySpace(config: SpaceConfig): Promise<{ spaceId: number; txHash: string }> {
    const tx = await this.agentSpaceRegistry.deploySpace(
      config.name,
      config.description || '',
      config.version || '1.0.0',
      config.modelId || 0,
      config.endpointUrl || ''
    );
    const receipt = await tx.wait();
    
    // Get the space ID from the SpaceDeployed event
    const spaceDeployedEvent = receipt.logs
      .map((log: unknown) => {
        try {
          return this.agentSpaceRegistry.interface.parseLog(log as { topics: string[]; data: string });
        } catch {
          return null;
        }
      })
      .find((event: { name: string } | null) => event?.name === 'SpaceDeployed');

    const spaceId = spaceDeployedEvent ? Number(spaceDeployedEvent.args.spaceId ?? spaceDeployedEvent.args[0]) : 0;
    
    return {
      spaceId,
      txHash: receipt.hash,
    };
  }

  async getSpace(spaceId: number | string): Promise<SpaceInfo> {
    const result = await this.agentSpaceRegistry.getSpace(spaceId);
    return {
      spaceId: Number(spaceId),
      name: result[0],
      description: result[1],
      version: result[2],
      modelId: Number(result[3]),
      endpointUrl: result[4],
      deployedAt: Number(result[5]),
      lastHealthCheck: Number(result[6]),
      lastActivity: Number(result[7]),
      isActive: result[8],
      isAsleep: result[9],
      sleepTimeout: Number(result[10]),
      owner: result[11],
      requestCount: Number(result[12]),
    };
  }

  async getSpacesByOwner(owner: string): Promise<number[]> {
    const result = await this.agentSpaceRegistry.getSpacesByOwner(owner);
    return result.map((id: bigint) => Number(id));
  }

  async updateHealthStatus(spaceId: number | string, isActive: boolean): Promise<string> {
    const tx = await this.agentSpaceRegistry.updateHealthStatus(spaceId, isActive);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async pauseSpace(spaceId: number | string): Promise<string> {
    const tx = await this.agentSpaceRegistry.pauseSpace(spaceId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async resumeSpace(spaceId: number | string): Promise<string> {
    const tx = await this.agentSpaceRegistry.resumeSpace(spaceId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async setSleepTimeout(spaceId: number | string, timeoutSeconds: number): Promise<string> {
    const tx = await this.agentSpaceRegistry.setSleepTimeout(spaceId, timeoutSeconds);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getSleepStatus(spaceId: number | string): Promise<SleepStatus> {
    const result = await this.agentSpaceRegistry.getSleepStatus(spaceId);
    return {
      isAsleep: result[0],
      sleepTimeout: Number(result[1]),
      timeUntilSleep: Number(result[2]),
    };
  }

  async wakeSpace(spaceId: number | string): Promise<string> {
    const tx = await this.agentSpaceRegistry.wakeSpace(spaceId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async checkSleep(spaceId: number | string): Promise<void> {
    await this.agentSpaceRegistry.checkSleep(spaceId);
  }

  async recordRequest(spaceId: number | string): Promise<string> {
    const tx = await this.agentSpaceRegistry.recordRequest(spaceId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async checkHealth(spaceId: number | string): Promise<SpaceHealth> {
    const result = await this.agentSpaceRegistry.checkHealth(spaceId);
    return {
      isActive: result[0],
      lastChecked: Number(result[1]),
      isAsleep: result[2],
    };
  }

  async getActiveSpaces(): Promise<number[]> {
    const result = await this.agentSpaceRegistry.getActiveSpaces();
    return result.map((id: bigint) => Number(id));
  }

  // ==================== Agent Registry Methods ====================

  async registerAgent(name: string, description: string = '', metadataUri: string = ''): Promise<string> {
    const rootHash = metadataUri || description;
    const tx = await this.agentRegistry.launchAgent(name, rootHash);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async launchAgent(name: string, rootHash: string): Promise<{ agentId: number; txHash: string }> {
    const tx = await this.agentRegistry.launchAgent(name, rootHash);
    const receipt = await tx.wait();
    const launchedEvent = receipt.logs
      .map((log: unknown) => {
        try {
          return this.agentRegistry.interface.parseLog(log as { topics: string[]; data: string });
        } catch {
          return null;
        }
      })
      .find((event: { name: string } | null) => event?.name === 'AgentLaunched');

    return {
      agentId: launchedEvent ? Number(launchedEvent.args.agentId ?? launchedEvent.args[0]) : 0,
      txHash: receipt.hash,
    };
  }

  async getAgent(agentId: number | string): Promise<unknown> {
    const result = await this.agentRegistry.getAgent(agentId);
    return result;
  }

  // ==================== Utility Methods ====================

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  getSigner(): ethers.Wallet | ethers.JsonRpcSigner | ethers.JsonRpcProvider {
    return this.signer;
  }

  getModelRegistryAddress(): string {
    return this.modelRegistry.target as string;
  }

  getAgentSpaceRegistryAddress(): string {
    return this.agentSpaceRegistry.target as string;
  }

  getAgentRegistryAddress(): string {
    return this.agentRegistry.target as string;
  }
}
