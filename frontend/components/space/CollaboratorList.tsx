"use client";

import { useState } from "react";
import type { Collaborator, SpaceRole } from "@/types/space";

interface CollaboratorListProps {
  spaceId: string;
  collaborators: Collaborator[];
  owner: string;
  currentAddress: string | null;
  onAddCollaborator: (address: string, role: SpaceRole) => Promise<void>;
  onRemoveCollaborator: (address: string) => Promise<void>;
  onChangeRole: (address: string, newRole: SpaceRole) => Promise<void>;
}

export function CollaboratorList({
  spaceId,
  collaborators,
  owner,
  currentAddress,
  onAddCollaborator,
  onRemoveCollaborator,
  onChangeRole
}: CollaboratorListProps) {
  const [newAddress, setNewAddress] = useState("");
  const [newRole, setNewRole] = useState<SpaceRole>("operator");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const isOwner = currentAddress?.toLowerCase() === owner?.toLowerCase();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress || !isOwner) return;

    setLoading("adding");
    setError(null);

    try {
      await onAddCollaborator(newAddress, newRole);
      setNewAddress("");
      setNewRole("operator");
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add collaborator");
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (address: string) => {
    if (!isOwner) return;

    setLoading(`removing-${address}`);
    setError(null);

    try {
      await onRemoveCollaborator(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove collaborator");
    } finally {
      setLoading(null);
    }
  };

  const handleRoleChange = async (address: string, newRole: SpaceRole) => {
    if (!isOwner) return;

    setLoading(`changing-${address}`);
    setError(null);

    try {
      await onChangeRole(address, newRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role");
    } finally {
      setLoading(null);
    }
  };

  const roleColors: Record<SpaceRole, string> = {
    owner: "text-coreed-moss-bright",
    admin: "text-coreed-moss",
    operator: "text-coreed-sage",
    viewer: "text-coreed-bone/70"
  };

  return (
    <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-coreed-line/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">👥</span>
          <div>
            <h3 className="font-semibold text-coreed-bone">Collaborators</h3>
            <p className="text-sm text-coreed-sage/70">{collaborators.length} members</p>
          </div>
        </div>
        <span className="text-coreed-sage">{expanded ? "←" : "→"}</span>
      </button>

      {expanded && (
        <div className="p-4 border-t border-coreed-line/30">
          {/* Owner */}
          <div className="flex items-center justify-between p-3 bg-coreed-panel rounded-md mb-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-coreed-moss/20 flex items-center justify-center text-sm">👑</span>
              <div>
                <p className="font-mono text-sm text-coreed-bone">{owner.slice(0, 6)}...{owner.slice(-4)}</p>
                <p className={`text-xs ${roleColors.owner}`}>Owner</p>
              </div>
            </div>
          </div>

          {/* Collaborators list */}
          <div className="space-y-2 mb-4">
            {collaborators.map((collab) => (
              <div key={collab.address} className="flex items-center justify-between p-3 bg-coreed-panel rounded-md">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-coreed-line/20 flex items-center justify-center text-sm">👤</span>
                  <div>
                    <p className="font-mono text-sm text-coreed-bone">{collab.address.slice(0, 6)}...{collab.address.slice(-4)}</p>
                    <p className={`text-xs ${roleColors[collab.role]}`}>{collab.role}</p>
                  </div>
                </div>
                {isOwner && (
                  <div className="flex items-center gap-2">
                    <select
                      value={collab.role}
                      onChange={(e) => handleRoleChange(collab.address, e.target.value as SpaceRole)}
                      disabled={loading === `changing-${collab.address}`}
                      className="bg-coreed-line/30 border border-coreed-line/50 rounded text-xs px-2 py-1 text-coreed-bone"
                    >
                      <option value="admin">Admin</option>
                      <option value="operator">Operator</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemove(collab.address)}
                      disabled={loading === `removing-${collab.address}`}
                      className="text-xs text-coreed-sage hover:text-coreed-bone disabled:opacity-50"
                    >
                      {loading === `removing-${collab.address}` ? "..." : "Remove"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add collaborator form */}
          {isOwner && (
            <form onSubmit={handleAdd} className="flex flex-col gap-3 p-3 bg-coreed-moss/5 border border-coreed-moss/20 rounded-md">
              <h4 className="text-sm font-semibold text-coreed-bone">Add Collaborator</h4>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="0x... (address)"
                className="w-full px-3 py-2 bg-coreed-panel border border-coreed-line/30 rounded text-sm text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-1 focus:ring-coreed-moss-bright"
              />
              <div className="flex gap-2">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as SpaceRole)}
                  className="flex-1 px-3 py-2 bg-coreed-panel border border-coreed-line/30 rounded text-sm text-coreed-bone focus:outline-none focus:ring-1 focus:ring-coreed-moss-bright"
                >
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="submit"
                  disabled={!newAddress || loading === "adding"}
                  className="px-4 py-2 bg-coreed-moss hover:bg-coreed-moss-bright disabled:bg-coreed-line disabled:cursor-not-allowed text-coreed-void rounded text-sm transition-colors"
                >
                  {loading === "adding" ? "Adding..." : "Add"}
                </button>
              </div>
              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}
            </form>
          )}

          {!isOwner && (
            <p className="text-xs text-coreed-sage/50 text-center py-3">
              Only the owner can manage collaborators
            </p>
          )}
        </div>
      )}
    </div>
  );
}
