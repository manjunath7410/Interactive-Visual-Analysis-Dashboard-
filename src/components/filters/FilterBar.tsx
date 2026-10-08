import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Calendar,
  Check,
  ChevronDown,
  RotateCcw,
  Sliders,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { DatasetAnalytics, FilterState } from '../../types/dataset';
import { parseNaturalLanguageQuery } from '../../utils/dataEngine';
import { soundFx } from '../../utils/audioFx';

interface FilterBarProps {
  analytics: DatasetAnalytics;
  filterState: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  filteredCount: number;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  analytics,
  filterState,
  onFilterChange,
  filteredCount,
  totalCount,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Natural Language query parsing
  const nlParsed = useMemo(() => {
    return parseNaturalLanguageQuery(filterState.searchQuery, analytics);
  }, [filterState.searchQuery, analytics]);

  const handleApplyNlQuery = () => {
    if (!nlParsed) return;
    soundFx.playChime();
    onFilterChange({
      ...filterState,
      categoryFilters: {
        ...filterState.categoryFilters,
        ...(nlParsed.categoryFilters || {}),
      },
      numericRanges: {
        ...filterState.numericRanges,
        ...(nlParsed.numericRanges || {}),
      },
      onlyOutliers: nlParsed.onlyOutliers ?? filterState.onlyOutliers,
      searchQuery: '', // clear search after applying structured rules
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handleDocumentClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [openDropdown]);

  // Active filter count
  const activeCount =
    (filterState.searchQuery ? 1 : 0) +
    Object.values(filterState.categoryFilters).reduce(
      (acc, curr) => acc + (curr.length > 0 ? 1 : 0),
      0
    ) +
    Object.keys(filterState.numericRanges).length +
    (filterState.dateRange ? 1 : 0) +
    (filterState.onlyOutliers ? 1 : 0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filterState,
      searchQuery: e.target.value,
    });
  };

  const handleClearSearch = () => {
    onFilterChange({
      ...filterState,
      searchQuery: '',
    });
  };

  const toggleCategoryValue = (columnName: string, value: string) => {
    const currentList = filterState.categoryFilters[columnName] || [];
    const exists = currentList.includes(value);
    const updated = exists
      ? currentList.filter((v) => v !== value)
      : [...currentList, value];

    const newCategoryFilters = { ...filterState.categoryFilters };
    if (updated.length === 0) {
      delete newCategoryFilters[columnName];
    } else {
      newCategoryFilters[columnName] = updated;
    }

    onFilterChange({
      ...filterState,
      categoryFilters: newCategoryFilters,
    });
  };

  const handleClearColumnFilter = (columnName: string) => {
    const newCategoryFilters = { ...filterState.categoryFilters };
    delete newCategoryFilters[columnName];
    onFilterChange({
      ...filterState,
      categoryFilters: newCategoryFilters,
    });
  };

  const handleToggleOutliers = () => {
    onFilterChange({
      ...filterState,
      onlyOutliers: !filterState.onlyOutliers,
    });
  };

  const handleResetAll = () => {
    onFilterChange({
      searchQuery: '',
      categoryFilters: {},
      numericRanges: {},
      dateRange: undefined,
      onlyOutliers: false,
    });
    setOpenDropdown(null);
  };

  // Selectable categorical columns (limit to top 4 with good unique counts)
  const filterableCategories = analytics.categoricalColumnNames.slice(0, 4);

  return (
    <div ref={containerRef} className="w-full bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        {/* Left: Search input & NL Smart Filter Suggestion */}
        <div className="flex-1 max-w-md w-full space-y-1.5">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder='Search records or type query e.g. "revenue > 50k", "region: East"...'
              value={filterState.searchQuery}
              onChange={handleSearchChange}
              className="w-full h-8 bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-8 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            {filterState.searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Smart NL Query Suggestion Chip */}
          {nlParsed && (
            <button
              onClick={handleApplyNlQuery}
              className="w-full text-left px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-[11px] text-cyan-300 font-mono flex items-center justify-between hover:bg-cyan-500/25 transition-colors"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">Apply smart filter rule for: "{filterState.searchQuery}"</span>
              </span>
              <span className="font-bold flex items-center gap-0.5 shrink-0 ml-1">
                Apply <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          )}
        </div>

        {/* Center: Dropdown Categorical Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {filterableCategories.map((colName) => {
            const profile = analytics.columnProfiles[colName];
            const selectedVals = filterState.categoryFilters[colName] || [];
            const isOpen = openDropdown === colName;
            const topValues = profile?.topValues || [];

            return (
              <div key={colName} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(isOpen ? null : colName)}
                  className={`h-8 inline-flex items-center gap-1.5 px-3 text-xs rounded-lg border transition-all shrink-0 whitespace-nowrap ${
                    selectedVals.length > 0
                      ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/40 font-medium'
                      : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="truncate max-w-[110px]">{colName}</span>
                  {selectedVals.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] inline-flex items-center justify-center font-mono shrink-0">
                      {selectedVals.length}
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-60 p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-30 space-y-1">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800 text-[11px] text-slate-400 font-medium">
                      <span>Filter {colName}</span>
                      {selectedVals.length > 0 && (
                        <button
                          onClick={() => handleClearColumnFilter(colName)}
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-0.5 py-1">
                      {topValues.length === 0 ? (
                        <div className="text-[11px] text-slate-500 px-2 py-2">No categories found</div>
                      ) : (
                        topValues.map((item) => {
                          const isChecked = selectedVals.includes(item.value);
                          return (
                            <button
                              key={item.value}
                              onClick={() => toggleCategoryValue(colName, item.value)}
                              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-slate-800/80 transition-colors text-left"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                    isChecked
                                      ? 'bg-indigo-600 border-indigo-500 text-white'
                                      : 'border-slate-700 bg-slate-950'
                                  }`}
                                >
                                  {isChecked && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <span className="text-slate-200 truncate">{item.value}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                                {item.count}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick Outlier Filter Toggle */}
          {analytics.outliersSummary.length > 0 && (
            <button
              onClick={handleToggleOutliers}
              className={`h-8 inline-flex items-center gap-1.5 px-3 text-xs rounded-lg border transition-all shrink-0 whitespace-nowrap ${
                filterState.onlyOutliers
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Outliers Only</span>
            </button>
          )}

          {/* Clear All Filters Action */}
          {activeCount > 0 && (
            <button
              onClick={handleResetAll}
              className="h-8 inline-flex items-center gap-1.5 px-2.5 text-xs text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors shrink-0 whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3 shrink-0" />
              <span>Clear ({activeCount})</span>
            </button>
          )}
        </div>

        {/* Right: Record count matching status */}
        <div className="h-8 inline-flex items-center text-right text-xs text-slate-400 shrink-0">
          Showing <span className="text-white font-mono font-semibold tabular-nums mx-1">{filteredCount.toLocaleString()}</span> of{' '}
          <span className="font-mono tabular-nums ml-1">{totalCount.toLocaleString()}</span> records
        </div>
      </div>
    </div>
  );
};
