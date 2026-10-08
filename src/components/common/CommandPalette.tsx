import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Layers,
  BarChart3,
  Box,
  Table,
  Sparkles,
  Download,
  AlertTriangle,
  RotateCcw,
  Palette,
  Upload,
  ArrowRight,
  Database,
  Hash,
  CornerDownLeft,
  Volume2,
  VolumeX,
  Calculator,
} from 'lucide-react';
import { NavTab } from '../layout/TopNavigation';
import { DatasetAnalytics } from '../../types/dataset';
import { soundFx } from '../../utils/audioFx';
import { useTheme } from '../../context/ThemeContext';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Columns' | 'Settings';
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  analytics: DatasetAnalytics | null;
  onOpenExport: () => void;
  onResetFilters: () => void;
  onToggleOutliers: () => void;
  isOutliersActive: boolean;
  onUploadNew: () => void;
  onOpenCalculatedMetric?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  currentTab,
  onTabChange,
  analytics,
  onOpenExport,
  onResetFilters,
  onToggleOutliers,
  isOutliersActive,
  onUploadNew,
  onOpenCalculatedMetric,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { themeId, theme, setThemeId, availableThemes } = useTheme();
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command list
  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Navigation
      {
        id: 'nav-overview',
        category: 'Navigation',
        title: 'Switch to Overview',
        subtitle: 'KPI scorecard, revenue trends, and category distribution',
        icon: Layers,
        shortcut: '1',
        action: () => {
          onTabChange('overview');
          onClose();
        },
      },
      {
        id: 'nav-analytics',
        category: 'Navigation',
        title: 'Switch to Analytics',
        subtitle: 'What-If regression simulator, correlation matrix, scatter plots',
        icon: BarChart3,
        shortcut: '2',
        action: () => {
          onTabChange('analytics');
          onClose();
        },
      },
      {
        id: 'nav-spatial3d',
        category: 'Navigation',
        title: 'Switch to 3D Spatial Universe',
        subtitle: 'Interactive Three.js particle constellation and data clusters',
        icon: Box,
        shortcut: '3',
        action: () => {
          onTabChange('spatial3d');
          onClose();
        },
      },
      {
        id: 'nav-explorer',
        category: 'Navigation',
        title: 'Switch to Data Explorer',
        subtitle: 'Inspect tabular records, data health audit, and sort columns',
        icon: Table,
        shortcut: '4',
        action: () => {
          onTabChange('explorer');
          onClose();
        },
      },
      {
        id: 'nav-ai',
        category: 'Navigation',
        title: 'Switch to AI Insights & Assistant',
        subtitle: 'Executive intelligence briefing and conversational chat',
        icon: Sparkles,
        shortcut: '5',
        action: () => {
          onTabChange('ai');
          onClose();
        },
      },

      // Actions
      {
        id: 'act-export',
        category: 'Actions',
        title: 'Export & Report Hub',
        subtitle: 'Generate PDF report, filtered CSV, or JSON data package',
        icon: Download,
        shortcut: '⌘E',
        action: () => {
          onOpenExport();
          onClose();
        },
      },
      {
        id: 'act-calculated-metric',
        category: 'Actions',
        title: 'Create Calculated Metric / Column',
        subtitle: 'Build custom formula column e.g. [Revenue] - [Cost]',
        icon: Calculator,
        shortcut: '⌘M',
        action: () => {
          onOpenCalculatedMetric?.();
          onClose();
        },
      },
      {
        id: 'act-outliers',
        category: 'Actions',
        title: isOutliersActive ? 'Show All Records (Clear Outlier Isolation)' : 'Isolate Anomalous Outliers',
        subtitle: 'Filter active view by values beyond 1.5× Interquartile Range',
        icon: AlertTriangle,
        shortcut: '⌘O',
        action: () => {
          onToggleOutliers();
          onClose();
        },
      },
      {
        id: 'act-reset-filters',
        category: 'Actions',
        title: 'Reset All Active Filters',
        subtitle: 'Clear all categorical, numeric, and date filter constraints',
        icon: RotateCcw,
        shortcut: '⌘R',
        action: () => {
          onResetFilters();
          onClose();
        },
      },
      {
        id: 'act-toggle-theme',
        category: 'Settings',
        title: 'Cycle Aesthetic Theme',
        subtitle: `Currently using: ${theme.name}`,
        icon: Palette,
        shortcut: '⌘T',
        action: () => {
          const currentIdx = availableThemes.findIndex((t) => t.id === themeId);
          const nextTheme = availableThemes[(currentIdx + 1) % availableThemes.length];
          setThemeId(nextTheme.id);
          soundFx.playPop();
        },
      },
      {
        id: 'act-toggle-sound',
        category: 'Settings',
        title: isMuted ? 'Enable Tactile Audio FX' : 'Mute Tactile Audio FX',
        subtitle: 'Subtle mechanical clicks for keyboard and tab actions',
        icon: isMuted ? VolumeX : Volume2,
        action: () => {
          const next = soundFx.toggleMute();
          setIsMuted(next);
        },
      },
      {
        id: 'act-upload-new',
        category: 'Actions',
        title: 'Upload Different Dataset',
        subtitle: 'Ingest another CSV or Excel workbook',
        icon: Upload,
        action: () => {
          onUploadNew();
          onClose();
        },
      },
    ];

    // If analytics exist, add column inspectors
    if (analytics) {
      Object.values(analytics.columnProfiles).forEach((prof) => {
        list.push({
          id: `col-${prof.name}`,
          category: 'Columns',
          title: `Inspect Column: ${prof.name}`,
          subtitle: `${prof.type} · ${prof.uniqueCount.toLocaleString()} unique values · ${prof.missingPercentage}% missing`,
          icon: Hash,
          action: () => {
            onTabChange('explorer');
            onClose();
          },
        });
      });
    }

    return list;
  }, [onTabChange, onOpenExport, onOpenCalculatedMetric, onResetFilters, onToggleOutliers, isOutliersActive, setThemeId, themeId, availableThemes, theme, isMuted, onUploadNew, analytics, onClose]);

  // Filtered by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Keep selected index in bound
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      soundFx.playTick();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev - 1 < 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
      );
      soundFx.playTick();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        soundFx.playPop();
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-slate-950/80 backdrop-blur-md">
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-950/70">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, switch tab, or search columns..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 border border-slate-700 text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Command Items List */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const isSelected = selectedIndex === idx;
              const Icon = cmd.icon;

              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    soundFx.playPop();
                    cmd.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-600/20 text-white border border-indigo-500/30'
                      : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate pr-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="truncate">
                      <div className="text-xs font-semibold truncate flex items-center gap-2">
                        <span>{cmd.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {cmd.category}
                        </span>
                      </div>
                      {cmd.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {cmd.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands or columns found for "{query}"
            </div>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <span><strong className="text-slate-200">↑↓</strong> Navigate</span>
            <span><strong className="text-slate-200">↵</strong> Select</span>
            <span><strong className="text-slate-200">1-5</strong> Quick Tabs</span>
          </div>
          <span className="text-slate-500 text-[10px]">InsightFlow Command Center</span>
        </div>
      </motion.div>
    </div>
  );
};
