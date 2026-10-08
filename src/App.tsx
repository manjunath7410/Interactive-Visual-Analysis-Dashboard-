import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import {
  LandingHero,
} from './components/landing/LandingHero';
import { TopNavigation, NavTab } from './components/layout/TopNavigation';
import { ProcessingOverlay } from './components/loading/ProcessingOverlay';
import { FilterBar } from './components/filters/FilterBar';
import { KpiSection } from './components/kpis/KpiSection';
import { LineTrendChart } from './components/charts/LineTrendChart';
import { CategoryBarChart } from './components/charts/CategoryBarChart';
import { DonutDistributionChart } from './components/charts/DonutDistributionChart';
import { ScatterCorrelationChart } from './components/charts/ScatterCorrelationChart';
import { CorrelationHeatmap } from './components/charts/CorrelationHeatmap';
import { RegionalBreakdown } from './components/charts/RegionalBreakdown';
import { DataExplorer } from './components/explorer/DataExplorer';
import { AiInsightsSection } from './components/ai/AiInsightsSection';
import { AiDataAssistant } from './components/ai/AiDataAssistant';
import { Spatial3DUniverse } from './components/spatial3d/Spatial3DUniverse';
import { Ambient3DBackground } from './components/spatial3d/Ambient3DBackground';
import { Card3DTilt } from './components/ui/Card3DTilt';
import { SettingsModal } from './components/modals/SettingsModal';
import { ExportReportModal } from './components/modals/ExportReportModal';
import { PredictiveSimulator } from './components/analytics/PredictiveSimulator';
import { DataHealthCenter } from './components/explorer/DataHealthCenter';
import { ExecutiveBriefingCard } from './components/overview/ExecutiveBriefingCard';
import { CalculatedColumnModal } from './components/modals/CalculatedColumnModal';
import { CommandPalette } from './components/common/CommandPalette';
import { soundFx } from './utils/audioFx';

import {
  DatasetAnalytics,
  FilterState,
  DatasetFile,
} from './types/dataset';
import {
  analyzeDataset,
  applyFilters,
  parseCsvFile,
  parseExcelFile,
} from './utils/dataEngine';
import { SAMPLE_DATASETS } from './data/sampleDatasets';
import { CheckCircle2, AlertCircle, X, Sparkles, Database } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const TAB_ORDER: NavTab[] = ['overview', 'analytics', 'spatial3d', 'explorer', 'ai'];

const tabDepthFlipVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    rotateY: dir >= 0 ? 32 : -32,
    rotateX: 2,
    x: dir >= 0 ? 90 : -90,
    z: -150,
    scale: 0.94,
    filter: 'blur(4px)',
    transformPerspective: 1600,
  }),
  center: {
    opacity: 1,
    rotateY: 0,
    rotateX: 0,
    x: 0,
    z: 0,
    scale: 1,
    filter: 'blur(0px)',
    transformPerspective: 1600,
    transition: {
      duration: 0.44,
      ease: [0.16, 1, 0.3, 1] as const,
      opacity: { duration: 0.26 },
      filter: { duration: 0.28 },
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    rotateY: dir >= 0 ? -32 : 32,
    rotateX: -2,
    x: dir >= 0 ? -90 : 90,
    z: -150,
    scale: 0.94,
    filter: 'blur(4px)',
    transformPerspective: 1600,
    transition: {
      duration: 0.34,
      ease: [0.16, 1, 0.3, 1] as const,
      opacity: { duration: 0.18 },
      filter: { duration: 0.22 },
    },
  }),
};

