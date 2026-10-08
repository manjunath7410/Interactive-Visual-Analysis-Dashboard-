import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { formatNumberShort, formatMetricDisplay } from '../../utils/dataEngine';
import { useTheme } from '../../context/ThemeContext';
import { soundFx } from '../../utils/audioFx';

interface ExecutiveBriefingCardProps {
  analytics: DatasetAnalytics;
  filteredRows: Record<string, any>[];
  totalRows: number;
  datasetName: string;
}

export const ExecutiveBriefingCard: React.FC<ExecutiveBriefingCardProps> = ({
  analytics,
  filteredRows,
  totalRows,
  datasetName,
}) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isFiltered = filteredRows.length < totalRows;

  // Real-time statistical executive synthesis
  const executiveSummary = useMemo(() => {
    if (filteredRows.length === 0) {
      return {
        paragraph: 'No active records match the current filter criteria. Broaden your search or reset filters to view statistical insights.',
        topDriver: 'None',
        riskFlag: 'Empty cohort',
        strategicTakeaway: 'Reset filter constraints to restore analytical baseline.',
      };
    }

    const primaryNum = analytics.primaryNumericColumn;
    const primaryCat = analytics.primaryCategoricalColumn;
    const numProfile = primaryNum ? analytics.columnProfiles[primaryNum] : null;

    // Calculate active subset mean and top category share
    let activeSum = 0;
    const catCounts: Record<string, number> = {};
    const catSums: Record<string, number> = {};

    for (const row of filteredRows) {
      const val = primaryNum ? Number(row[primaryNum]) || 0 : 0;
      activeSum += val;

      if (primaryCat) {
        const cat = String(row[primaryCat] || 'Unassigned');
        catCounts[cat] = (catCounts[cat] || 0) + 1;
        catSums[cat] = (catSums[cat] || 0) + val;
      }
    }

    const activeMean = filteredRows.length > 0 ? activeSum / filteredRows.length : 0;
    const topCat = Object.entries(catSums).sort((a, b) => b[1] - a[1])[0] || ['All Segments', 0];
    const topCatShare = activeSum > 0 ? ((topCat[1] / activeSum) * 100).toFixed(1) : '0';

    const topCorr = analytics.correlations[0];
    const outlierSummary = analytics.outliersSummary[0];

    const paragraph = `Active cohort encompasses ${filteredRows.length.toLocaleString()} records ${
      isFiltered ? `(${((filteredRows.length / totalRows) * 100).toFixed(1)}% of total dataset)` : ''
    }${primaryNum ? ` driving ${formatMetricDisplay(activeSum, primaryNum)} in aggregate volume (averaging ${formatMetricDisplay(activeMean, primaryNum)})` : ''}. Performance is heavily anchored by ${topCat[0]}${primaryCat ? ` in ${primaryCat}` : ''}, accounting for ${topCatShare}% of measurable output. ${
      topCorr
        ? `Statistical correlation confirms a ${Math.abs(topCorr.correlation) > 0.6 ? 'strong' : 'moderate'} relationship between ${topCorr.colA} and ${topCorr.colB} (r = ${topCorr.correlation.toFixed(2)}), identifying it as a primary operational lever.`
        : 'Metric variance remains distributed without severe bivariate dependencies.'
    } ${
      outlierSummary && outlierSummary.count > 0
        ? `Attention is recommended for ${outlierSummary.count} statistical boundary anomalies observed in ${outlierSummary.column}.`
        : 'Data distribution indicates healthy variance across active quantiles.'
    }`;

    return {
      paragraph,
      topDriver: `${topCat[0]} (${topCatShare}% share)`,
      riskFlag: outlierSummary && outlierSummary.count > 0 ? `${outlierSummary.count} outliers in ${outlierSummary.column}` : 'Variance Normal',
      strategicTakeaway: `Focus resource allocation on ${topCat[0]} while establishing automated guardrails around extreme boundary observations.`,
    };
  }, [filteredRows, totalRows, analytics, isFiltered]);

  const handleCopy = () => {
    navigator.clipboard.writeText(executiveSummary.paragraph);
    setCopied(true);
    soundFx.playPop();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    setIsGenerating(true);
    soundFx.playTick();
    setTimeout(() => {
      setIsGenerating(false);
      soundFx.playChime();
    }, 450);
  };

  return (
    <div className={`w-full rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border ${theme.classes.border} p-5 shadow-lg backdrop-blur-md relative overflow-hidden transition-all duration-300`}>
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Executive Leadership Interpretation
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Autonomous Synthesis
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-level strategic briefing derived dynamically from current cohort filters
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            title="Copy executive summary for presentation / email"
            className="h-7 px-2.5 rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleRefresh}
            disabled={isGenerating}
            title="Re-synthesize summary"
            className="w-7 h-7 rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-7 h-7 rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Single-Paragraph Interpretation */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3.5"
          >
            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              {executiveSummary.paragraph}
            </p>

            {/* Micro Strategic Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                  Leading Driver
                </span>
                <span className="font-semibold text-white flex items-center gap-1.5 truncate">
                  <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{executiveSummary.topDriver}</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                  Volatility / Anomaly Check
                </span>
                <span className="font-semibold text-white flex items-center gap-1.5 truncate">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{executiveSummary.riskFlag}</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                  Prescriptive Takeaway
                </span>
                <span className="font-semibold text-emerald-300 flex items-center gap-1.5 truncate">
                  <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{executiveSummary.strategicTakeaway}</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
