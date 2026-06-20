export interface CoreedConfig {
  rpcUrl?: string;
  privateKey?: string;
  chainId?: number;
  modelRegistryAddress?: string;
  agentRegistryAddress?: string;
  agentSpaceRegistryAddress?: string;
}

export interface ModelMetadata {
  name: string;
  description?: string;
  architecture?: string;
  parameters?: number;
  license?: string;
  storageRootHash: string;
  tags?: string[];
}

export interface SpaceConfig {
  name: string;
  description?: string;
  modelId?: number | string;
  template?: string;
  autoSleep?: boolean;
  sleepTimeout?: number; // seconds
}

export interface SleepStatus {
  isAsleep: boolean;
  sleepTimeout: number; // seconds
  timeUntilSleep: number; // seconds, 0 if asleep
}

export interface SpaceHealth {
  isActive: boolean;
  lastChecked: number;
  isAsleep: boolean;
  latency?: number;
}

export interface ModelInfo {
  modelId: string | number;
  name: string;
  description: string;
  architecture: string;
  parameters: number;
  license: string;
  storageRootHash: string;
  owner: string;
  tags: string[];
}

export interface SpaceInfo {
  spaceId: string | number;
  name: string;
  description: string;
  version: string;
  modelId: string | number;
  endpointUrl: string;
  deployedAt: number;
  lastHealthCheck: number;
  lastActivity: number;
  isActive: boolean;
  isAsleep: boolean;
  sleepTimeout: number;
  owner: string;
  requestCount: number;
}
