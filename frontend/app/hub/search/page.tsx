"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ModelCard } from "@/components/hub/ModelCard";
import { SearchFilters, LICENSES, ARCHITECTURES, TAGS } from "@/types/model";
import { useModelRegistry } from "@/lib/useModelRegistry";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import type { ModelMeta } from "@/types/model";

export default function SearchPage() {
  const { isConnected } = useWalletContext();
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    architecture: "",
    license: "",
    tags: [],
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
    const formData = new FormData(e.target as HTMLFormElement);
    setFilters({ ...filters, query: formData.get("search") as string });
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string | string[]) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    if (currentTags.includes(tag)) {
      setFilters({ ...filters, tags: currentTags.filter(t => t !== tag) });
    } else {
      setFilters({ ...filters, tags: [...currentTags, tag] });
    }
  };

  const clearAllFilters = () => {
    setFilters({
      query: "",
      architecture: "",
      license: "",
      tags: [],
      sortBy: "recent",
      sortOrder: "desc"
    });
  };

  const hasActiveFilters = 
    filters.query || 
    filters.architecture || 
    filters.license || 
    (filters.tags && filters.tags.length > 0);

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-coreed-moss-bright to-coreed-clay bg-clip-text text-transparent mb-2">
          SEARCH MODELS
        </h1>
        <p className="text-coreed-sage">
          {total} models available
          {filters.query && ` for "${filters.query}"`}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="search"
              name="search"
              placeholder="Search models by name, description, or tags..."
              defaultValue={filters.query}
              className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-coreed-moss hover:bg-coreed-moss-bright text-coreed-void rounded-md font-medium transition-colors"
          >
            Search
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-3 text-coreed-sage hover:text-coreed-bone transition-colors"
            >
              Clear All
            </button>
          )}
        </form>
      </div>

      <div className="flex gap-8 flex-col lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-coreed-bone mb-4">Filters</h3>
            
            {/* Architecture Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-coreed-bone/70 mb-2">
                Architecture
              </label>
              <select
                value={filters.architecture}
                onChange={(e) => handleFilterChange("architecture", e.target.value)}
                className="w-full px-3 py-2 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone focus:outline-none focus:ring-1 focus:ring-coreed-moss-bright"
              >
                <option value="">All Architectures</option>
                {ARCHITECTURES.map((arch) => (
                  <option key={arch} value={arch}>{arch}</option>
                ))}
              </select>
            </div>

            {/* License Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-coreed-bone/70 mb-2">
                License
              </label>
              <select
                value={filters.license}
                onChange={(e) => handleFilterChange("license", e.target.value)}
                className="w-full px-3 py-2 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone focus:outline-none focus:ring-1 focus:ring-coreed-moss-bright"
              >
                <option value="">All Licenses</option>
                {LICENSES.map((license) => (
                  <option key={license} value={license}>{license}</option>
                ))}
              </select>
            </div>

            {/* Tags Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-coreed-bone/70 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      filters.tags?.includes(tag)
                        ? "bg-coreed-moss text-coreed-void"
                        : "bg-coreed-panel border border-coreed-line/30 text-coreed-sage hover:border-coreed-moss-bright"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div className="border-t border-coreed-line/30 pt-4">
              <label className="block text-sm font-medium text-coreed-bone/70 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full px-3 py-2 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone focus:outline-none focus:ring-1 focus:ring-coreed-moss-bright mb-2"
              >
                <option value="recent">Recently Added</option>
                <option value="popular">Most Popular</option>
                <option value="downloads">Most Downloaded</option>
                <option value="name">Name (A-Z)</option>
              </select>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
                className="w-full px-3 py-2 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone focus:outline-none focus:ring-1 focus:ring-coreed-moss-bright"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-grow">
          {error && (
            <div className="mb-6 rounded border border-coreed-clay bg-coreed-panel-raised p-4">
              <p className="font-mono text-sm text-coreed-clay" role="alert">
                {error}
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <p className="text-coreed-sage coreed-pulse">Loading models...</p>
            </div>
          ) : (
            <>
              {models.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-xl text-coreed-sage/70 mb-2">
                      No models found
                    </p>
                    <p className="text-coreed-sage/50 text-sm">
                      {filters.query 
                        ? `No models match "${filters.query}"`
                        : "Be the first to upload a model!"}
                    </p>
                    {isConnected && !filters.query && (
                      <Link
                        href="/hub/models/new"
                        className="inline-block mt-4 px-4 py-2 bg-coreed-moss hover:bg-coreed-moss-bright text-coreed-void rounded-md text-sm transition-colors"
                      >
                        Upload Model
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-coreed-sage mb-4">
                    Showing {models.length} of {total} models
                  </p>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {models.map((model) => (
                      <ModelCard key={model.modelId} model={model} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}