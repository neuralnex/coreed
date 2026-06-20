export interface ModelCard {
  name: string;
  description: string;
  architecture: string;
  parameters: number;
  license: string;
  tags?: string[];
  datasets?: string[];
  framework?: string;
  quantization?: string;
  format?: string;
  library?: string;
  f16?: boolean;
  downloadCount?: number;
  likeCount?: number;
}

export interface ModelMeta {
  modelId: string;
  name: string;
  description: string;
  architecture: string;
  parameters: number;
  license: string;
  storageRootHash: string;
  creator: string;
  createdAt: number;
  downloadCount: number;
  likeCount: number;
  tags?: string[];
  version?: string;
  isLatest?: boolean;
  parentModelId?: string;
}

export interface ModelVersion {
  versionId: string;
  modelId: string;
  version: string;
  name: string;
  description: string;
  storageRootHash: string;
  createdAt: number;
  createdBy: string;
  isLatest: boolean;
  changes?: string;
}

export interface VersionHistory {
  modelId: string;
  versions: ModelVersion[];
  currentVersion: string;
}

export interface ModelWithVersions extends ModelMeta {
  versions?: ModelVersion[];
  versionCount?: number;
}

export interface UploadModelResult {
  modelId: string;
  storageRootHash: string;
  txHash: string;
}

export interface SearchFilters {
  query?: string;
  architecture?: string;
  license?: string;
  minParams?: number;
  maxParams?: number;
  tags?: string[];
  sortBy?: "recent" | "popular" | "downloads" | "name";
  sortOrder?: "asc" | "desc";
}

export interface SearchResults {
  models: ModelMeta[];
  total: number;
  page: number;
  pageSize: number;
}

export const LICENSES = [
  "Apache-2.0",
  "MIT",
  "GPL-3.0",
  "BSD-3-Clause",
  "AGPL-3.0",
  "LGPL-3.0",
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "Other"
];

export const ARCHITECTURES = [
  "Qwen2.5",
  "Llama3",
  "Mistral",
  "Phi-3",
  "Gemma",
  "DeepSeek",
  "Other"
];

export const TAGS = [
  "llm",
  "text-generation",
  "chat",
  "inference",
  "vision",
  "multimodal",
  "embedding",
  "classification",
  "summarization",
  "translation"
];
