import React, { useEffect, useState } from 'react';
import {
  Settings,
  X,
  ShieldCheck,
  Cpu,
  Database,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  Palette,
  Check,
} from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { useTheme } from '../../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetName: string;
  analytics: DatasetAnalytics;
  onResetWorkspace: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  datasetName,
  analytics,
  onResetWorkspace,
}) => {
  const { themeId, setThemeId, availableThemes } = useTheme();
  const [aiStatus, setAiStatus] = useState<{ available: boolean; model: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/gemini/health')
      .then((res) => res.json())
      .then((data) => setAiStatus(data))
      .catch(() => setAiStatus({ available: false, model: 'Local Engine Heuristics' }));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportAnalyticsJson = () => {
    const jsonStr = JSON.stringify(analytics, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${datasetName.replace(/\.[^/.]+$/, '')}_analytics_profile.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Settings className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">System Settings & Profile</h3>
              <p className="text-xs text-slate-400">InsightFlow configuration & storage status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI & Engine Configuration */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Intelligence Engine:
            </span>
            <span className="font-mono text-cyan-300 font-medium">
              {aiStatus?.model || 'gemini-3.8-flash'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Processing Mode:
            </span>
            <span className="text-slate-300">Client-Side Accelerated Vector Engine</span>
          </div>
        </div>

        {/* Color Palette & Theme Picker */}
        <div className="space-y-2 text-xs">
          <div className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Color Theme</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {availableThemes.map((t) => {
              const isSelected = t.id === themeId;
              return (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-500/80 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="flex items-center -space-x-1">
                        {t.swatches.map((c, i) => (
                          <span
                            key={i}
                            className="w-2.5 h-2.5 rounded-full border border-slate-950"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-xs text-white">{t.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">{t.description}</span>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Dataset Profile */}
        <div className="space-y-2 text-xs">
          <div className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
            Active Dataset Architecture
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-400">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Dataset</span>
              <span className="text-slate-200 font-medium truncate block">{datasetName}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Est. Memory</span>
              <span className="text-slate-200 font-mono font-medium">{analytics.memorySizeEstimateKb} KB</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleExportAnalyticsJson}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Analytics Statistical Profile (JSON)</span>
          </button>

          <button
            onClick={() => {
              onResetWorkspace();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-rose-500/30"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Clear Dataset & Reset Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
