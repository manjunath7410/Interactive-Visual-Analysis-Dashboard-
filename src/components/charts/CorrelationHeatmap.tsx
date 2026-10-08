import React, { useState, useMemo } from 'react';
import { Grid, Info } from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { calculatePearsonCorrelation, normalizeRowValue } from '../../utils/dataEngine';
import { useTheme } from '../../context/ThemeContext';

interface CorrelationHeatmapProps {
  filteredRows: Record<string, any>[];
  analytics: DatasetAnalytics;
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  filteredRows,
  analytics,
}) => {
  const { theme } = useTheme();
  const numCols = useMemo(() => analytics.numericColumnNames.slice(0, 6), [analytics.numericColumnNames]);
  const [hoveredCell, setHoveredCell] = useState<{
    colA: string;
    colB: string;
    r: number;
    x: number;
    y: number;
  } | null>(null);

  // Calculate matrix values with pairwise complete row observations and memoization
  const matrix = useMemo(() => {
    if (numCols.length < 2 || filteredRows.length === 0) return [];

    const computedMatrix: { colA: string; colB: string; r: number }[][] = [];

    for (let i = 0; i < numCols.length; i++) {
      const row: { colA: string; colB: string; r: number }[] = [];
      const colA = numCols[i];

      for (let j = 0; j < numCols.length; j++) {
        const colB = numCols[j];
        if (i === j) {
          row.push({ colA, colB, r: 1.0 });
        } else {
          // Pairwise row-by-row synchronization: only include rows where both values are valid numbers
          const pairedA: number[] = [];
          const pairedB: number[] = [];
          for (let k = 0; k < filteredRows.length; k++) {
            const r = filteredRows[k];
            const a = normalizeRowValue(r[colA], 'number');
            const b = normalizeRowValue(r[colB], 'number');
            if (a !== null && b !== null && !isNaN(a) && !isNaN(b)) {
              pairedA.push(a);
              pairedB.push(b);
            }
          }

          const r = pairedA.length >= 3 ? calculatePearsonCorrelation(pairedA, pairedB) : 0;
          row.push({ colA, colB, r });
        }
      }
      computedMatrix.push(row);
    }
    return computedMatrix;
  }, [filteredRows, numCols]);

  if (numCols.length < 2) {
    return null;
  }

  // Get color for r value (-1.0 to 1.0)
  const getCellColor = (r: number) => {
    if (r === 1.0) return 'rgba(99, 102, 241, 0.9)'; // self
    if (r > 0) {
      // positive: Cyan to Indigo
      const opacity = Math.min(0.85, Math.max(0.15, Math.abs(r)));
      return `rgba(56, 189, 248, ${opacity})`;
    } else {
      // negative: Rose/Coral
      const opacity = Math.min(0.85, Math.max(0.15, Math.abs(r)));
      return `rgba(244, 63, 94, ${opacity})`;
    }
  };

  return (
    <div data-layer="base" className={`w-full h-full flex flex-col justify-between ${theme.classes.bgPanel} border ${theme.classes.border} rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-md`}>
      <div data-layer="fg" className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            Multivariate Correlation Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Pairwise Pearson coefficient (r) mapping co-variance between numeric indicators
          </p>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/80" /> -1.0 Inverse
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-700" /> 0.0 Neutral
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-cyan-400/80" /> +1.0 Positive
          </span>
        </div>
      </div>

      <div data-layer="viz" className="relative overflow-x-auto pb-2">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-semibold text-slate-400 w-28">
                Features
              </th>
              {numCols.map((c) => (
                <th
                  key={c}
                  className="p-2 text-xs font-semibold text-slate-300 truncate max-w-[100px]"
                  title={c}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rIdx) => {
              const rowCol = numCols[rIdx];
              return (
                <tr key={rowCol}>
                  <td className="p-2 text-left text-xs font-medium text-slate-300 truncate max-w-[120px]">
                    {rowCol}
                  </td>
                  {row.map((cell, cIdx) => {
                    const isSelf = rIdx === cIdx;
                    return (
                      <td
                        key={cell.colB}
                        className="p-1 cursor-pointer transition-transform hover:scale-105"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            colA: cell.colA,
                            colB: cell.colB,
                            r: cell.r,
                            x: rect.x + rect.width / 2,
                            y: rect.y,
                          });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          className="h-10 rounded-lg flex items-center justify-center font-mono text-xs font-semibold text-white transition-all"
                          style={{ backgroundColor: getCellColor(cell.r) }}
                        >
                          {isSelf ? '1.00' : (cell.r > 0 ? `+${cell.r.toFixed(2)}` : cell.r.toFixed(2))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Hover Cell Overlay Info */}
        {hoveredCell && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-indigo-500/30 text-xs flex items-center justify-between">
            <div className="text-slate-300">
              <span className="font-semibold text-white">{hoveredCell.colA}</span> ↔{' '}
              <span className="font-semibold text-white">{hoveredCell.colB}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Pearson r:</span>
              <span className="text-cyan-300 font-mono font-bold">
                {hoveredCell.r > 0 ? '+' : ''}
                {hoveredCell.r.toFixed(3)}
              </span>
              <span className="text-slate-400">
                ({Math.abs(hoveredCell.r) > 0.7 ? 'Strong' : Math.abs(hoveredCell.r) > 0.4 ? 'Moderate' : 'Weak'})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
