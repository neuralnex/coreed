export interface AgentMeta {
  agentId: string;
  name: string;
  storageRootHash: string;
  developer: string;
  launchTimestamp: number;
}

export interface AgentStatus {
  agentId: string;
  isLive: boolean;
  lastPing: number;
  healthEndpoint: string;
  errorMessage: string;
}
