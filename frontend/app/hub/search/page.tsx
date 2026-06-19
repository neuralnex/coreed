"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusStrip } from "@/components/StatusStrip";
import { ModelCard } from "@/components/hub/ModelCard";
import { SearchFilters, LICENSES, ARCHITECTURES } from "@/types/model";
import { useModelRegistry } from "@/lib/useModelRegistry";
import type { ModelMeta } from "@/types/model";
import type { JsonRpcSigner } from "ethers";

export default function SearchPage() {
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    architecture: "",
    license: "",
    sortBy: "recent",
    sortOrder: "desc"
  });

  const { searchModels, error } = useModelRegistry();

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const result = await searchModels(filters);
        setModels(result.models);
        setTotal(result.total);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, [filters, searchModels]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, query: (e.target as HTMLFormElement).search.value });
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | number | boolean | undefined) => {
    setFilters({ ...filters, [key]: value });
  };

  const sortOptions = [
    { value: "recent", label: "Recently Added" },
    { value: "popular", label: "Most Popular" },
    { value: "downloads", label: "Most Downloaded" },
    { value: "name", label: "Name (A-Z)" }
  ];

  return (
    <>
      <StatusStrip
        address={address}
        onConnect={(s, addr) => {
          setSigner(s);
          setAddress(addr);
        }}
      />

      <main className="mx-auto flex max-w-6xl flex-1 flex-col px-6 py-12">
        <div className="mb-8">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="font-mono text-2xl font-medium tracking-tight text-coreed-bone">
                search models
              </h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-coreed-sage">
                Find models by architecture, license, or keyword.
              </p>
            </div>
            <Link
              href="/hub"
              className="font-mono text-xs text-coreed-sage hover:text-coreed-bone"
            >
              ← back to hub
            </Link>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <label htmlFor="search" className="mb-1.5 block font-mono text-xs text-coreed-sage">
                Search
              </label>
              <input
                id="search"
                name="search"
                defaultValue={filters.query}
                placeholder="Search by name or description..."
                className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone placeholder:text-coreed-sage/50 focus:border-coreed-moss"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="rounded border border-coreed-line bg-coreed-panel-raised px-4 py-2 font-mono text-xs text-coreed-bone transition-colors hover:border-coreed-moss"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setFilters({
                  query: "",
                  architecture: "",
                  license: "",
                  sortBy: "recent",
                  sortOrder: "desc"
                })}
                className="rounded border border-coreed-line px-4 py-2 font-mono text-xs text-coreed-sage hover:border-coreed-moss hover:text-coreed-bone"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block font-mono text-xs text-coreed-sage">
                Architecture
              </label>
              <select
                value={filters.architecture}
                onChange={(e) => handleFilterChange("architecture", e.target.value)}
                className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone focus:border-coreed-moss"
              >
                <option value="">All Architectures</option>
                {ARCHITECTURES.map((arch) => (
                  <option key={arch} value={arch}>{arch}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-xs text-coreed-sage">
                License
              </label>
              <select
                value={filters.license}
                onChange={(e) => handleFilterChange("license", e.target.value)}
                className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone focus:border-coreed-moss"
              >
                <option value="">All Licenses</option>
                {LICENSES.map((license) => (
                  <option key={license} value={license}>{license}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-xs text-coreed-sage">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone focus:border-coreed-moss"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded border border-coreed-clay bg-coreed-panel-raised p-4">
            <p className="font-mono text-xs text-coreed-clay" role="alert">
              {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-mono text-coreed-sage coreed-pulse">Searching...</p>
          </div>
        ) : (
          <>
            <p className="mb-4 font-mono text-xs text-coreed-sage">
              {total} models found
            </p>
            {models.length === 0 ? (
              <div className="flex-1 flex items-center justify-center rounded border border-coreed-line bg-coreed-panel p-12">
                <p className="font-mono text-coreed-sage">
                  No models match your search criteria.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {models.map((model) => (
                  <ModelCard key={model.modelId} model={model} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
