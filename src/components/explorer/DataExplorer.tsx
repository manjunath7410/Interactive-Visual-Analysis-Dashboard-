import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns3,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
  Calculator,
  Grid,
  Table as TableIcon,
  Plus,
} from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { normalizeRowValue } from '../../utils/dataEngine';
import { PivotTableExplorer } from './PivotTableExplorer';

interface DataExplorerProps {
  rows: Record<string, any>[];
  headers: string[];
  analytics: DatasetAnalytics;
  onExportCsv: () => void;
  onOpenCalculatedMetric?: () => void;
}

export const DataExplorer: React.FC<DataExplorerProps> = ({
  rows,
  headers,
  analytics,
  onExportCsv,
  onOpenCalculatedMetric,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'pivot'>('table');
  const [tableSearch, setTableSearch] = useState('');
  const deferredSearch = useDeferredValue(tableSearch);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(headers);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [inspectColumn, setInspectColumn] = useState<string | null>(null);

  // Synchronize visibleColumns and reset pagination whenever dataset headers change
  useEffect(() => {
    setVisibleColumns(headers);
    setCurrentPage(1);
    setSortColumn(null);
  }, [headers]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch]);

  // Filter & Sort rows with deferred search to maintain 60fps on large datasets (100k+ rows)
  const processedRows = useMemo(() => {
    let result = [...rows];

    // Search filter
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase();
      result = result.filter((row) =>
        visibleColumns.some((col) => {
          const val = row[col];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        })
      );
    }

    // Sort
    if (sortColumn) {
      const colType = analytics.columnProfiles[sortColumn]?.type;
      result.sort((a, b) => {
        const rawA = a[sortColumn];
        const rawB = b[sortColumn];

        if (rawA === rawB) return 0;
        if (rawA === null || rawA === undefined) return 1;
        if (rawB === null || rawB === undefined) return -1;

        if (colType === 'number') {
          const numA = normalizeRowValue(rawA, 'number') ?? 0;
          const numB = normalizeRowValue(rawB, 'number') ?? 0;
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        const strA = String(rawA).toLowerCase();
        const strB = String(rawB).toLowerCase();
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [rows, deferredSearch, sortColumn, sortDirection, visibleColumns, analytics]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageRows = processedRows.slice(startIndex, startIndex + pageSize);

  const handleHeaderSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const toggleColumnVisibility = (col: string) => {
    if (visibleColumns.includes(col)) {
      if (visibleColumns.length > 1) {
        setVisibleColumns(visibleColumns.filter((c) => c !== col));
      }
    } else {
      setVisibleColumns([...visibleColumns, col]);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Dataset Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="h-full flex flex-col justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Total Records
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums my-1">
            {analytics.totalRows.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 mt-1">
            {rows.length < analytics.totalRows
              ? `${rows.length.toLocaleString()} matching filters`
              : 'Full dataset'}
          </div>
        </div>

        <div className="h-full flex flex-col justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Columns & Schema
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums my-1">
            {analytics.totalColumns}
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 mt-1 truncate">
            {analytics.numericColumnNames.length} num · {analytics.categoricalColumnNames.length} cat · {analytics.dateColumnNames.length} date
          </div>
        </div>

        <div className="h-full flex flex-col justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Missing Values
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums my-1">
            {analytics.overallMissingCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 mt-1">
            {analytics.overallMissingPercentage}% of all cells
          </div>
        </div>

        <div className="h-full flex flex-col justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Duplicate Rows
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums my-1">
            {analytics.duplicateRows.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 mt-1">
            {analytics.duplicateRows === 0 ? 'Pristine uniqueness' : 'Redundant records'}
          </div>
        </div>
      </div>

      {/* View Switcher Toolbar & Table Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 shadow-lg backdrop-blur-md">
        {/* Left: View Mode Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Flat Records Table</span>
          </button>
          <button
            onClick={() => setViewMode('pivot')}
            className={`h-7 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'pivot'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Multi-Dimensional Pivot Matrix</span>
          </button>
        </div>

        {/* Right: Calculated Column Trigger & CSV Export */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenCalculatedMetric && (
            <button
              onClick={onOpenCalculatedMetric}
              className="h-8 inline-flex items-center gap-1.5 px-3 text-xs font-medium bg-slate-950 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500/50 rounded-lg transition-colors shadow-sm"
              title="Add custom formula calculated column"
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ Add Calculated Metric</span>
            </button>
          )}

          <button
            onClick={onExportCsv}
            className="h-8 inline-flex items-center gap-1.5 px-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {viewMode === 'pivot' ? (
        <PivotTableExplorer filteredRows={rows} analytics={analytics} />
      ) : (
        /* Table Toolbar & High-Density Table */
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Table Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search in visible table rows..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-4 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Table Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Columns Visibility Selector */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="h-9 inline-flex items-center gap-1.5 px-3 text-xs font-medium bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-white hover:border-slate-700 transition-colors shrink-0 whitespace-nowrap"
                >
                  <Columns3 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Columns ({visibleColumns.length}/{headers.length})</span>
                </button>

                {showColumnSelector && (
                  <div className="absolute right-0 top-full mt-2 w-56 p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-30 max-h-60 overflow-y-auto space-y-1">
                    <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      Toggle Column Visibility
                    </div>
                    {headers.map((h) => {
                      const isVisible = visibleColumns.includes(h);
                      return (
                        <button
                          key={h}
                          onClick={() => toggleColumnVisibility(h)}
                          className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg text-left"
                        >
                          <span className="truncate pr-2">{h}</span>
                          <span
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              isVisible
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'border-slate-700'
                            }`}
                          >
                            {isVisible && '✓'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* High-Density Data Table */}
        <div className="relative overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-800 select-none">
              <tr>
                <th className="p-3 w-12 text-center text-slate-600">#</th>
                {visibleColumns.map((col) => {
                  const prof = analytics.columnProfiles[col];
                  const isSorted = sortColumn === col;

                  return (
                    <th
                      key={col}
                      className="p-3 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleHeaderSort(col)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{col}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600 shrink-0 opacity-0 group-hover:opacity-100" />
                        )}

                        {/* Column profile inspect info icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectColumn(inspectColumn === col ? null : col);
                          }}
                          title={`Inspect ${col} statistics`}
                          className="ml-1 text-slate-500 hover:text-indigo-400 p-0.5 rounded"
                        >
                          <Info className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-[10px] font-normal text-slate-500 font-mono lowercase mt-0.5">
                        {prof?.type || 'string'}
                        {prof?.missingCount ? ` · ${prof.missingCount} null` : ''}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 1}
                    className="p-8 text-center text-slate-500 font-sans"
                  >
                    No matching records found for the current search or filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((row, rIdx) => {
                  const absoluteIndex = startIndex + rIdx + 1;
                  return (
                    <tr
                      key={rIdx}
                      className="hover:bg-slate-900/60 transition-colors"
                    >
                      <td className="p-3 text-center text-slate-600 text-[11px]">
                        {absoluteIndex}
                      </td>
                      {visibleColumns.map((col) => {
                        const val = row[col];
                        const isNull = val === null || val === undefined || val === '';
                        const colType = analytics.columnProfiles[col]?.type;

                        return (
                          <td
                            key={col}
                            className={`p-3 truncate max-w-xs ${
                              isNull
                                ? 'text-slate-600 italic'
                                : colType === 'number'
                                ? 'text-slate-100 tabular-nums'
                                : 'text-slate-300'
                            }`}
                          >
                            {isNull ? 'null' : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Row Count Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 inline-flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
            <span className="text-slate-500 ml-1">
              Showing {processedRows.length > 0 ? startIndex + 1 : 0}-
              {Math.min(startIndex + pageSize, processedRows.length)} of{' '}
              {processedRows.length.toLocaleString()}
            </span>
          </div>

          {/* Page navigation controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safePage <= 1}
              title="First Page"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              title="Previous Page"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="h-8 inline-flex items-center px-3 rounded-lg border border-slate-800/80 bg-slate-950/70 font-mono text-xs text-slate-200">
              Page {safePage} of {totalPages}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              title="Next Page"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage >= totalPages}
              title="Last Page"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Column Details Inspector Modal */}
      {inspectColumn && analytics.columnProfiles[inspectColumn] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white">{inspectColumn}</h4>
                <div className="text-xs text-indigo-400 font-mono">
                  Type: {analytics.columnProfiles[inspectColumn].type}
                </div>
              </div>
              <button
                onClick={() => setInspectColumn(null)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Unique Values</span>
                <span className="font-mono text-white font-bold">
                  {analytics.columnProfiles[inspectColumn].uniqueCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Missing / Nulls</span>
                <span className="font-mono text-white">
                  {analytics.columnProfiles[inspectColumn].missingCount} (
                  {analytics.columnProfiles[inspectColumn].missingPercentage}%)
                </span>
              </div>

              {analytics.columnProfiles[inspectColumn].type === 'number' && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Min / Max</span>
                    <span className="font-mono text-white">
                      {analytics.columnProfiles[inspectColumn].min} /{' '}
                      {analytics.columnProfiles[inspectColumn].max}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Mean / Median</span>
                    <span className="font-mono text-white">
                      {analytics.columnProfiles[inspectColumn].mean} /{' '}
                      {analytics.columnProfiles[inspectColumn].median}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Standard Deviation</span>
                    <span className="font-mono text-white">
                      {analytics.columnProfiles[inspectColumn].stdDev}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Interquartile Range (IQR)</span>
                    <span className="font-mono text-white">
                      {analytics.columnProfiles[inspectColumn].iqr}
                    </span>
                  </div>
                </>
              )}

              {analytics.columnProfiles[inspectColumn].topValues && (
                <div className="pt-2">
                  <div className="font-semibold text-slate-300 mb-2">Top Categories:</div>
                  <div className="space-y-1">
                    {analytics.columnProfiles[inspectColumn].topValues?.map((item) => (
                      <div key={item.value} className="flex justify-between text-[11px]">
                        <span className="text-slate-300 truncate max-w-[200px]">{item.value}</span>
                        <span className="text-slate-400 font-mono">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setInspectColumn(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
