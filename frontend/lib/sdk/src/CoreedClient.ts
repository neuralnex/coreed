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
      metadata.storageRootHash,
      metadata.tags || []
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getModel(modelId: number | string): Promise<ModelInfo> {
    const result = await this.modelRegistry.getModel(modelId);
    return {
      modelId: Number(result[0]),
      name: result[1],
      description: result[2],
      architecture: result[3],
      parameters: Number(result[4]),
      license: result[5],
      storageRootHash: result[6],
      owner: result[7],
      tags: result[8] || [],
    };
  }

  async getModelsByOwner(owner: string): Promise<number[]> {
    const result = await this.modelRegistry.getModelsByOwner(owner);
    return result.map((id: bigint) => Number(id));
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
    const logs = receipt.logs;
    const spaceDeployedEvent = logs.find((log: any) => 
      log.fragment && log.fragment.name === 'SpaceDeployed'
    );
    
    const spaceId = spaceDeployedEvent ? Number(spaceDeployedEvent.args[0]) : 0;
    
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
    const tx = await this.agentRegistry.registerAgent(name, description, metadataUri);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getAgent(agentId: number | string): Promise<any> {
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
