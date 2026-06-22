import { Indexer, Blob as ZgBlob, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import type { Signer } from "ethers";

export const ZERO_G_INDEXER_RPC =
  process.env.NEXT_PUBLIC_STORAGE_INDEXER ?? "https://indexer-storage-testnet-turbo.0g.ai";
export const ZERO_G_EVM_RPC = process.env.NEXT_PUBLIC_RPC_URL ?? "https://evmrpc-testnet.0g.ai";

export interface UploadResult {
  rootHash: string;
  txHash: string;
}

export class ZeroGStorageService {
  private indexer: Indexer;

  constructor(indexerRpc: string = ZERO_G_INDEXER_RPC) {
    this.indexer = new Indexer(indexerRpc);
  }

  public async uploadHeavyModel(
    fileData: File,
    signer: Signer,
    onProgress?: (stage: string) => void
  ): Promise<UploadResult> {
    const zgBlob = new ZgBlob(fileData);

    onProgress?.("Computing Merkle tree...");
    const [tree, treeErr] = await zgBlob.merkleTree();
    if (treeErr !== null || !tree) {
      throw new Error(`Merkle generation aborted: ${treeErr?.message ?? "unknown error"}`);
    }
    const rootHash = tree.rootHash();

    onProgress?.("Uploading to 0G Storage nodes...");
    const [result, uploadErr] = await this.indexer.upload(zgBlob, ZERO_G_EVM_RPC, signer);
    if (uploadErr !== null) {
      throw new Error(`0G Storage ingestion failed: ${uploadErr.message}`);
    }

    const txHash = "txHash" in result ? result.txHash : result.txHashes[0];
    const finalRootHash = "rootHash" in result ? result.rootHash : result.rootHashes[0];

    return { rootHash: finalRootHash ?? rootHash, txHash };
  }

  public async uploadAgentConfiguration(
    configObject: object,
    signer: Signer,
    onProgress?: (stage: string) => void
  ): Promise<UploadResult> {
    const serializedString = JSON.stringify(configObject);
    const bufferPayload = new TextEncoder().encode(serializedString);

    const memData = new MemData(bufferPayload);

    onProgress?.("Computing Merkle tree...");
    const [tree, treeErr] = await memData.merkleTree();
    if (treeErr !== null || !tree) {
      throw new Error(`In-memory Merkle generation aborted: ${treeErr?.message ?? "unknown error"}`);
    }
    const rootHash = tree.rootHash();

    onProgress?.("Committing to 0G Storage...");
    const [result, uploadErr] = await this.indexer.upload(memData, ZERO_G_EVM_RPC, signer);
    if (uploadErr !== null) {
      throw new Error(`0G Storage in-memory commit failed: ${uploadErr.message}`);
    }

    const txHash = "txHash" in result ? result.txHash : result.txHashes[0];
    const finalRootHash = "rootHash" in result ? result.rootHash : result.rootHashes[0];

    return { rootHash: finalRootHash ?? rootHash, txHash };
  }
}