function WorkspaceContent() {
  const { theme } = useTheme();
  // Main dataset state
  const [datasetFile, setDatasetFile] = useState<DatasetFile | null>(null);
  const [analytics, setAnalytics] = useState<DatasetAnalytics | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [tabDirection, setTabDirection] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isCalculatedModalOpen, setIsCalculatedModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleApplyCalculatedColumn = useCallback((newRows: Record<string, any>[], newColName: string) => {
    if (!datasetFile) return;
    const newHeaders = [...datasetFile.headers, newColName];
    const newAnalytics = analyzeDataset(newRows, newHeaders);
    setDatasetFile({
      ...datasetFile,
      headers: newHeaders,
      rawRows: newRows,
    });
    setAnalytics(newAnalytics);
    showToast(`Calculated metric [${newColName}] compiled into dataset schema!`);
  }, [datasetFile]);

  const handleTabChange = useCallback((newTab: NavTab) => {
    const currentIndex = TAB_ORDER.indexOf(currentTab);
    const newIndex = TAB_ORDER.indexOf(newTab);
    if (currentIndex !== newIndex) {
      setTabDirection(newIndex > currentIndex ? 1 : -1);
      setCurrentTab(newTab);
    }
  }, [currentTab]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K / '/' and 1-5 number keys)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        soundFx.playPop();
        return;
      }

      if (isInput) return;

      // Slash '/' key opens Command Palette
      if (e.key === '/') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        soundFx.playPop();
        return;
      }

      // Quick numbers 1-5 for instant tab switching
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (index >= 0 && index < TAB_ORDER.length) {
          e.preventDefault();
          handleTabChange(TAB_ORDER[index]);
          soundFx.playTick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTabChange]);

  // Interactive Cross-Filtering callback (Brushing & Linking across charts)
  const handleCategoryCrossFilter = useCallback((col: string, val: string) => {
    setFilterState((prev) => {
      const currentList = prev.categoryFilters[col] || [];
      const isAlreadyActive = currentList.includes(val);
      const updatedList = isAlreadyActive
        ? currentList.filter((c) => c !== val)
        : [...currentList, val];

      const newFilters = { ...prev.categoryFilters };
      if (updatedList.length > 0) {
        newFilters[col] = updatedList;
      } else {
        delete newFilters[col];
      }

      showToast(
        isAlreadyActive
          ? `Removed filter for "${val}"`
          : `Filtered dashboard by ${col}: "${val}"`
      );

      return {
        ...prev,
        categoryFilters: newFilters,
      };
    });
  }, []);

  // Filter state
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    categoryFilters: {},
    numericRanges: {},
    dateRange: undefined,
    onlyOutliers: false,
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Ingest raw parsed rows and calculate full statistical profile
  const ingestDataset = useCallback((name: string, rows: Record<string, any>[], headers: string[], sizeBytes = 0) => {
    setIsProcessing(true);

    // Yield to the event loop so the processing spinner renders, then compute immediately
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          const computedAnalytics = analyzeDataset(rows, headers);
          setDatasetFile({
            name,
            sizeBytes,
            rawRows: rows,
            headers,
          });
          setAnalytics(computedAnalytics);
          setFilterState({
            searchQuery: '',
            categoryFilters: {},
            numericRanges: {},
            dateRange: undefined,
            onlyOutliers: false,
          });
          setCurrentTab('overview');
          setIsProcessing(false);
          showToast(`Dataset loaded successfully (${rows.length.toLocaleString()} records, ${headers.length} columns)`);
        } catch (err: any) {
          setIsProcessing(false);
          showToast(err.message || 'Failed to analyze dataset', 'error');
        }
      }, 30);
    });
  }, []);

  // Handle uploaded file (CSV or Excel)
  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let parsed: { rows: Record<string, any>[]; headers: string[] };

      if (ext === 'xlsx' || ext === 'xls') {
        parsed = await parseExcelFile(file);
      } else {
        parsed = await parseCsvFile(file);
      }

      ingestDataset(file.name, parsed.rows, parsed.headers, file.size);
    } catch (error: any) {
      setIsProcessing(false);
      showToast(error.message || 'Error parsing file format', 'error');
    }
  };

  // Handle sample dataset selection
  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_DATASETS.find((s) => s.id === sampleId) || SAMPLE_DATASETS[0];
    const { rows, headers } = sample.generateData();
    ingestDataset(`${sample.name}.csv`, rows, headers, sample.recordCount * 140);
  };

  // Filtered rows dynamically computed from raw rows & filterState
  const filteredRows = useMemo(() => {
    if (!datasetFile || !analytics) return [];
    return applyFilters(datasetFile.rawRows, filterState, analytics);
  }, [datasetFile, filterState, analytics]);

  // Determine if location/geographic dimension is available
  const hasLocationData = useMemo(() => {
    if (!analytics) return false;
    const locationKeywords = ['region', 'country', 'market', 'location', 'city', 'state', 'territory', 'geo'];
    return analytics.categoricalColumnNames.some((c) =>
      locationKeywords.some((kw) => c.toLowerCase().includes(kw))
    );
  }, [analytics]);

  // Export filtered rows to CSV
  const handleExportCsv = () => {
    if (!datasetFile || filteredRows.length === 0) return;
    const csv = Papa.unparse(filteredRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `InsightFlow_Export_${datasetFile.name.replace(/\.[^/.]+$/, '')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredRows.length.toLocaleString()} rows to CSV`);
  };

  const handleResetFilters = () => {
    setFilterState({
      searchQuery: '',
      categoryFilters: {},
      numericRanges: {},
      dateRange: undefined,
      onlyOutliers: false,
    });
    showToast('Filters cleared');
  };

  const handleResetWorkspace = () => {
    setDatasetFile(null);
    setAnalytics(null);
    setFilterState({
      searchQuery: '',
      categoryFilters: {},
      numericRanges: {},
      dateRange: undefined,
      onlyOutliers: false,
    });
  };

  // Active filter count
  const activeFilterCount =
    (filterState.searchQuery ? 1 : 0) +
    Object.values(filterState.categoryFilters).reduce(
      (acc, curr) => acc + (curr.length > 0 ? 1 : 0),
      0
    ) +
    Object.keys(filterState.numericRanges).length +
    (filterState.dateRange ? 1 : 0) +
    (filterState.onlyOutliers ? 1 : 0);

  // If no dataset is loaded, render the stunning Landing / Hero screen
  if (!datasetFile || !analytics) {
    return (
      <>
        <LandingHero
          onFileSelected={handleFileSelected}
          onSelectSample={handleSelectSample}
          isProcessing={isProcessing}
        />
        <ProcessingOverlay isVisible={isProcessing} />

        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium ${
              toastMessage.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`min-h-screen ${theme.classes.bgCanvas} text-slate-100 flex flex-col transition-colors duration-500 relative`}>
      {/* Background Ambient Multi-Color Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full blur-[140px] opacity-35 transition-colors duration-700"
          style={{ backgroundColor: theme.classes.glowFrom }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[550px] h-[550px] rounded-full blur-[140px] opacity-30 transition-colors duration-700"
          style={{ backgroundColor: theme.classes.glowTo }}
        />
        <div
          className="absolute bottom-10 left-1/4 w-[450px] h-[450px] rounded-full blur-[140px] opacity-25 transition-colors duration-700"
          style={{ backgroundColor: theme.swatches[0] ? `${theme.swatches[0]}33` : 'rgba(236, 72, 153, 0.2)' }}
        />
      </div>

      {/* Ambient 3D Three.js Particle Background */}
      <Ambient3DBackground />

      {/* Top Navigation */}
      <TopNavigation
        currentTab={currentTab}
        onTabChange={handleTabChange}
        datasetName={datasetFile.name}
        totalRows={datasetFile.rawRows.length}
        filteredRowsCount={filteredRows.length}
        activeFilterCount={activeFilterCount}
        onResetFilters={handleResetFilters}
        onUploadNew={() => setDatasetFile(null)}
        onExportCsv={() => setIsExportModalOpen(true)}
        onOpenExportHub={() => setIsExportModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Global Filter Bar (Available across Overview, Analytics & Explorer) */}
        {currentTab !== 'ai' && (
          <FilterBar
            analytics={analytics}
            filterState={filterState}
            onFilterChange={setFilterState}
            filteredCount={filteredRows.length}
            totalCount={datasetFile.rawRows.length}
          />
        )}

        {/* Animated 3D Tab Stage with SharedLayout & Depth Slide Flip */}
        <motion.div
          layout
          className="relative w-full [perspective:1600px] [transform-style:preserve-3d]"
        >
          <AnimatePresence mode="wait" custom={tabDirection} initial={false}>
            <motion.div
              key={currentTab}
              custom={tabDirection}
              layoutId="tab-view-depth-stage"
              variants={tabDepthFlipVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full [transform-style:preserve-3d] will-change-transform"
            >
              {/* TAB 1: OVERVIEW */}
              {currentTab === 'overview' && (
                <Card3DTilt
                  maxTilt={1}
                  perspective={2000}
                  scale={1}
                  glare={false}
                  floating={false}
                  expandable={false}
                  showExpandButton={false}
                  className="w-full"
                >
                  <div className="space-y-6">
                    {/* KPI Cards */}
                    <KpiSection
                      analytics={analytics}
                      filteredRows={filteredRows}
                      totalRows={datasetFile.rawRows.length}
                    />

                    {/* Executive Leadership Interpretation Briefing */}
                    <ExecutiveBriefingCard
                      analytics={analytics}
                      filteredRows={filteredRows}
                      totalRows={datasetFile.rawRows.length}
                      datasetName={datasetFile.name}
                    />

                    {/* Primary Charts Grid with 3D Tilt and Click-to-Expand Layer Explosion */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card3DTilt className="h-full" expandable={true} showExpandButton={true}>
                        <LineTrendChart
                          filteredRows={filteredRows}
                          analytics={analytics}
                        />
                      </Card3DTilt>
                      <Card3DTilt className="h-full" expandable={true} showExpandButton={true}>
                        <CategoryBarChart
                          filteredRows={filteredRows}
                          analytics={analytics}
                          onCategoryFilter={handleCategoryCrossFilter}
                          activeCategoryFilters={filterState.categoryFilters}
                        />
                      </Card3DTilt>
                    </div>

                    {/* Secondary Distribution & Regional / Correlation Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                      <Card3DTilt className="h-full" expandable={true} showExpandButton={true}>
                        <DonutDistributionChart
                          filteredRows={filteredRows}
                          analytics={analytics}
                          onCategoryFilter={handleCategoryCrossFilter}
                          activeCategoryFilters={filterState.categoryFilters}
                        />
                      </Card3DTilt>
                      <Card3DTilt className="h-full" expandable={true} showExpandButton={true}>
                        {hasLocationData ? (
                          <RegionalBreakdown
                            filteredRows={filteredRows}
                            analytics={analytics}
                          />
                        ) : (
                          <ScatterCorrelationChart
                            filteredRows={filteredRows}
                            analytics={analytics}
                          />
                        )}
                      </Card3DTilt>
                    </div>
                  </div>
                </Card3DTilt>
              )}

              {/* TAB 2: VISUAL ANALYTICS */}
              {currentTab === 'analytics' && (
                <Card3DTilt
                  maxTilt={1}
                  perspective={2000}
                  scale={1}
                  glare={false}
                  floating={false}
                  expandable={false}
                  showExpandButton={false}
                  className="w-full"
                >
                  <div className="space-y-6">
                    {/* KPI Section */}
                    <KpiSection
                      analytics={analytics}
                      filteredRows={filteredRows}
                      totalRows={datasetFile.rawRows.length}
                    />

                    {/* Predictive Scenario & What-If Simulator */}
                    <PredictiveSimulator
                      filteredRows={filteredRows}
                      analytics={analytics}
                    />

                    {/* Time Series & Category Ranking */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                      <Card3DTilt className="h-full" expandable={true} showExpandButton={true}>
                        <LineTrendChart
                          filteredRows={filteredRows}
                          analytics={analytics}
                        />
                      </Card3DTilt>
                      <Card3DTilt className="h-full" expandable={true} showExpandButton={true}>
                        <CategoryBarChart
                          filteredRows={filteredRows}
                          analytics={analytics}
                          onCategoryFilter={handleCategoryCrossFilter}
                          activeCategoryFilters={filterState.categoryFilters}
                        />
                      </Card3DTilt>
                    </div>

                    {/* Bivariate Scatter Plot & Donut Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                      <Card3DTilt className="h-full" expandable={true} showExpandButton={true}>
                        <ScatterCorrelationChart
                          filteredRows={filteredRows}
                          analytics={analytics}
                        />
                      </Card3DTilt>
                      <Card3DTilt className="h-full" expandable={true} showExpandButton={true}>
                        <DonutDistributionChart
                          filteredRows={filteredRows}
                          analytics={analytics}
                          onCategoryFilter={handleCategoryCrossFilter}
                          activeCategoryFilters={filterState.categoryFilters}
                        />
                      </Card3DTilt>
                    </div>

                    {/* Correlation Heatmap Matrix & Regional View */}
                    <div className={`grid grid-cols-1 ${hasLocationData ? 'lg:grid-cols-2' : ''} gap-6 items-stretch`}>
                      <Card3DTilt className="h-full" expandable={true} showExpandButton={true}>
                        <CorrelationHeatmap
                          filteredRows={filteredRows}
                          analytics={analytics}
                        />
                      </Card3DTilt>
                      {hasLocationData && (
                        <Card3DTilt className="h-full" expandable={true} showExpandButton={true}>
                          <RegionalBreakdown
                            filteredRows={filteredRows}
                            analytics={analytics}
                          />
                        </Card3DTilt>
                      )}
                    </div>
                  </div>
                </Card3DTilt>
              )}

              {/* TAB: 3D SPATIAL DATA UNIVERSE */}
              {currentTab === 'spatial3d' && (
                <Card3DTilt
                  maxTilt={1.2}
                  perspective={2400}
                  scale={1}
                  glare={false}
                  floating={false}
                  className="w-full"
                >
                  <div className="w-full">
                    <Spatial3DUniverse
                      filteredRows={filteredRows}
                      analytics={analytics}
                    />
                  </div>
                </Card3DTilt>
              )}

              {/* TAB 3: DATA EXPLORER & HYGIENE CENTER */}
              {currentTab === 'explorer' && (
                <Card3DTilt
                  maxTilt={1.5}
                  perspective={2200}
                  scale={1.001}
                  glare={true}
                  glareOpacity={0.04}
                  floating={false}
                  className="w-full"
                >
                  <div className="space-y-6">
                    {/* Data Doctor & Hygiene Audit Center */}
                    <DataHealthCenter
                      analytics={analytics}
                      filterState={filterState}
                      onUpdateFilters={setFilterState}
                      totalRawRows={datasetFile.rawRows.length}
                    />

                    <DataExplorer
                      rows={filteredRows}
                      headers={datasetFile.headers}
                      analytics={analytics}
                      onExportCsv={() => setIsExportModalOpen(true)}
                      onOpenCalculatedMetric={() => setIsCalculatedModalOpen(true)}
                    />
                  </div>
                </Card3DTilt>
              )}

              {/* TAB 4: AI INTELLIGENCE */}
              {currentTab === 'ai' && (
                <Card3DTilt
                  maxTilt={1.8}
                  perspective={2000}
                  scale={1.001}
                  glare={true}
                  glareOpacity={0.05}
                  floating={false}
                  className="w-full"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left 7 Columns: Executive Synthesis & Discovery Cards */}
                    <div className="lg:col-span-7 space-y-6">
                      <AiInsightsSection
                        analytics={analytics}
                        filteredRows={filteredRows}
                        datasetName={datasetFile.name}
                      />
                    </div>

                    {/* Right 5 Columns: Interactive "Ask your data anything" Chatbot */}
                    <div className="lg:col-span-5 lg:sticky lg:top-20">
                      <AiDataAssistant
                        analytics={analytics}
                        filteredRows={filteredRows}
                        datasetName={datasetFile.name}
                      />
                    </div>
                  </div>
                </Card3DTilt>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        datasetName={datasetFile.name}
        analytics={analytics}
        onResetWorkspace={handleResetWorkspace}
      />

      {/* Executive Export & Report Hub Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        datasetFile={datasetFile}
        filteredRows={filteredRows}
        analytics={analytics}
      />

      {/* Custom Calculated Metric & Formula Builder Modal */}
      <CalculatedColumnModal
        isOpen={isCalculatedModalOpen}
        onClose={() => setIsCalculatedModalOpen(false)}
        analytics={analytics}
        rawRows={datasetFile.rawRows}
        onApplyCalculatedColumn={handleApplyCalculatedColumn}
      />

      {/* Global Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        currentTab={currentTab}
        onTabChange={handleTabChange}
        analytics={analytics}
        onOpenExport={() => setIsExportModalOpen(true)}
        onResetFilters={handleResetFilters}
        onToggleOutliers={() =>
          setFilterState((prev) => ({
            ...prev,
            onlyOutliers: !prev.onlyOutliers,
          }))
        }
        isOutliersActive={Boolean(filterState.onlyOutliers)}
        onUploadNew={() => setDatasetFile(null)}
        onOpenCalculatedMetric={() => setIsCalculatedModalOpen(true)}
      />

      {/* Loading Overlay */}
      <ProcessingOverlay isVisible={isProcessing} />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <WorkspaceContent />
    </ThemeProvider>
  );
}
