"use client";

import { useState, useCallback } from "react";
import { TAGS, ARCHITECTURES, LICENSES } from "@/types/model";

interface SearchCondition {
  id: string;
  field: "name" | "description" | "tags" | "architecture" | "license" | "creator";
  operator: "contains" | "equals" | "not_equals" | "greater_than" | "less_than";
  value: string;
}

interface AdvancedSearchProps {
  onSearch: (filters: Record<string, any>) => void;
  onReset: () => void;
}

type LogicalOperator = "AND" | "OR";

export function AdvancedSearch({ onSearch, onReset }: AdvancedSearchProps) {
  const [conditions, setConditions] = useState<SearchCondition[]>([
    { id: "1", field: "name", operator: "contains", value: "" }
  ]);
  const [operator, setOperator] = useState<LogicalOperator>("AND");
  const [isExpanded, setIsExpanded] = useState(false);

  const addCondition = useCallback(() => {
    const newId = (conditions.length + 1).toString();
    setConditions([...conditions, { 
      id: newId, 
      field: "name", 
      operator: "contains", 
      value: "" 
    }]);
  }, [conditions]);

  const removeCondition = useCallback((id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== id));
    }
  }, [conditions]);

  const updateCondition = useCallback((id: string, key: keyof SearchCondition, value: string) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, [key]: value } : c
    ));
  }, [conditions]);

  const getOperatorOptions = (field: string): ("contains" | "equals" | "not_equals" | "greater_than" | "less_than")[] => {
    switch (field) {
      case "name":
      case "description":
      case "tags":
      case "architecture":
      case "license":
      case "creator":
        return ["contains", "equals", "not_equals"];
      case "parameters":
        return ["greater_than", "less_than", "equals"];
      default:
        return ["contains", "equals"];
    }
  };

  const getFieldOptions: () => { value: string; label: string }[] = useCallback(() => [
    { value: "name", label: "Model Name" },
    { value: "description", label: "Description" },
    { value: "tags", label: "Tags" },
    { value: "architecture", label: "Architecture" },
    { value: "license", label: "License" },
    { value: "creator", label: "Creator Address" },
  ], []);

  const buildSearchQuery = useCallback((): Record<string, any> => {
    const query: Record<string, any> = {};

    if (conditions.length === 0) return query;

    // Build query based on operator and conditions
    conditions.forEach((condition, index) => {
      const { field, operator, value } = condition;

      if (!value) return;

      // For simple implementation, we'll use AND logic by default
      // In a real implementation, you'd need backend support for complex queries
      switch (field) {
        case "name":
        case "description":
          if (operator === "contains") {
            query[`${field}_like`] = value;
          } else if (operator === "equals") {
            query[field] = value;
          } else if (operator === "not_equals") {
            query[`${field}_not`] = value;
          }
          break;
        case "tags":
          if (operator === "contains") {
            query.tags = value.split(",").map(t => t.trim());
          } else if (operator === "equals") {
            query.tags = [value];
          }
          break;
        case "architecture":
        case "license":
          if (operator === "equals") {
            query[field] = value;
          } else if (operator === "not_equals") {
            query[`${field}_not`] = value;
          }
          break;
        case "creator":
          if (operator === "equals") {
            query.creator = value;
          }
          break;
      }
    });

    return query;
  }, [conditions]);

  const handleSearch = useCallback(() => {
    const query = buildSearchQuery();
    onSearch(query);
  }, [buildSearchQuery, onSearch]);

  const getAutocompleteOptions = (field: string): string[] => {
    switch (field) {
      case "architecture":
        return ARCHITECTURES;
      case "license":
        return LICENSES;
      case "tags":
        return TAGS;
      default:
        return [];
    }
  };

  return (
    <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-coreed-line/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🔍</span>
          <div>
            <h3 className="font-semibold text-coreed-bone">Advanced Search</h3>
            <p className="text-sm text-coreed-sage/70">Build complex queries with AND/OR logic</p>
          </div>
        </div>
        <span className="text-coreed-sage">{isExpanded ? "←" : "→"}</span>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-coreed-line/30">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-coreed-sage/70">Match:</span>
            <button
              onClick={() => setOperator("AND")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                operator === "AND"
                  ? "bg-coreed-moss/20 text-coreed-bone"
                  : "bg-coreed-panel border border-coreed-line/30 text-coreed-sage hover:border-coreed-moss"
              }`}
            >
              ALL (AND)
            </button>
            <button
              onClick={() => setOperator("OR")}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                operator === "OR"
                  ? "bg-coreed-moss/20 text-coreed-bone"
                  : "bg-coreed-panel border border-coreed-line/30 text-coreed-sage hover:border-coreed-moss"
              }`}
            >
              ANY (OR)
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {conditions.map((condition) => {
              const fieldOptions = getFieldOptions();
              const operatorOptions = getOperatorOptions(condition.field);
              const autocompleteOptions = getAutocompleteOptions(condition.field);

              return (
                <div key={condition.id} className="p-3 bg-coreed-panel rounded-lg border border-coreed-line/30">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Field Selector */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-coreed-bone/70 mb-1">Field</label>
                      <select
                        value={condition.field}
                        onChange={(e) => updateCondition(condition.id, "field", e.target.value)}
                        className="w-full px-3 py-2 bg-coreed-line/20 border border-coreed-line/40 rounded text-sm text-coreed-bone focus:outline-none focus:ring-1 focus:ring-coreed-moss-bright"
                      >
                        {fieldOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Operator Selector */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-coreed-bone/70 mb-1">Operator</label>
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(condition.id, "operator", e.target.value)}
                        className="w-full px-3 py-2 bg-coreed-line/20 border border-coreed-line/40 rounded text-sm text-coreed-bone focus:outline-none focus:ring-1 focus:ring-coreed-moss-bright"
                      >
                        {operatorOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt === "contains" ? "contains" : 
                             opt === "equals" ? "is" :
                             opt === "not_equals" ? "is not" :
                             opt === "greater_than" ? ">" : "<"}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Value Input */}
                    <div className="md:col-span-5">
                      <label className="block text-xs font-medium text-coreed-bone/70 mb-1">Value</label>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(condition.id, "value", e.target.value)}
                        placeholder={condition.field === "tags" ? "llm,text-generation" : ""}
                        className="w-full px-3 py-2 bg-coreed-line/20 border border-coreed-line/40 rounded text-sm text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-1 focus:ring-coreed-moss-bright"
                        list={condition.field && autocompleteOptions.length > 0 ? `options-${condition.id}` : undefined}
                      />
                      {condition.field && autocompleteOptions.length > 0 && (
                        <datalist id={`options-${condition.id}`}>
                          {autocompleteOptions.map((opt) => (
                            <option key={opt} value={opt} />
                          ))}
                        </datalist>
                      )}
                    </div>

                    {/* Remove Button */}
                    <div className="md:col-span-1 flex items-end">
                      {conditions.length > 1 && (
                        <button
                          onClick={() => removeCondition(condition.id)}
                          className="px-2 py-2 text-coreed-sage hover:text-coreed-bone transition-colors text-lg"
                          title="Remove condition"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={addCondition}
              className="flex-1 px-4 py-2 bg-coreed-line/20 border border-coreed-line/40 text-coreed-sage hover:border-coreed-moss hover:bg-coreed-moss/10 rounded text-sm transition-colors"
            >
              + Add Condition
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-coreed-moss hover:bg-coreed-moss-bright text-coreed-void rounded text-sm font-medium transition-colors"
            >
              Search
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 text-coreed-sage hover:text-coreed-bone rounded text-sm transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="mt-4 p-3 bg-coreed-line/10 border border-coreed-line/30 rounded text-xs">
            <p className="text-coreed-sage/70">
              <strong>Tip:</strong> Use AND to match all conditions, OR to match any. 
              Combine with standard filters for even more control.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

