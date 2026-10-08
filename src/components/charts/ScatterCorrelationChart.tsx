import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ScatterChart as ScatterIcon, SlidersHorizontal, Info, Sparkles, TrendingUp } from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { formatNumberShort, calculatePearsonCorrelation, normalizeRowValue, formatMetricDisplay } from '../../utils/dataEngine';
import { useTheme } from '../../context/ThemeContext';

interface ScatterCorrelationChartProps {
  filteredRows: Record<string, any>[];
  analytics: DatasetAnalytics;
}

export const ScatterCorrelationChart: React.FC<ScatterCorrelationChartProps> = ({
  filteredRows,
  analytics,
}) => {
  const { theme } = useTheme();
  const numCols = analytics.numericColumnNames;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [colX, setColX] = useState<string>(numCols[0] || '');
  const [colY, setColY] = useState<string>(numCols[1] || numCols[0] || '');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; raw: any; px: number; py: number } | null>(null);

  // Extract all points without artificial cap using Canvas
  const stats = useMemo(() => {
    if (!colX || !colY || filteredRows.length === 0) {
      return null;
    }

    const rawPoints: { x: number; y: number; raw: any }[] = [];
    const xVals: number[] = [];
    const yVals: number[] = [];

    for (let i = 0; i < filteredRows.length; i++) {
      const r = filteredRows[i];
      const x = normalizeRowValue(r[colX], 'number');
      const y = normalizeRowValue(r[colY], 'number');
      if (x !== null && y !== null && !isNaN(x) && !isNaN(y)) {
        rawPoints.push({ x, y, raw: r });
        xVals.push(x);
        yVals.push(y);
      }
    }

    if (xVals.length === 0) return null;

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);

    const sumX = xVals.reduce((a, b) => a + b, 0);
    const sumY = yVals.reduce((a, b) => a + b, 0);
    const meanX = sumX / xVals.length;
    const meanY = sumY / yVals.length;

    // Linear regression: y = beta * x + alpha
    let ssXX = 0;
    let ssXY = 0;
    for (let i = 0; i < xVals.length; i++) {
      ssXX += Math.pow(xVals[i] - meanX, 2);
      ssXY += (xVals[i] - meanX) * (yVals[i] - meanY);
    }
    const beta = ssXX !== 0 ? ssXY / ssXX : 0;
    const alpha = meanY - beta * meanX;

    const correlation = calculatePearsonCorrelation(xVals, yVals);
    const rSquared = Math.pow(correlation, 2);

    return {
      points: rawPoints,
      minX: minX === maxX ? minX - 1 : minX,
      maxX: minX === maxX ? maxX + 1 : maxX,
      minY: minY === maxY ? minY - 1 : minY,
      maxY: minY === maxY ? maxY + 1 : maxY,
      meanX,
      meanY,
      beta,
      alpha,
      correlation,
      rSquared,
    };
  }, [filteredRows, colX, colY]);

  // High-performance HTML5 Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stats) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 30, bottom: 40, left: 55 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const x = padding.left + (plotW / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }

    // Coordinate mapping functions
    const toCanvasX = (val: number) =>
      padding.left + ((val - stats.minX) / (stats.maxX - stats.minX)) * plotW;
    const toCanvasY = (val: number) =>
      height - padding.bottom - ((val - stats.minY) / (stats.maxY - stats.minY)) * plotH;

    // Draw Regression Trendline
    const regX1 = stats.minX;
    const regY1 = stats.alpha + stats.beta * regX1;
    const regX2 = stats.maxX;
    const regY2 = stats.alpha + stats.beta * regX2;

    ctx.strokeStyle = stats.correlation >= 0 ? '#38bdf8' : '#f43f5e';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(regX1), toCanvasY(regY1));
    ctx.lineTo(toCanvasX(regX2), toCanvasY(regY2));
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Data Points
    const primaryColor = theme.chartPalette[0] || '#38bdf8';
    ctx.fillStyle = primaryColor + '99'; // 60% opacity

    for (const p of stats.points) {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);

      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlight hovered point
    if (hoveredPoint) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(hoveredPoint.px, hoveredPoint.py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Crosshair lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      ctx.beginPath();
      ctx.moveTo(padding.left, hoveredPoint.py);
      ctx.lineTo(width - padding.right, hoveredPoint.py);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(hoveredPoint.px, padding.top);
      ctx.lineTo(hoveredPoint.px, height - padding.bottom);
      ctx.stroke();

      ctx.setLineDash([]);
    }
  }, [stats, theme, hoveredPoint]);

  // Handle Canvas Mouse Move for Tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !stats) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const padding = { top: 20, right: 30, bottom: 40, left: 55 };
    const plotW = canvas.width - padding.left - padding.right;
    const plotH = canvas.height - padding.top - padding.bottom;

    const toCanvasX = (val: number) =>
      padding.left + ((val - stats.minX) / (stats.maxX - stats.minX)) * plotW;
    const toCanvasY = (val: number) =>
      canvas.height - padding.bottom - ((val - stats.minY) / (stats.maxY - stats.minY)) * plotH;

    // Find nearest point within radius
    let nearest: any = null;
    let minDist = 18; // px threshold

    for (const p of stats.points) {
      const px = toCanvasX(p.x);
      const py = toCanvasY(p.y);
      const dist = Math.hypot(mouseX - px, mouseY - py);
      if (dist < minDist) {
        minDist = dist;
        nearest = { ...p, px, py };
      }
    }

    setHoveredPoint(nearest);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  if (numCols.length < 2) {
    return (
      <div className="w-full h-80 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col items-center justify-center text-slate-400">
        <ScatterIcon className="w-8 h-8 text-slate-600 mb-2" />
        <span className="text-sm">At least two numerical columns required for scatter correlation</span>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-2xl ${theme.classes.bgPanel} border ${theme.classes.border} p-5 sm:p-6 shadow-lg backdrop-blur-md relative flex flex-col justify-between`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Bivariate Correlation & Scatter Engine
            </h3>
            {stats && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                  Math.abs(stats.correlation) > 0.6
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                }`}
              >
                r = {stats.correlation.toFixed(2)} (R² = {(stats.rSquared * 100).toFixed(0)}%)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Canvas-accelerated scatter plot rendering {stats?.points.length.toLocaleString()} observations
          </p>
        </div>

        {/* Axis Column Selectors */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <span className="text-[10px] text-slate-500 font-mono pl-1.5">X:</span>
            <select
              value={colX}
              onChange={(e) => setColX(e.target.value)}
              className="bg-slate-900 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700/80 focus:outline-none focus:border-cyan-500"
            >
              {numCols.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <span className="text-[10px] text-slate-500 font-mono pl-1.5">Y:</span>
            <select
              value={colY}
              onChange={(e) => setColY(e.target.value)}
              className="bg-slate-900 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700/80 focus:outline-none focus:border-cyan-500"
            >
              {numCols.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full h-64 sm:h-72 bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={640}
          height={300}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair"
        />

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-30 pointer-events-none p-2 rounded-lg bg-slate-900/95 border border-slate-700 text-xs shadow-xl backdrop-blur-md font-mono"
            style={{
              left: `${Math.min(75, Math.max(5, (hoveredPoint.px / 640) * 100))}%`,
              top: `${Math.min(75, Math.max(5, (hoveredPoint.py / 300) * 100 - 15))}%`,
            }}
          >
            <div className="text-slate-300 font-bold">{colX}: {formatMetricDisplay(hoveredPoint.x, colX)}</div>
            <div className="text-cyan-300 font-bold">{colY}: {formatMetricDisplay(hoveredPoint.y, colY)}</div>
          </div>
        )}
      </div>

      {/* Footer Axis Labels */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2">
        <span>X-Min: {stats ? formatNumberShort(stats.minX) : 0}</span>
        <span className="text-slate-500">Trendline Slope β = {stats ? stats.beta.toFixed(3) : 0}</span>
        <span>X-Max: {stats ? formatNumberShort(stats.maxX) : 0}</span>
      </div>
    </div>
  );
};
