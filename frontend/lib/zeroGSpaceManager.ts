import { Indexer, Blob as ZgBlob, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { execSync } from "child_process";

const ZERO_G_INDEXER_RPC = process.env.NEXT_PUBLIC_STORAGE_INDEXER ?? "https://indexer-storage-testnet-turbo.0g.ai";
const ZERO_G_EVM_RPC = process.env.NEXT_PUBLIC_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // Placeholder if not configured

export interface FileItem {
  path: string;
  content: string;
  isBinary: boolean;
}

export class ZeroGSpaceManager {
  private indexer: Indexer;

  constructor() {
    this.indexer = new Indexer(ZERO_G_INDEXER_RPC);
  }

  /**
   * Recursively read files in a directory, ignoring node_modules, environments, etc.
   */
  private getFiles(dir: string, baseDir: string): FileItem[] {
    let results: FileItem[] = [];
    if (!fs.existsSync(dir)) return results;
    
    const list = fs.readdirSync(dir);
    
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      // Exclude build artifacts, git details, environments
      if (
        file === '.git' || 
        file === 'node_modules' || 
        file === '.venv' || 
        file === 'venv' || 
        file === '__pycache__' ||
        file === '.env' ||
        file === '.env.local'
      ) {
        return;
      }

      if (stat && stat.isDirectory()) {
        results = results.concat(this.getFiles(filePath, baseDir));
      } else {
        const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
        const contentBuffer = fs.readFileSync(filePath);
        
        // Detect if binary file
        const isBinary = this.isBinaryFile(contentBuffer);
        
        results.push({
          path: relativePath,
          content: contentBuffer.toString(isBinary ? 'base64' : 'utf8'),
          isBinary
        });
      }
    });
    
    return results;
  }

  private isBinaryFile(buffer: Buffer): boolean {
    const limit = Math.min(buffer.length, 1024);
    for (let i = 0; i < limit; i++) {
      if (buffer[i] === 0) return true;
    }
    return false;
  }

  /**
   * Compress and upload space repository directory to 0G Storage
   */
  public async uploadRepo(repoPath: string): Promise<{ rootHash: string; txHash: string }> {
    console.log(`[0G Storage] Scanning and packing files at: ${repoPath}`);
    const files = this.getFiles(repoPath, repoPath);
    const jsonString = JSON.stringify(files);
    
    // Gzip compress the codebase payload to minimize storage cost
    const compressed = zlib.gzipSync(Buffer.from(jsonString, 'utf8'));
    const memData = new MemData(compressed);

    const [tree, treeErr] = await memData.merkleTree();
    if (treeErr !== null || !tree) {
      throw new Error(`[0G Storage] Merkle generation failed: ${treeErr?.message ?? 'unknown'}`);
    }
    const rootHash = tree.rootHash();

    console.log(`[0G Storage] Uploading repository payload... Merkle Root: ${rootHash}`);
    const provider = new ethers.JsonRpcProvider(ZERO_G_EVM_RPC);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    const [result, uploadErr] = await this.indexer.upload(memData, ZERO_G_EVM_RPC, signer);
    if (uploadErr !== null) {
      throw new Error(`[0G Storage] Upload to indexer failed: ${uploadErr.message}`);
    }

    const txHash = "txHash" in result ? result.txHash : result.txHashes[0];
    const finalRootHash = "rootHash" in result ? result.rootHash : result.rootHashes[0];

    console.log(`[0G Storage] Codebase committed to 0G Storage. Tx: ${txHash}`);
    return { rootHash: finalRootHash ?? rootHash, txHash };
  }

  /**
   * Download and unpack space repository from 0G Storage
   */
  public async downloadAndUnpack(rootHash: string, targetPath: string): Promise<void> {
    console.log(`[0G Storage] Downloading codebase bundle for Root: ${rootHash}`);
    const [blob, err] = await this.indexer.downloadToBlob(rootHash, { proof: true });
    if (err !== null || !blob) {
      throw new Error(`[0G Storage] Download from indexer failed: ${err?.message ?? 'empty payload'}`);
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    console.log(`[0G Storage] Decompressing archive payload...`);
    const decompressed = zlib.gunzipSync(buffer);
    const files: FileItem[] = JSON.parse(decompressed.toString('utf8'));

    console.log(`[0G Storage] Writing files to target: ${targetPath}`);
    fs.mkdirSync(targetPath, { recursive: true });

    files.forEach((file) => {
      const filePath = path.join(targetPath, file.path);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      
      const fileBuffer = file.isBinary 
        ? Buffer.from(file.content, 'base64')
        : Buffer.from(file.content, 'utf8');
        
      fs.writeFileSync(filePath, fileBuffer);
    });
    
    console.log(`[0G Storage] Space codebase successfully restored.`);
  }

  /**
   * Pack and upload a directory (like .venv) to 0G Storage as a tarball dependency cache
   */
  public async uploadDependencyCache(depsHash: string, venvPath: string): Promise<{ rootHash: string; txHash: string } | null> {
    if (!fs.existsSync(venvPath)) return null;

    const tarPath = path.join(path.dirname(venvPath), `${depsHash}.tar.gz`);
    try {
      console.log(`[0G Storage] Packaging dependency environment at ${venvPath} to ${tarPath}...`);
      
      // Native tar compression using built-in system tar (available on Windows, macOS, Linux)
      execSync(`tar -czf "${tarPath}" -C "${venvPath}" .`, { stdio: 'ignore' });
      
      const content = fs.readFileSync(tarPath);
      const memData = new MemData(content);
      
      const [tree, treeErr] = await memData.merkleTree();
      if (treeErr !== null || !tree) {
        throw new Error(`Merkle generation failed: ${treeErr?.message}`);
      }
      
      const provider = new ethers.JsonRpcProvider(ZERO_G_EVM_RPC);
      const signer = new ethers.Wallet(PRIVATE_KEY, provider);
      
      console.log(`[0G Storage] Committing dependency cache tarball... Hash: ${tree.rootHash()}`);
      const [result, uploadErr] = await this.indexer.upload(memData, ZERO_G_EVM_RPC, signer);
      if (uploadErr !== null) {
        throw new Error(`Upload failed: ${uploadErr.message}`);
      }
      
      const txHash = "txHash" in result ? result.txHash : result.txHashes[0];
      const finalRootHash = "rootHash" in result ? result.rootHash : result.rootHashes[0];
      
      return { rootHash: finalRootHash ?? tree.rootHash(), txHash };
    } catch (e: any) {
      console.error(`[0G Storage] Error uploading dependencies cache:`, e.message);
      return null;
    } finally {
      // Clean up local temp tarball
      if (fs.existsSync(tarPath)) {
        try {
          fs.unlinkSync(tarPath);
        } catch {}
      }
    }
  }

  /**
   * Download and unpack a dependency cache tarball from 0G Storage
   */
  public async downloadDependencyCache(rootHash: string, targetVenvPath: string): Promise<boolean> {
    const tempTarPath = path.join(path.dirname(targetVenvPath), `${rootHash}.tar.gz`);
    try {
      console.log(`[0G Storage] Downloading pre-built dependencies cache (Root: ${rootHash})...`);
      const [blob, err] = await this.indexer.downloadToBlob(rootHash, { proof: true });
      if (err !== null || !blob) {
        console.warn(`[0G Storage] Dependency cache download failed: ${err?.message}`);
        return false;
      }
      
      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(tempTarPath, buffer);
      
      console.log(`[0G Storage] Restoring dependencies cache to ${targetVenvPath}...`);
      fs.mkdirSync(targetVenvPath, { recursive: true });
      
      execSync(`tar -xzf "${tempTarPath}" -C "${targetVenvPath}"`, { stdio: 'ignore' });
      return true;
    } catch (e: any) {
      console.error(`[0G Storage] Dependency cache restore failed:`, e.message);
      return false;
    } finally {
      if (fs.existsSync(tempTarPath)) {
        try {
          fs.unlinkSync(tempTarPath);
        } catch {}
      }
    }
  }
}

export const zeroGSpaceManager = new ZeroGSpaceManager();
