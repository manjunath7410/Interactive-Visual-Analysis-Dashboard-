import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  UploadCloud,
  FileSpreadsheet,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  BarChart3,
  Box,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card3DTilt } from '../ui/Card3DTilt';
import { Ambient3DBackground } from '../spatial3d/Ambient3DBackground';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { DataOrbitLogo } from '../brand/DataOrbitLogo';
import { BrandStudioModal } from '../brand/BrandStudioModal';
import { useTheme } from '../../context/ThemeContext';
import { SAMPLE_DATASETS } from '../../data/sampleDatasets';

interface LandingHeroProps {
  onFileSelected: (file: File) => void;
  onSelectSample: (sampleId: string) => void;
  isProcessing: boolean;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onFileSelected,
  onSelectSample,
  isProcessing,
}) => {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSampleSelector, setShowSampleSelector] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setErrorMessage(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
      setErrorMessage('Please upload a valid CSV or Excel (.xlsx, .xls) dataset.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('File size exceeds 100MB limit. Please upload a smaller dataset.');
      return;
    }
    onFileSelected(file);
  };

  return (
    <div className={`relative min-h-screen flex flex-col justify-between overflow-hidden ${theme.classes.bgCanvas} text-slate-100 transition-colors duration-500`}>
      {/* Three.js Ambient Particle Universe with Breathing Pulse */}
      <Ambient3DBackground />

      {/* Background Ambient Glows & Interactive Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[450px] h-[450px] rounded-full blur-[140px] opacity-40 transition-colors duration-700"
          style={{ backgroundColor: theme.classes.glowFrom }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[450px] h-[450px] rounded-full blur-[140px] opacity-35 transition-colors duration-700"
          style={{ backgroundColor: theme.classes.glowTo }}
        />
        <div
          className="absolute -bottom-40 left-1/3 w-[450px] h-[450px] rounded-full blur-[140px] opacity-30 transition-colors duration-700"
          style={{ backgroundColor: theme.swatches[0] ? `${theme.swatches[0]}33` : 'rgba(236, 72, 153, 0.2)' }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div
          onClick={() => setIsBrandModalOpen(true)}
          className="flex items-center gap-3 cursor-pointer group"
          title="Click to open Data Orbit Logo & Brand Studio"
        >
          <div className="relative">
            <DataOrbitLogo
              size={40}
              variant="app-icon"
              animated={true}
              idSuffix="landing-hero"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                InsightFlow
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Data Orbit
              </span>
            </div>
            <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">
              Enterprise Visual Analytics
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Brand & Logo Assets Button */}
          <button
            onClick={() => setIsBrandModalOpen(true)}
            className="h-8 inline-flex items-center gap-1.5 px-2.5 text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-lg transition-all shrink-0 whitespace-nowrap shadow-sm group"
            title="Open Data Orbit Logo & Brand Asset Studio"
          >
            <DataOrbitLogo size={15} variant="symbol" idSuffix="hdr-btn" />
            <span className="hidden sm:inline font-semibold">Logo Studio</span>
          </button>

          {/* Prominent Theme Switcher on Landing screen */}
          <ThemeSwitcher />

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 pl-2 border-l border-slate-800">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Local Engine
            </span>
            <span className="text-slate-600">·</span>
            <span>Zero Server Storage</span>
          </div>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col lg:flex-row items-center justify-between gap-16">
        {/* Left Column: Hero Text & Actions */}
        <div className="w-full lg:w-7/12 flex flex-col items-start text-left">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium mb-6 ${theme.classes.badgeStyle}`}>
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>Next-Gen Autonomous Analytics & AI Synthesis</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
            Turn Data Into <br />
            <span className="bg-gradient-to-r from-pink-400 via-purple-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Living Intelligence.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl mb-10">
            Explore, visualize, and understand your data through an intelligent interactive analytics workspace. Upload CSV or Excel datasets for real-time statistical profiling, multi-dimensional charts, and conversational AI insights.
          </p>

          {/* Upload Dropzone Container */}
          <div className="w-full max-w-xl">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative cursor-pointer rounded-2xl p-8 transition-all duration-300 border-2 border-dashed ${
                isDragOver
                  ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                  : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-900/60 hover:bg-slate-900/90'
              } backdrop-blur-md shadow-2xl`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">
                  Upload Your Dataset
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  Drag and drop files here, or click to browse from your computer
                </p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">CSV</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">XLSX</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-semibold">Up to 100MB (100k+ Rows)</span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-3 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Secondary Action: Explore Demo Dataset */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSampleSelector(!showSampleSelector)}
                className="h-10 inline-flex items-center gap-2 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 transition-all font-medium text-xs shadow-sm hover:border-slate-600 shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Explore Demo Dataset</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => onSelectSample('saas-ops')}
                className="h-10 inline-flex items-center gap-2 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 transition-all font-medium text-xs shadow-sm shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Instant Launch: SaaS Operations (360 rows)</span>
              </button>
            </div>

            {/* Demo Datasets Dropdown Menu */}
            {showSampleSelector && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl space-y-2"
              >
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                  Select a Curated Business Dataset
                </div>
                {SAMPLE_DATASETS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      setShowSampleSelector(false);
                      onSelectSample(sample.id);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors flex items-start justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 flex items-center gap-2">
                        {sample.name}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {sample.recordCount} rows
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {sample.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Column: Animated Visual Elements & Floating Analytical Cards */}
        <div className="w-full lg:w-5/12 flex items-center justify-center relative min-h-[460px]">
          {/* Central Rotating Analytical Ring */}
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
            {/* Outer slowly rotating ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-indigo-500/20 border-dashed"
            />

            {/* Inner counter-rotating ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
              className="absolute inset-8 rounded-full border border-violet-500/25"
            >
              {/* Orbiting nodes */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50" />
            </motion.div>

            {/* Center Core Visualization Hub with 3D Tilt */}
            <Card3DTilt maxTilt={12} scale={1.03} className="relative z-10">
              <div className="w-44 h-44 rounded-full bg-slate-900/90 border border-slate-700 flex flex-col items-center justify-center p-4 text-center shadow-2xl backdrop-blur-xl">
                <Database className="w-8 h-8 text-indigo-400 mb-2" style={{ transform: 'translateZ(20px)' }} />
                <span className="text-xs font-bold text-white tracking-wider uppercase" style={{ transform: 'translateZ(14px)' }}>
                  Insight Engine
                </span>
                <span className="text-[10px] text-slate-400 mt-1">Autonomous 3D & Statistical Discovery</span>
              </div>
            </Card3DTilt>

            {/* Floating Mini KPI Card 1: Top Right */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="absolute -top-4 -right-4 sm:right-0 z-20 w-48"
            >
              <Card3DTilt maxTilt={10} floating={false} className="w-full">
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Revenue Growth</span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" /> +28.4%
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white tabular-nums">$1,482,900</div>
                  <div className="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[78%]" />
                  </div>
                </div>
              </Card3DTilt>
            </motion.div>

            {/* Floating Mini KPI Card 2: Bottom Left */}
            <motion.div
              animate={{ y: [6, -6, 6] }}
              transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
              className="absolute -bottom-6 -left-4 sm:left-0 z-20 w-52"
            >
              <Card3DTilt maxTilt={10} floating={false} className="w-full">
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Correlation Matrix</span>
                  </div>
                  <div className="text-xs font-medium text-slate-200">
                    Revenue ↔ Profit Margin
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Pearson r</span>
                    <span className="text-indigo-400 font-mono font-bold">+0.84 (Strong)</span>
                  </div>
                </div>
              </Card3DTilt>
            </motion.div>

            {/* Floating Mini Badge: Quality */}
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="absolute bottom-24 -right-8 z-20 bg-slate-900/90 border border-emerald-500/30 rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-slate-200">99.8% Data Completeness</span>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer Feature Highlights */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-indigo-400 shrink-0" />
          <div>
            <div className="font-semibold text-slate-200">Interactive Visuals</div>
            <div>Line, bar, donut, scatter & heatmap</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Box className="w-5 h-5 text-indigo-400 shrink-0" />
          <div>
            <div className="font-semibold text-slate-200">3D Spatial Universe</div>
            <div>Three.js WebGL orbit & raycasting</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-violet-400 shrink-0" />
          <div>
            <div className="font-semibold text-slate-200">Dynamic Filter Engine</div>
            <div>Multi-select & range filtering</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="font-semibold text-slate-200">AI Intelligence</div>
            <div>Autonomous executive synthesis</div>
          </div>
        </div>
      </footer>

      {/* Interactive Brand & Logo Studio Modal */}
      <BrandStudioModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
      />
    </div>
  );
};
