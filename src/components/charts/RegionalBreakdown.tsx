import React, { useMemo } from 'react';
import { Globe, MapPin, TrendingUp } from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { formatNumberShort, formatMetricDisplay } from '../../utils/dataEngine';
import { useTheme } from '../../context/ThemeContext';

interface RegionalBreakdownProps {
  filteredRows: Record<string, any>[];
  analytics: DatasetAnalytics;
}

export const RegionalBreakdown: React.FC<RegionalBreakdownProps> = ({
  filteredRows,
  analytics,
}) => {
  const { theme } = useTheme();
  // Look for location or region column
  const locationKeywords = ['region', 'country', 'market', 'location', 'city', 'state', 'territory', 'geo'];
  const locCol = analytics.categoricalColumnNames.find((c) =>
    locationKeywords.some((kw) => c.toLowerCase().includes(kw))
  );

  const primaryNum = analytics.primaryNumericColumn;

  const regionalData = useMemo(() => {
    if (!locCol || filteredRows.length === 0) return [];

    const map: Record<string, { sum: number; count: number }> = {};
    for (const r of filteredRows) {
      const loc = String(r[locCol] || 'Other').trim();
      const val = primaryNum ? Number(r[primaryNum]) || 0 : 1;

      if (!map[loc]) {
        map[loc] = { sum: 0, count: 0 };
      }
      map[loc].sum += val;
      map[loc].count += 1;
    }

    const items = Object.entries(map).map(([region, stats]) => ({
      region,
      totalVal: stats.sum,
      records: stats.count,
      avgVal: stats.count > 0 ? stats.sum / stats.count : 0,
    }));

    items.sort((a, b) => b.totalVal - a.totalVal);
    return items;
  }, [filteredRows, locCol, primaryNum]);

  if (!locCol || regionalData.length === 0) {
    return null;
  }

  const maxVal = Math.max(...regionalData.map((d) => d.totalVal), 1);
  const totalValAll = regionalData.reduce((acc, curr) => acc + curr.totalVal, 0) || 1;

  return (
    <div data-layer="base" className={`w-full h-full flex flex-col justify-between ${theme.classes.bgPanel} border ${theme.classes.border} rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-md`}>
      <div data-layer="fg" className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Geographic & Regional Performance
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Territory benchmarking across {locCol}
          </p>
        </div>

        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
          {regionalData.length} Territories
        </span>
      </div>

      <div data-layer="viz" className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {regionalData.map((item, idx) => {
          const share = ((item.totalVal / totalValAll) * 100).toFixed(1);
          const widthPct = Math.max(5, Math.round((item.totalVal / maxVal) * 100));

          return (
            <div
              key={item.region}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-medium text-slate-200 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{item.region}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white font-mono tabular-nums">
                    {primaryNum ? formatMetricDisplay(item.totalVal, primaryNum) : `${item.records} records`}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {share}% of total
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${widthPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-1 border-t border-slate-900">
                <span>{item.records.toLocaleString()} records</span>
                {primaryNum && (
                  <span>
                    Avg: <span className="text-slate-300 font-mono">{formatMetricDisplay(item.avgVal, primaryNum)}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
