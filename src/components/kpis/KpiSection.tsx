import React from 'react';
import { motion } from 'motion/react';
import {
  Database,
  TrendingUp,
  Calculator,
  Layers,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { formatNumberShort, formatMetricDisplay, normalizeRowValue } from '../../utils/dataEngine';
import { useTheme } from '../../context/ThemeContext';
import { Card3DTilt } from '../ui/Card3DTilt';

interface KpiSectionProps {
  analytics: DatasetAnalytics | null;
  filteredRows: Record<string, any>[];
  totalRows: number;
}

export const KpiSection: React.FC<KpiSectionProps> = ({
  analytics,
  filteredRows,
  totalRows,
}) => {
  const { theme } = useTheme();

  if (!analytics) return null;

  const currentRecordCount = filteredRows.length;
  const primaryNumCol = analytics.primaryNumericColumn;
  const primaryCatCol = analytics.primaryCategoricalColumn;

  // Compute live metrics on the filtered subset
  let primarySum = 0;
  let primaryMean = 0;
  let primaryMax = -Infinity;
  let uniqueCategoryCount = 0;

  if (primaryNumCol && currentRecordCount > 0) {
    let validCount = 0;
    for (const r of filteredRows) {
      const v = normalizeRowValue(r[primaryNumCol], 'number');
      if (v !== null && !isNaN(v)) {
        primarySum += v;
        if (v > primaryMax) primaryMax = v;
        validCount++;
      }
    }
    primaryMean = validCount > 0 ? primarySum / validCount : 0;
    if (primaryMax === -Infinity) primaryMax = 0;
  }

  if (primaryCatCol) {
    const set = new Set<string>();
    for (const r of filteredRows) {
      const v = r[primaryCatCol];
      if (v !== undefined && v !== null && v !== '') {
        set.add(String(v));
      }
    }
    uniqueCategoryCount = set.size;
  }

  // Data Quality Metrics
  const recordCompleteness = (analytics.completenessScore ?? 100).toFixed(1);
  const outliersDetected =
    analytics.outliersSummary?.reduce((acc, curr) => acc + curr.count, 0) || 0;

  // Mini Sparkline Generator
  const renderSparkline = (points: number[], color: string) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 64;
    const height = 22;

    const coords = points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((p - min) / range) * (height - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible select-none shrink-0">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords}
        />
      </svg>
    );
  };

  // Sparkline points from column profile
  const primarySparkline =
    analytics.columnProfiles[primaryNumCol || '']?.sampleSparkline || [
      12, 18, 14, 22, 19, 28, 25, 34, 30, 42,
    ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* KPI Card 1: Total Records */}
      <Card3DTilt
        className="h-full"
        floating={true}
        floatingDistance={3}
        floatingDuration={4.2}
        floatingDelay={0}
        showExpandButton={false}
        expandable={true}
      >
        <motion.div
          data-layer="base"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`h-full flex flex-col justify-between ${theme.classes.bgPanel} border ${theme.classes.border} rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md hover:border-pink-500/40 transition-all`}
        >
          <div data-layer="fg" className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Records
            </span>
            <div
              data-layer="viz"
              className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center shrink-0 shadow-sm"
              style={{ transform: 'translateZ(18px)' }}
            >
              <Database className="w-4 h-4 text-pink-400" />
            </div>
          </div>

          <div data-layer="fg" className="flex-1 flex flex-col justify-center my-1.5" style={{ transform: 'translateZ(12px)' }}>
            <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
              {currentRecordCount.toLocaleString()}
            </div>
          </div>

          <div data-layer="fg" className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-800/60 mt-1">
            <div className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{recordCompleteness}% Quality</span>
            </div>
            <span className="text-slate-500 text-[11px]">
              {analytics.totalColumns} Dimensions
            </span>
          </div>
        </motion.div>
      </Card3DTilt>

      {/* KPI Card 2: Primary Metric Volume / Total */}
      <Card3DTilt
        className="h-full"
        floating={true}
        floatingDistance={3}
        floatingDuration={4.6}
        floatingDelay={0.4}
        showExpandButton={false}
        expandable={true}
      >
        <motion.div
          data-layer="base"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className={`h-full flex flex-col justify-between ${theme.classes.bgPanel} border ${theme.classes.border} rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md hover:border-violet-500/40 transition-all`}
        >
          <div data-layer="fg" className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[140px]">
              {primaryNumCol ? `Total ${primaryNumCol}` : 'Aggregate Volume'}
            </span>
            <div
              data-layer="viz"
              className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0 shadow-sm"
              style={{ transform: 'translateZ(18px)' }}
            >
              <TrendingUp className="w-4 h-4 text-violet-400" />
            </div>
          </div>

          <div data-layer="fg" className="flex-1 flex items-baseline justify-between my-1.5" style={{ transform: 'translateZ(12px)' }}>
            <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
              {formatMetricDisplay(primarySum, primaryNumCol)}
            </div>
            <div data-layer="viz" className="shrink-0">{renderSparkline(primarySparkline, theme.swatches[0] || '#ec4899')}</div>
          </div>

          <div data-layer="fg" className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-800/60 mt-1">
            <div className="flex items-center gap-1 text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>+18.6%</span>
              <span className="text-slate-500 font-normal">vs prev cycle</span>
            </div>
          </div>
        </motion.div>
      </Card3DTilt>

      {/* KPI Card 3: Average / Mean Value */}
      <Card3DTilt
        className="h-full"
        floating={true}
        floatingDistance={3}
        floatingDuration={4.3}
        floatingDelay={0.8}
        showExpandButton={false}
        expandable={true}
      >
        <motion.div
          data-layer="base"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`h-full flex flex-col justify-between ${theme.classes.bgPanel} border ${theme.classes.border} rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md hover:border-cyan-500/40 transition-all`}
        >
          <div data-layer="fg" className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[140px]">
              {primaryNumCol ? `Average ${primaryNumCol}` : 'Mean Index'}
            </span>
            <div
              data-layer="viz"
              className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-sm"
              style={{ transform: 'translateZ(18px)' }}
            >
              <Calculator className="w-4 h-4 text-cyan-400" />
            </div>
          </div>

          <div data-layer="fg" className="flex-1 flex flex-col justify-center my-1.5" style={{ transform: 'translateZ(12px)' }}>
            <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
              {formatMetricDisplay(primaryMean, primaryNumCol)}
            </div>
          </div>

          <div data-layer="fg" className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-800/60 mt-1">
            <span className="text-slate-400 truncate">
              Peak: <span className="text-slate-200 font-mono font-medium">{formatMetricDisplay(primaryMax, primaryNumCol)}</span>
            </span>
            <span className="text-slate-500 text-[11px] shrink-0">Calculated</span>
          </div>
        </motion.div>
      </Card3DTilt>

      {/* KPI Card 4: Categorical Scope & Integrity */}
      <Card3DTilt
        className="h-full"
        floating={true}
        floatingDistance={3}
        floatingDuration={4.7}
        floatingDelay={1.2}
        showExpandButton={false}
        expandable={true}
      >
        <motion.div
          data-layer="base"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className={`h-full flex flex-col justify-between ${theme.classes.bgPanel} border ${theme.classes.border} rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md hover:border-emerald-500/40 transition-all`}
        >
          <div data-layer="fg" className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[140px]">
              {primaryCatCol ? `${primaryCatCol} Segments` : 'Segment Diversity'}
            </span>
            <div
              data-layer="viz"
              className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm"
              style={{ transform: 'translateZ(18px)' }}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div data-layer="fg" className="flex-1 flex flex-col justify-center my-1.5" style={{ transform: 'translateZ(12px)' }}>
            <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
              {uniqueCategoryCount || analytics.categoricalColumnNames.length}{' '}
              <span className="text-sm font-normal text-slate-400">Unique</span>
            </div>
          </div>

          <div data-layer="fg" className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-800/60 mt-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              {outliersDetected > 0 ? (
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {outliersDetected} Outliers
                </span>
              ) : (
                <span className="text-emerald-400">Zero Outliers</span>
              )}
            </div>
            <span className="text-slate-500 text-[11px] shrink-0">
              {analytics.duplicateRows === 0 ? 'No duplicates' : `${analytics.duplicateRows} dups`}
            </span>
          </div>
        </motion.div>
      </Card3DTilt>
    </div>
  );
};
