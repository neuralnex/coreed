import { Indexer, Blob as ZgBlob, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import type { Signer } from "ethers";
import type { ModelCard, UploadModelResult } from "@/types/model";

const ZERO_G_INDEXER_RPC = "https://indexer-storage-testnet-turbo.0g.ai";
const ZERO_G_EVM_RPC = "https://evmrpc-testnet.0g.ai";

export interface ModelUploadOptions {
  modelCard: ModelCard;
  primaryFile: File;
  additionalFiles?: File[];
  onProgress?: (stage: string, progress?: number) => void;
}

export class ModelStorageService {
  private indexer: Indexer;

  constructor(indexerRpc: string = ZERO_G_INDEXER_RPC) {
    this.indexer = new Indexer(indexerRpc);
  }

  public async uploadModel(
    options: ModelUploadOptions,
    signer: Signer
  ): Promise<UploadModelResult> {
    const { modelCard, primaryFile, additionalFiles = [], onProgress } = options;

    onProgress?.("Validating model card...");
    const validatedCard = this.validateModelCard(modelCard);

    onProgress?.("Processing primary file...");
    const isJson = primaryFile.name.toLowerCase().endsWith(".json");
    const isLight = isJson && primaryFile.size < 10 * 1024 * 1024; // 10MB

    let primaryHash: string;
    let primaryTxHash: string;

    if (isLight) {
      const result = await this.uploadLightFile(primaryFile, signer, onProgress);
      primaryHash = result.rootHash;
      primaryTxHash = result.txHash;
    } else {
      const result = await this.uploadHeavyFile(primaryFile, signer, onProgress);
      primaryHash = result.rootHash;
      primaryTxHash = result.txHash;
    }

    if (additionalFiles.length > 0) {
      onProgress?.("Uploading additional files...");
      for (let i = 0; i < additionalFiles.length; i++) {
        const file = additionalFiles[i];
        const isFileJson = file.name.toLowerCase().endsWith(".json");
        const isFileLight = isFileJson && file.size < 10 * 1024 * 1024;

        if (isFileLight) {
          await this.uploadLightFile(file, signer);
        } else {
          await this.uploadHeavyFile(file, signer);
        }
        onProgress?.(`Uploading additional files... ${((i + 1) / additionalFiles.length * 100).toFixed(0)}%`);
      }
    }

    onProgress?.("Model upload complete!");

    return {
      modelId: "",
      storageRootHash: primaryHash,
      txHash: primaryTxHash
    };
  }

  private validateModelCard(card: ModelCard): ModelCard {
    if (!card.name || card.name.trim() === "") {
      throw new Error("Model name is required");
    }
    if (card.name.length > 128) {
      throw new Error("Model name exceeds 128 characters");
    }
    if (card.description && card.description.length > 2048) {
      throw new Error("Model description exceeds 2048 characters");
    }
    if (!card.architecture || card.architecture.trim() === "") {
      throw new Error("Architecture is required");
    }
    if (!card.license || card.license.trim() === "") {
      throw new Error("License is required");
    }
    return card;
  }

  private async uploadLightFile(
    file: File,
    signer: Signer,
    onProgress?: (stage: string) => void
  ): Promise<{ rootHash: string; txHash: string }> {
    const text = await file.text();
    let content: object;
    try {
      content = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON file");
    }

    const bufferPayload = new TextEncoder().encode(JSON.stringify(content));
    const memData = new MemData(bufferPayload);

    onProgress?.("Computing Merkle tree...");
    const [tree, treeErr] = await memData.merkleTree();
    if (treeErr !== null || !tree) {
      throw new Error(`Merkle generation failed: ${treeErr?.message ?? "unknown error"}`);
    }
    const rootHash = tree.rootHash();

    onProgress?.("Uploading to 0G Storage...");
    const [result, uploadErr] = await this.indexer.upload(memData, ZERO_G_EVM_RPC, signer);
    if (uploadErr !== null) {
      throw new Error(`Upload failed: ${uploadErr.message}`);
    }

    const txHash = "txHash" in result ? result.txHash : result.txHashes[0];
    const finalRootHash = "rootHash" in result ? result.rootHash : result.rootHashes[0];

    return { rootHash: finalRootHash ?? rootHash, txHash };
  }

  private async uploadHeavyFile(
    file: File,
    signer: Signer,
    onProgress?: (stage: string) => void
  ): Promise<{ rootHash: string; txHash: string }> {
    const zgBlob = new ZgBlob(file);

    onProgress?.("Computing Merkle tree...");
    const [tree, treeErr] = await zgBlob.merkleTree();
    if (treeErr !== null || !tree) {
      throw new Error(`Merkle generation failed: ${treeErr?.message ?? "unknown error"}`);
    }
    const rootHash = tree.rootHash();

    onProgress?.("Uploading to 0G Storage...");
    const [result, uploadErr] = await this.indexer.upload(zgBlob, ZERO_G_EVM_RPC, signer);
    if (uploadErr !== null) {
      throw new Error(`Upload failed: ${uploadErr.message}`);
    }

    const txHash = "txHash" in result ? result.txHash : result.txHashes[0];
    const finalRootHash = "rootHash" in result ? result.rootHash : result.rootHashes[0];

    return { rootHash: finalRootHash ?? rootHash, txHash };
  }

  public async downloadModel(rootHash: string, outputPath: string): Promise<void> {
    const indexer = new Indexer(ZERO_G_INDEXER_RPC);
    await indexer.download(rootHash, outputPath, true);
  }
}

export const modelStorage = new ModelStorageService();
