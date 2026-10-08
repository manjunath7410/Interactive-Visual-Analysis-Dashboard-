import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileQuestion,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  Search,
} from 'lucide-react';
import { DatasetAnalytics, FilterState } from '../../types/dataset';
import { formatNumberShort } from '../../utils/dataEngine';

interface DataHealthCenterProps {
  analytics: DatasetAnalytics;
  filterState: FilterState;
  onUpdateFilters: (updater: (prev: FilterState) => FilterState) => void;
  totalRawRows: number;
}

export const DataHealthCenter: React.FC<DataHealthCenterProps> = ({
  analytics,
  filterState,
  onUpdateFilters,
  totalRawRows,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalOutliers = analytics.outliersSummary.reduce((acc, o) => acc + o.count, 0);
  const outlierPct = totalRawRows > 0 ? ((totalOutliers / totalRawRows) * 100).toFixed(1) : '0';
  const duplicatePct = totalRawRows > 0 ? ((analytics.duplicateRows / totalRawRows) * 100).toFixed(1) : '0';

  // Toggle outliers filter
  const handleToggleOutliers = () => {
    onUpdateFilters((prev) => ({
      ...prev,
      onlyOutliers: !prev.onlyOutliers,
    }));
  };

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md overflow-hidden">
      {/* Header Banner */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight">
                Data Doctor & Hygiene Health Center
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                {analytics.completenessScore}% Cleanliness Index
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Audit data missingness, anomalies, and structural integrity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Outlier Pill Button */}
          {totalOutliers > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleOutliers();
              }}
              className={`h-7 px-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterState.onlyOutliers
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {filterState.onlyOutliers ? 'Viewing Outliers' : `Isolate ${totalOutliers} Outliers`}
              </span>
            </button>
          )}

          <div className="text-slate-400 hover:text-white p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expandable Health Audit Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-slate-800 p-5 space-y-5 bg-slate-950/40"
          >
            {/* 4 Health KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase font-mono">Data Completeness</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {analytics.completenessScore}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {analytics.overallMissingCount.toLocaleString()} missing cells
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase font-mono">Duplicates Rate</div>
                <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                  {duplicatePct}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {analytics.duplicateRows} identical rows
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase font-mono">Outlier Density</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                  {outlierPct}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {totalOutliers} values &gt; 1.5× IQR
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase font-mono">Schema Shape</div>
                <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
                  {analytics.totalColumns} Cols
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {analytics.numericColumnNames.length} num, {analytics.categoricalColumnNames.length} cat
                </div>
              </div>
            </div>

            {/* Column Missingness & Health Breakdown */}
            <div>
              <div className="text-xs font-bold text-white mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                <FileQuestion className="w-3.5 h-3.5 text-cyan-400" />
                <span>Column Integrity Breakdown</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {Object.values(analytics.columnProfiles).map((prof) => (
                  <div
                    key={prof.name}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-slate-200 truncate">{prof.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {prof.type} · {prof.uniqueCount.toLocaleString()} unique
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {prof.missingCount === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-medium">
                          <CheckCircle2 className="w-3 h-3" /> 100%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-mono font-medium">
                          <AlertTriangle className="w-3 h-3" /> {prof.missingPercentage}% null
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
