"use client";

import { useCallback, useRef, useState } from "react";
import type { JsonRpcSigner } from "ethers";
import { ZeroGStorageService } from "@/lib/zeroGStorage";
import { useAgentRegistry } from "@/lib/useAgentRegistry";
import { ResolvingHash } from "./ResolvingHash";
import { GALILEO_EXPLORER_URL } from "@/lib/wallet";

type Stage = "idle" | "hashing" | "uploading" | "minting" | "done" | "error";

interface UploaderProps {
  signer: JsonRpcSigner | null;
  onRequireWallet: () => void;
}

export function Uploader({ signer, onRequireWallet }: UploaderProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [agentName, setAgentName] = useState("");
  const [rootHash, setRootHash] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [statusLine, setStatusLine] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { launchAgent } = useAgentRegistry();
  const storageService = useRef(new ZeroGStorageService());

  const reset = useCallback(() => {
    setStage("idle");
    setRootHash(null);
    setAgentId(null);
    setTxHash(null);
    setErrorMsg(null);
    setStatusLine("");
  }, []);

  const runUploadFlow = useCallback(
    async (file: File, name: string) => {
      if (!signer) {
        onRequireWallet();
        return;
      }
      if (!name.trim()) {
        setErrorMsg("Name your agent before launching.");
        return;
      }

      setErrorMsg(null);
      setStage("hashing");

      try {
        const isLightConfig = file.name.toLowerCase().endsWith(".json");

        let result;
        if (isLightConfig) {
          const text = await file.text();
          let configObject: object;
          try {
            configObject = JSON.parse(text);
          } catch {
            throw new Error("That .json file isn't valid JSON.");
          }
          result = await storageService.current.uploadAgentConfiguration(configObject, signer, (s) => {
            setStage(s.includes("Committing") ? "uploading" : "hashing");
            setStatusLine(s);
          });
        } else {
          result = await storageService.current.uploadHeavyModel(file, signer, (s) => {
            setStage(s.includes("Uploading") ? "uploading" : "hashing");
            setStatusLine(s);
          });
        }

        setRootHash(result.rootHash);
        setStage("minting");
        setStatusLine("Minting Agentic ID on 0G Chain...");

        const { agentId, txHash } = await launchAgent(signer, name.trim(), result.rootHash);
        setAgentId(agentId);
        setTxHash(txHash);
        setStage("done");
        setStatusLine("");
      } catch (err) {
        setStage("error");
        setErrorMsg(err instanceof Error ? err.message : "Upload failed");
        setStatusLine("");
      }
    },
    [signer, onRequireWallet, launchAgent]
  );

  function handleFileSelect(file: File) {
    runUploadFlow(file, agentName || file.name.replace(/\.[^/.]+$/, ""));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  const isBusy = stage === "hashing" || stage === "uploading" || stage === "minting";

  return (
    <div className="coreed-panel rounded-lg p-6">
      {stage === "done" ? (
        <div className="space-y-5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xs uppercase tracking-wide text-coreed-sage">
              agent launched
            </span>
            <span className="font-mono text-xs text-coreed-moss-bright">
              id #{agentId}
            </span>
          </div>

          <div>
            <div className="mb-1.5 font-mono text-xs text-coreed-sage">storage root hash</div>
            <ResolvingHash value={rootHash} pending={false} className="text-base" />
          </div>

          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={() => rootHash && navigator.clipboard.writeText(rootHash)}
              className="font-mono text-xs text-coreed-bone underline decoration-coreed-line decoration-1 underline-offset-2 hover:decoration-coreed-moss-bright"
            >
              copy hash
            </button>
            <a
              href={`${GALILEO_EXPLORER_URL}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-coreed-bone underline decoration-coreed-line decoration-1 underline-offset-2 hover:decoration-coreed-moss-bright"
            >
              view transaction ↗
            </a>
            <button
              onClick={reset}
              className="ml-auto font-mono text-xs text-coreed-sage hover:text-coreed-bone"
            >
              launch another
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label htmlFor="agent-name" className="mb-1.5 block font-mono text-xs text-coreed-sage">
              agent name
            </label>
            <input
              id="agent-name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              disabled={isBusy}
              placeholder="financebot-7b"
              className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone placeholder:text-coreed-sage/50 focus:border-coreed-moss disabled:opacity-50"
            />
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-start justify-center gap-2 rounded border-2 border-dashed px-6 py-10 transition-colors ${
              dragActive ? "border-coreed-moss-bright bg-coreed-panel-raised" : "border-coreed-line"
            } ${isBusy ? "pointer-events-none opacity-60" : "cursor-pointer hover:border-coreed-moss"}`}
            onClick={() => !isBusy && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".gguf,.json,.bin,.safetensors"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            {isBusy ? (
              <>
                <span className="font-mono text-sm text-coreed-moss-bright coreed-pulse">
                  &gt; {statusLine || "processing…"}
                </span>
                <ResolvingHash value={rootHash} pending={true} className="text-xs" />
              </>
            ) : (
              <>
                <span className="font-mono text-sm text-coreed-bone">
                  &gt; drop model weights or config
                </span>
                <span className="font-mono text-xs text-coreed-sage">
                  .gguf · .safetensors · .json — click to browse
                </span>
              </>
            )}
          </div>

          {errorMsg && (
            <p className="font-mono text-xs text-coreed-clay" role="alert">
              {errorMsg}
            </p>
          )}

          <p className="font-mono text-xs leading-relaxed text-coreed-sage">
            Files route to 0G Storage nodes. Only the 32-byte Merkle root crosses onto 0G
            Chain — your weights never touch contract state.
          </p>
        </div>
      )}
    </div>
  );
}
