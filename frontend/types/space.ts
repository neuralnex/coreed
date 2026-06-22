export interface AgentSpace {
  spaceId: string;
  name: string;
  description: string;
  version: string;
  modelId: string;
  endpointUrl: string;
  localEndpointUrl?: string;
  deployedAt: number;
  lastHealthCheck: number;
  lastActivity: number;
  isActive: boolean;
  isAsleep: boolean;
  sleepTimeout: number;
  owner: string;
  requestCount: number;
  sdk?: string;
  template?: string;
}

export interface SleepConfig {
  isAsleep: boolean;
  sleepTimeout: number; // in seconds
  timeUntilSleep: number; // in seconds, 0 if asleep
}

export interface SpaceHealthStatus {
  isActive: boolean;
  lastChecked: number;
  latency?: number;
  isAsleep: boolean;
}

export interface SpaceMeta {
  name: string;
  description: string;
  version: string;
  modelId: string | number;
  endpointUrl: string;
}

export interface DeploySpaceResult {
  spaceId: string;
  txHash: string;
}

export interface HealthCheck {
  isActive: boolean;
  lastChecked: number;
  latency?: number;
}

export interface SpaceDeployment {
  space: AgentSpace;
  model: {
    modelId: string;
    name: string;
    storageRootHash: string;
  };
  healthStatus: HealthCheck;
}

export interface Collaborator {
  address: string;
  role: "operator" | "viewer" | "admin";
  addedAt: number;
  addedBy: string;
}

export interface SpaceWithCollaborators extends AgentSpace {
  collaborators?: Collaborator[];
  canManage: boolean;
}

export interface Invitation {
  invitationId: string;
  spaceId: string;
  recipient: string;
  role: "operator" | "viewer" | "admin";
  createdAt: number;
  createdBy: string;
  status: "pending" | "accepted" | "rejected";
  expiresAt?: number;
}

export type SpaceRole = "owner" | "operator" | "viewer" | "admin";

export const SPACE_ROLES: SpaceRole[] = ["owner", "admin", "operator", "viewer"];

export type DeploymentStatus = "pending" | "deploying" | "active" | "inactive" | "error";

export interface DeploymentConfig {
  modelId: string | number;
  name: string;
  description: string;
  version: string;
  endpointUrl?: string;
  runtime: "python" | "node" | "docker";
  template?: string;
  port?: number;
  healthEndpoint?: string;
  sleepTimeout?: number; // in seconds, 0 to disable
  autoSleep?: boolean; // enable/disable auto-sleep
}

export interface SpaceManagementActions {
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  wake: () => Promise<void>;
  setSleepTimeout: (timeout: number) => Promise<void>;
  checkSleepStatus: () => Promise<SleepConfig>;
}

interface SpaceTemplate {
  name: string;
  runtime: "python" | "node" | "docker";
  description: string;
  port: number;
  healthEndpoint: string;
}

export const SPACE_TEMPLATES: Record<string, SpaceTemplate> = {
  gradio: {
    name: "Gradio (Python)",
    runtime: "python",
    description: "Interactive UI template with FastAPI backend",
    port: 7860,
    healthEndpoint: "/health"
  },
  fastapi: {
    name: "FastAPI (Python)",
    runtime: "python",
    description: "Standard FastAPI template for LLMs",
    port: 8000,
    healthEndpoint: "/health"
  },
  express: {
    name: "Express (Node.js)",
    runtime: "node",
    description: "Express.js template for AI services",
    port: 3000,
    healthEndpoint: "/health"
  },
  docker: {
    name: "Custom Docker",
    runtime: "docker",
    description: "Bring your own Dockerfile",
    port: 8080,
    healthEndpoint: "/health"
  }
} as const;

export const RUNTIME_OPTIONS = ["python", "node", "docker"] as const;
