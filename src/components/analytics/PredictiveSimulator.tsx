import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Sliders,
  Sparkles,
  ArrowRight,
  Calculator,
  Compass,
  Zap,
  Info,
  RotateCcw,
} from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { formatNumberShort, formatMetricDisplay, normalizeRowValue, calculatePearsonCorrelation } from '../../utils/dataEngine';
import { useTheme } from '../../context/ThemeContext';

interface PredictiveSimulatorProps {
  filteredRows: Record<string, any>[];
  analytics: DatasetAnalytics;
}

export const PredictiveSimulator: React.FC<PredictiveSimulatorProps> = ({
  filteredRows,
  analytics,
}) => {
  const { theme } = useTheme();
  const numCols = analytics.numericColumnNames;

  const defaultDriver = analytics.correlations[0]?.colA || numCols[0] || '';
  const defaultTarget = analytics.correlations[0]?.colB || numCols[1] || numCols[0] || '';

  const [driverCol, setDriverCol] = useState<string>(defaultDriver);
  const [targetCol, setTargetCol] = useState<string>(defaultTarget);
  const [driverAdjustmentPct, setDriverAdjustmentPct] = useState<number>(15); // Default +15% simulation

  // Linear Regression & Correlation calculation
  const regressionStats = useMemo(() => {
    if (!driverCol || !targetCol || driverCol === targetCol || filteredRows.length < 5) {
      return null;
    }

    const validPairs: [number, number][] = [];
    for (const r of filteredRows) {
      const x = normalizeRowValue(r[driverCol], 'number');
      const y = normalizeRowValue(r[targetCol], 'number');
      if (x !== null && y !== null) {
        validPairs.push([x, y]);
      }
    }

    if (validPairs.length < 5) return null;

    const n = validPairs.length;
    const xVals = validPairs.map((p) => p[0]);
    const yVals = validPairs.map((p) => p[1]);

    const meanX = xVals.reduce((a, b) => a + b, 0) / n;
    const meanY = yVals.reduce((a, b) => a + b, 0) / n;

    // Variance of X and Covariance(X, Y)
    let ssXX = 0;
    let ssXY = 0;
    let ssYY = 0;

    for (let i = 0; i < n; i++) {
      const dx = xVals[i] - meanX;
      const dy = yVals[i] - meanY;
      ssXX += dx * dx;
      ssXY += dx * dy;
      ssYY += dy * dy;
    }

    if (ssXX === 0) return null;

    // Slope (beta) and Intercept (alpha)
    const beta = ssXY / ssXX;
    const alpha = meanY - beta * meanX;

    // Pearson r and R-squared
    const pearsonR = calculatePearsonCorrelation(xVals, yVals);
    const rSquared = Number((pearsonR * pearsonR).toFixed(3));

    // Current totals / averages
    const currentTotalY = yVals.reduce((a, b) => a + b, 0);
    const currentTotalX = xVals.reduce((a, b) => a + b, 0);

    // Projected Change
    const adjustedMeanX = meanX * (1 + driverAdjustmentPct / 100);
    const projectedMeanY = Math.max(0, alpha + beta * adjustedMeanX);
    const expectedDeltaPct = meanY > 0 ? ((projectedMeanY - meanY) / meanY) * 100 : 0;
    const projectedTotalY = Math.max(0, currentTotalY * (1 + expectedDeltaPct / 100));
    const netDollarDelta = projectedTotalY - currentTotalY;

    // Elasticity: % change in Y for 1% change in X
    const elasticity = meanY > 0 ? (beta * meanX) / meanY : 0;

    return {
      n,
      meanX,
      meanY,
      beta,
      alpha,
      pearsonR,
      rSquared,
      currentTotalY,
      projectedTotalY,
      netDollarDelta,
      expectedDeltaPct,
      elasticity,
    };
  }, [filteredRows, driverCol, targetCol, driverAdjustmentPct]);

  if (numCols.length < 2) {
    return null;
  }

  return (
    <div className={`w-full rounded-2xl ${theme.classes.bgPanel} border ${theme.classes.border} p-5 sm:p-6 shadow-xl backdrop-blur-md relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1px] shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Calculator className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Predictive Scenario & What-If Simulator
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Linear Model
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Simulate operational adjustments and forecast expected business lift
            </p>
          </div>
        </div>

        {/* Column Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <span className="text-[11px] text-slate-400 pl-2">Driver (X):</span>
            <select
              value={driverCol}
              onChange={(e) => setDriverCol(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              {numCols.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <span className="text-[11px] text-slate-400 pl-2">Target (Y):</span>
            <select
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              {numCols.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Simulator Content */}
      {regressionStats ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Interactive Slider & Driver Adjustment */}
          <div className="lg:col-span-6 space-y-5">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Simulate Adjustment in <strong className="text-white">{driverCol}</strong>
                </span>
                <span
                  className={`text-sm font-bold font-mono px-2.5 py-0.5 rounded-lg border ${
                    driverAdjustmentPct > 0
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : driverAdjustmentPct < 0
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {driverAdjustmentPct > 0 ? `+${driverAdjustmentPct}%` : `${driverAdjustmentPct}%`}
                </span>
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={1}
                  value={driverAdjustmentPct}
                  onChange={(e) => setDriverAdjustmentPct(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>-50% Cut</span>
                  <span>Baseline (0%)</span>
                  <span>+50% Lift</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 pt-1">
                {[-20, -10, 0, 15, 25].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDriverAdjustmentPct(preset)}
                    className={`px-2 py-1 text-[11px] rounded-md border font-mono transition-colors ${
                      driverAdjustmentPct === preset
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset > 0 ? `+${preset}%` : `${preset}%`}
                  </button>
                ))}
                <button
                  onClick={() => setDriverAdjustmentPct(0)}
                  title="Reset to Baseline"
                  className="p-1 rounded-md text-slate-400 hover:text-white ml-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Regression Model Fidelity Indicators */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Correlation (r)</div>
                <div className="text-sm font-bold font-mono text-cyan-300 mt-1">
                  {regressionStats.pearsonR > 0 ? '+' : ''}
                  {regressionStats.pearsonR.toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Model Fit (R²)</div>
                <div className="text-sm font-bold font-mono text-indigo-300 mt-1">
                  {(regressionStats.rSquared * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Elasticity</div>
                <div className="text-sm font-bold font-mono text-emerald-300 mt-1">
                  {regressionStats.elasticity.toFixed(2)}×
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Projected Impact Outcome Cards */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Forecasted Outcome ({targetCol})
                </span>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                    regressionStats.netDollarDelta >= 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {regressionStats.netDollarDelta >= 0 ? '+' : ''}
                  {regressionStats.expectedDeltaPct.toFixed(1)}% Lift
                </span>
              </div>

              {/* Main Net Projected Value */}
              <div className="flex items-baseline gap-3 my-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {formatMetricDisplay(regressionStats.projectedTotalY, targetCol)}
                </span>
                <span className="text-xs text-slate-400 line-through font-mono">
                  {formatMetricDisplay(regressionStats.currentTotalY, targetCol)}
                </span>
              </div>

              {/* Projected Net Delta */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Projected Net Impact:</span>
                <span
                  className={`font-mono font-bold ${
                    regressionStats.netDollarDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {regressionStats.netDollarDelta >= 0 ? '+' : ''}
                  {formatMetricDisplay(regressionStats.netDollarDelta, targetCol)}
                </span>
              </div>
            </div>

            {/* Strategic Scenario Takeaway */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Senior Strategy Interpretation:</strong>{' '}
                {regressionStats.elasticity > 0.6 ? (
                  <span>
                    High sensitivity detected. For every 10% change in <strong>{driverCol}</strong>,{' '}
                    <strong>{targetCol}</strong> moves by ~{(regressionStats.elasticity * 10).toFixed(1)}%. This driver is a prime lever for operational growth.
                  </span>
                ) : (
                  <span>
                    Moderate elasticity. <strong>{targetCol}</strong> is influenced by multiple cross-dimensional factors in addition to {driverCol}.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-400">
          Please select two distinct numerical columns to generate regression projections.
        </div>
      )}
    </div>
  );
};
