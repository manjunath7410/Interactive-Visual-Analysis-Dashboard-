import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  Layers,
  Table,
  Sparkles,
  Box,
  FileSpreadsheet,
  Upload,
  RotateCcw,
  SlidersHorizontal,
  Settings,
  Download,
  Search,
} from 'lucide-react';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { DataOrbitLogo } from '../brand/DataOrbitLogo';
import { BrandStudioModal } from '../brand/BrandStudioModal';
import { useTheme } from '../../context/ThemeContext';
import { soundFx } from '../../utils/audioFx';

export type NavTab = 'overview' | 'analytics' | 'spatial3d' | 'explorer' | 'ai';

interface TopNavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  datasetName: string;
  totalRows: number;
  filteredRowsCount: number;
  activeFilterCount: number;
  onResetFilters: () => void;
  onUploadNew: () => void;
  onExportCsv: () => void;
  onOpenExportHub?: () => void;
  onOpenSettings: () => void;
  onOpenCommandPalette?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentTab,
  onTabChange,
  datasetName,
  totalRows,
  filteredRowsCount,
  activeFilterCount,
  onResetFilters,
  onUploadNew,
  onExportCsv,
  onOpenExportHub,
  onOpenSettings,
  onOpenCommandPalette,
}) => {
  const { theme } = useTheme();
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const isFiltered = filteredRowsCount < totalRows;

  const handleTabClick = (tab: NavTab) => {
    soundFx.playTick();
    onTabChange(tab);
  };

  return (
    <header className={`sticky top-0 z-40 w-full ${theme.classes.bgCanvas}/90 backdrop-blur-xl border-b ${theme.classes.border} px-4 sm:px-6 py-3 transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => setIsBrandModalOpen(true)}
          className="flex items-center gap-3 cursor-pointer group select-none"
          title="Click to open Data Orbit Logo & Brand Studio"
        >
          <DataOrbitLogo
            size={34}
            variant="app-icon"
            animated={true}
            idSuffix="top-nav-logo"
          />
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              InsightFlow
            </span>
            <span className="hidden xl:inline-flex items-center text-xs text-slate-400 font-medium">
              <span aria-hidden="true" className="text-slate-600 mr-2">·</span>
              Enterprise Intelligence
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Segmented Control */}
        <nav className={`hidden md:flex items-center gap-1 p-1 ${theme.classes.bgPanel} rounded-xl border ${theme.classes.border} shrink-0`}>
          {[
            { id: 'overview' as NavTab, label: 'Overview', icon: Layers },
            { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
            { id: 'spatial3d' as NavTab, label: '3D Spatial', icon: Box, iconColor: 'text-indigo-400' },
            { id: 'explorer' as NavTab, label: 'Data Explorer', icon: Table },
            { id: 'ai' as NavTab, label: 'AI Insights', icon: Sparkles, iconColor: 'text-cyan-300' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`relative h-7 inline-flex items-center gap-1.5 px-3 text-xs font-medium rounded-lg transition-colors shrink-0 whitespace-nowrap ${
                currentTab === item.id
                  ? 'text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {currentTab === item.id && (
                <motion.div
                  layoutId="active-tab-nav-indicator"
                  className={`absolute inset-0 rounded-lg ${theme.classes.accentPrimary} shadow-sm z-0`}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <item.icon className={`w-3.5 h-3.5 shrink-0 ${item.iconColor || ''}`} />
                <span>{item.label}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* Zone 3: Actions & Dataset Status */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Command Palette Button (Cmd+K) */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden lg:flex items-center gap-2 h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors shrink-0"
            title="Open Command Palette (⌘K / Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-300">Commands</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-950 text-slate-400 rounded border border-slate-800">
              ⌘K
            </kbd>
          </button>
          {/* Active Filter Indicator & Reset with Framer Motion Rolling Counter */}
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85, x: 6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: 6 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                onClick={onResetFilters}
                title="Reset all active filters"
                className="h-8 inline-flex items-center gap-1.5 px-2.5 text-xs font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors shrink-0 whitespace-nowrap shadow-sm group"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0 group-hover:-rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline">Reset</span>
                <motion.span
                  key={`pill-${activeFilterCount}`}
                  initial={{ scale: 1.25 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 22 }}
                  className="relative inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500/25 border border-amber-400/40 text-[11px] font-mono font-bold text-amber-200 overflow-hidden"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={activeFilterCount}
                      initial={{ y: -14, opacity: 0, scale: 0.6 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 14, opacity: 0, scale: 0.6 }}
                      transition={{
                        type: 'spring',
                        stiffness: 550,
                        damping: 26,
                      }}
                      className="inline-block tabular-nums"
                    >
                      {activeFilterCount}
                    </motion.span>
                  </AnimatePresence>
                </motion.span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Dataset Status Badge */}
          <div className="hidden xl:flex h-8 items-center gap-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs shrink-0">
            <FileSpreadsheet className={`w-3.5 h-3.5 ${theme.classes.accentText} shrink-0`} />
            <span className="font-medium text-slate-200 max-w-[130px] truncate" title={datasetName}>
              {datasetName}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-mono tabular-nums">
              {isFiltered ? `${filteredRowsCount.toLocaleString()} / ` : ''}
              {totalRows.toLocaleString()}
            </span>
          </div>

          {/* Export & Report Hub Action */}
          <button
            onClick={onOpenExportHub || onExportCsv}
            title="Export data or print executive report"
            className="hidden sm:inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition-colors shrink-0 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export & Report</span>
          </button>

          {/* Theme Switcher Button */}
          <ThemeSwitcher />

          {/* Change Dataset Button */}
          <button
            onClick={onUploadNew}
            className={`h-8 inline-flex items-center gap-1.5 px-3 text-xs font-medium ${theme.classes.accentPrimary} ${theme.classes.accentHover} text-white rounded-lg transition-colors shadow-sm shrink-0 whitespace-nowrap`}
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Upload New</span>
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={onOpenSettings}
            title="App Settings & AI Configuration"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logo Studio Toggle */}
          <button
            onClick={() => setIsBrandModalOpen(true)}
            title="Data Orbit Logo & Brand Studio"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors shrink-0"
          >
            <DataOrbitLogo size={16} variant="symbol" idSuffix="top-nav-btn" />
          </button>
        </div>
      </div>

      {/* Brand & Logo Studio Modal */}
      <BrandStudioModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
      />
    </header>
  );
};
