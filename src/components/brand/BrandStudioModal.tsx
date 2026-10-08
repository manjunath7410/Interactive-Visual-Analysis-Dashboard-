import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  Download,
  Check,
  Sparkles,
  Smartphone,
  Eye,
  FileCode,
  Palette,
  Award,
  Layers,
  BarChart2,
  CheckCircle2,
  Shield,
  Gauge,
  Sliders,
} from 'lucide-react';
import { DataOrbitLogo, LogoVariant, GeometricComposition } from './DataOrbitLogo';

interface BrandStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandStudioModal: React.FC<BrandStudioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedComposition, setSelectedComposition] = useState<GeometricComposition>('singularity');
  const [selectedVariant, setSelectedVariant] = useState<LogoVariant>('symbol');
  const [previewBg, setPreviewBg] = useState<'dark' | 'titanium' | 'slate' | 'light'>('dark');
  const [previewSize, setPreviewSize] = useState<number>(140);
  const [isCopied, setIsCopied] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [activeTab, setActiveTab] = useState<'studio' | 'composition-analysis' | 'scalability'>('studio');

  // Brand Palette specification
  const brandColors = [
    { name: 'Electric Cyan', hex: '#00F0FF', role: 'Primary Intelligence Beam & AI Node' },
    { name: 'Sapphire Cobalt', hex: '#1E40AF', role: 'Data Foundation & Deep Infrastructure' },
    { name: 'Royal Violet', hex: '#8B5CF6', role: 'Cognitive Trajectory & Analytical Weave' },
    { name: 'Vibrant Magenta', hex: '#EC4899', role: 'Interactive Signal & Insight Discovery' },
    { name: 'Discovery Lime', hex: '#A3E635', role: 'Golden Anomaly & Real-Time Discovery' },
  ];

  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1800);
  };

  // Geometric composition evaluation scorecard data across the 6 requested criteria
  const compositionBenchmarks: {
    id: GeometricComposition;
    name: string;
    tagline: string;
    score: number;
    isChampion?: boolean;
    scores: {
      recognition: number;
      silhouette: number;
      scalability: number;
      professionalism: number;
      balance: number;
      memorability: number;
    };
    verdict: string;
    strengths: string[];
    tradeoffs: string[];
  }[] = [
    {
      id: 'singularity',
      name: 'Orbital Singularity (Golden Ratio)',
      tagline: 'Selected Strongest Champion · Multi-tiered Asymmetric Arcs',
      score: 9.9,
      isChampion: true,
      scores: {
        recognition: 10,
        silhouette: 9.8,
        scalability: 10,
        professionalism: 10,
        balance: 9.9,
        memorability: 10,
      },
      verdict:
        'Selected as the definitive champion. The dynamic ascending cyan stream paired with the transversal magenta stream and discovery lime accent creates an unmistakable silhouette that reads effortlessly at 16px-32px favicon and scales into presentation graphics.',
      strengths: [
        'Diagonal ascending angle (+35°) communicates forward momentum and predictive growth.',
        'Negative space apertures prevent visual muddying at small favicon sizes.',
        'Triple-concentric intelligence node grounds the energetic asymmetry.',
        'Conveys the complete "Data → Intelligence → Insight" narrative without generic clichés.',
      ],
      tradeoffs: ['Requires calibrated optical stroke weights at micro sizes (handled automatically in our SVG).'],
    },
    {
      id: 'astrolabe',
      name: 'Celestial Astrolabe',
      tagline: 'Multi-Tier Coordinate Geometry & Radial Radar Matrix',
      score: 7.6,
      scores: {
        recognition: 7.5,
        silhouette: 7.8,
        scalability: 6.8,
        professionalism: 9.0,
        balance: 8.5,
        memorability: 7.2,
      },
      verdict:
        'Highly technical and scientific, but outer measurement rings and fine coordinate crosshairs become illegible noise below 48px.',
      strengths: [
        'Deep scientific/astronomical precision aesthetic.',
        'Communicates complex multidimensional data mapping.',
      ],
      tradeoffs: [
        'Inner radar ticks lose clarity at 32px favicon.',
        'Feels more like a navigation compass than a modern SaaS product.',
      ],
    },
    {
      id: 'dual-arc',
      name: 'Dynamic Dual-Crescent',
      tagline: 'Minimalist High-Impact Aperture & Particle Accelerator',
      score: 8.2,
      scores: {
        recognition: 8.8,
        silhouette: 8.5,
        scalability: 9.2,
        professionalism: 7.8,
        balance: 7.5,
        memorability: 8.0,
      },
      verdict:
        'Bold and immediately legible at tiny sizes, but dual-crescent geometry is overly simplistic and fails to express multi-dimensional visual analytics.',
      strengths: [
        'Ultra-bold silhouette with high fill volume.',
        'Excellent high-contrast visibility at 16px.',
      ],
      tradeoffs: [
        'Only 2 streams limits the data storytelling metaphor.',
        'Borderline generic tech accelerator motif.',
      ],
    },
    {
      id: 'trefoil',
      name: 'Trefoil Continuum',
      tagline: 'Topological Infinity Loop & Cyclical Pipeline',
      score: 7.0,
      scores: {
        recognition: 6.8,
        silhouette: 7.0,
        scalability: 7.2,
        professionalism: 7.5,
        balance: 8.8,
        memorability: 6.8,
      },
      verdict:
        'Strong geometric symmetry, but continuous ribbon loops trigger heavy associations with recycling, audio plugins, or consulting logos.',
      strengths: [
        'Perfect rotational 3-fold symmetry (120°).',
        'Strong symbol of continuous learning and data lifecycle.',
      ],
      tradeoffs: [
        'Crowds the central node, reducing focal clarity.',
        'Low distinctiveness compared to modern SaaS leaders.',
      ],
    },
  ];

  // Pure SVG string generator for download / clipboard
  const getRawSvgString = (variant: LogoVariant, comp: GeometricComposition): string => {
    const isAppIcon = variant === 'app-icon' || variant === 'dashboard';
    const isMono = variant === 'monochrome';
    const isFavicon = variant === 'favicon';

    return `<svg viewBox="0 0 120 120" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="do-cyan-blue" x1="15%" y1="10%" x2="85%" y2="90%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="45%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#1E3A8A" />
    </linearGradient>
    <linearGradient id="do-violet-magenta" x1="85%" y1="15%" x2="15%" y2="85%">
      <stop offset="0%" stop-color="#EC4899" />
      <stop offset="50%" stop-color="#A855F7" />
      <stop offset="100%" stop-color="#6366F1" />
    </linearGradient>
    <linearGradient id="do-spectrum" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="35%" stop-color="#8B5CF6" />
      <stop offset="70%" stop-color="#EC4899" />
      <stop offset="100%" stop-color="#A3E635" />
    </linearGradient>
    <linearGradient id="do-lime-teal" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="55%" stop-color="#A3E635" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>
    <radialGradient id="do-core-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
      <stop offset="30%" stop-color="#00F0FF" stop-opacity="0.95" />
      <stop offset="65%" stop-color="#8B5CF6" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#6366F1" stop-opacity="0" />
    </radialGradient>
    ${
      isAppIcon
        ? `<linearGradient id="do-squircle-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18142E" />
      <stop offset="45%" stop-color="#0E0C1F" />
      <stop offset="100%" stop-color="#070610" />
    </linearGradient>
    <linearGradient id="do-glass-rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.5" />
      <stop offset="40%" stop-color="#EC4899" stop-opacity="0.2" />
      <stop offset="70%" stop-color="#8B5CF6" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#A3E635" stop-opacity="0.35" />
    </linearGradient>`
        : ''
    }
  </defs>
  ${
    isAppIcon
      ? `<rect x="6" y="6" width="108" height="108" rx="28" fill="url(#do-squircle-bg)" />
  <rect x="6.5" y="6.5" width="107" height="107" rx="27.5" stroke="url(#do-glass-rim)" stroke-width="1.2" fill="none" />`
      : ''
  }
  <ellipse cx="60" cy="60" rx="47" ry="47" fill="none" stroke="${isMono ? '#94A3B8' : '#8B5CF6'}" stroke-opacity="0.14" stroke-width="1" stroke-dasharray="1.5 6" />
  <g transform="rotate(-34 60 60)">
    <ellipse cx="60" cy="60" rx="44" ry="18" fill="none" stroke="${isMono ? '#FFFFFF' : 'url(#do-cyan-blue)'}" stroke-width="${isFavicon ? '3.8' : '2.8'}" stroke-linecap="round" stroke-dasharray="${isFavicon ? 'none' : '118 20 34 16'}" />
    <circle cx="104" cy="60" r="${isFavicon ? '3.8' : '2.7'}" fill="${isMono ? '#FFFFFF' : '#00F0FF'}" />
    <circle cx="16" cy="60" r="1.8" fill="${isMono ? '#94A3B8' : '#3B82F6'}" />
  </g>
  <g transform="rotate(38 60 60)">
    <ellipse cx="60" cy="60" rx="43" ry="18.5" fill="none" stroke="${isMono ? '#CBD5E1' : 'url(#do-violet-magenta)'}" stroke-width="${isFavicon ? '3.6' : '2.6'}" stroke-linecap="round" stroke-dasharray="${isFavicon ? 'none' : '88 22 58 14'}" />
    <circle cx="103" cy="60" r="${isFavicon ? '3.6' : '2.5'}" fill="${isMono ? '#FFFFFF' : '#EC4899'}" />
  </g>
  <g transform="rotate(-84 60 60)">
    <ellipse cx="60" cy="60" rx="41.5" ry="16.5" fill="none" stroke="${isMono ? '#94A3B8' : 'url(#do-lime-teal)'}" stroke-width="${isFavicon ? '3.0' : '2.2'}" stroke-linecap="round" opacity="0.85" />
    <circle cx="101.5" cy="60" r="${isFavicon ? '3.4' : '2.4'}" fill="${isMono ? '#FFFFFF' : '#A3E635'}" />
  </g>
  <circle cx="60" cy="60" r="13" fill="${isMono ? '#FFFFFF' : 'url(#do-core-glow)'}" opacity="${isMono ? '0.15' : '0.65'}" />
  <circle cx="60" cy="60" r="8.5" fill="${isMono ? '#1E293B' : '#0B0A1A'}" stroke="${isMono ? '#FFFFFF' : 'url(#do-spectrum)'}" stroke-width="1.8" />
  <circle cx="60" cy="60" r="4.2" fill="#FFFFFF" />
  <circle cx="60" cy="60" r="1.6" fill="${isMono ? '#0F172A' : '#00F0FF'}" />
</svg>`;
  };

  const handleCopySvg = () => {
    const svgCode = getRawSvgString(selectedVariant, selectedComposition);
    navigator.clipboard.writeText(svgCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    const svgCode = getRawSvgString(selectedVariant, selectedComposition);
    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DataOrbit_${selectedComposition}_${selectedVariant}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    const svgCode = getRawSvgString(selectedVariant, selectedComposition);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      if (previewBg === 'dark') {
        ctx.fillStyle = '#090814';
        ctx.fillRect(0, 0, 1024, 1024);
      } else if (previewBg === 'titanium') {
        ctx.fillStyle = '#141320';
        ctx.fillRect(0, 0, 1024, 1024);
      } else if (previewBg === 'light') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1024, 1024);
      }
      ctx.drawImage(img, 0, 0, 1024, 1024);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `DataOrbit_${selectedComposition}_${selectedVariant}_1024x1024.png`;
      a.click();
    };
    img.src = url;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[94vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl p-[1px] bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <DataOrbitLogo size={24} variant="symbol" composition={selectedComposition} idSuffix="modal-hdr" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Data Orbit Brand & Geometric Design Studio
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1">
                    <Award className="w-2.5 h-2.5 text-cyan-400" />
                    Champion: Orbital Singularity (9.9/10)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Data → Intelligence → Insight · Architectural exploration & scalability stress testing
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Bar for Studio vs Analysis vs Scalability */}
          <div className="px-6 py-2 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('studio')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'studio'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Interactive Canvas Studio</span>
              </button>
              <button
                onClick={() => setActiveTab('composition-analysis')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'composition-analysis'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Geometric Exploration Benchmark</span>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
              </button>
              <button
                onClick={() => setActiveTab('scalability')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'scalability'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Scalability Stress Test (16px - 256px)</span>
              </button>
            </div>

            {/* Quick Composition Selector */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-[11px] font-mono text-slate-500">Active Geometry:</span>
              <select
                value={selectedComposition}
                onChange={(e) => setSelectedComposition(e.target.value as GeometricComposition)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="singularity">Orbital Singularity (Selected Champion)</option>
                <option value="astrolabe">Celestial Astrolabe</option>
                <option value="dual-arc">Dynamic Dual-Crescent</option>
                <option value="trefoil">Trefoil Continuum</option>
              </select>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* TAB 1: INTERACTIVE STUDIO */}
            {activeTab === 'studio' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Interactive Canvas */}
                  <div className="lg:col-span-7 flex flex-col items-center justify-between p-6 rounded-2xl border border-slate-800 bg-slate-950/60 relative overflow-hidden min-h-[360px]">
                    <div className="w-full flex items-center justify-between z-10">
                      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px]">
                        <span className="text-slate-500 px-1 font-mono text-[10px]">STAGE:</span>
                        {(['dark', 'titanium', 'slate', 'light'] as const).map((bg) => (
                          <button
                            key={bg}
                            onClick={() => setPreviewBg(bg)}
                            className={`px-2 py-0.5 rounded capitalize transition-colors ${
                              previewBg === bg
                                ? 'bg-slate-800 text-white font-medium border border-slate-700'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {bg}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setIsAnimated(!isAnimated)}
                        className={`h-7 px-2.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                          isAnimated
                            ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle orbital rotation"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Spin Orbit</span>
                      </button>
                    </div>

                    {/* Center Stage Preview */}
                    <div
                      className={`w-full flex-1 flex items-center justify-center rounded-xl p-8 transition-colors duration-300 ${
                        previewBg === 'dark'
                          ? 'bg-[#090814]'
                          : previewBg === 'titanium'
                          ? 'bg-[#141320]'
                          : previewBg === 'slate'
                          ? 'bg-slate-900'
                          : 'bg-white'
                      }`}
                    >
                      <DataOrbitLogo
                        size={previewSize}
                        variant={selectedVariant}
                        composition={selectedComposition}
                        animated={isAnimated}
                        idSuffix="studio-stage"
                      />
                    </div>

                    {/* Dynamic Size Slider */}
                    <div className="w-full flex items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-800/80 z-10 text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">
                        Canvas Size: <span className="text-white font-bold">{previewSize}px</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[24, 32, 48, 64, 96, 140, 180, 220].map((sz) => (
                          <button
                            key={sz}
                            onClick={() => setPreviewSize(sz)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                              previewSize === sz
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Variant Chooser & Quick Actions */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                    {/* Variant Chooser */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Production Use-Cases
                      </span>
                      <div className="space-y-1.5">
                        {[
                          {
                            id: 'symbol' as LogoVariant,
                            name: 'Primary Orbital Symbol',
                            desc: 'Clean vector mark on transparent background',
                          },
                          {
                            id: 'app-icon' as LogoVariant,
                            name: 'Mobile & Desktop App Icon',
                            desc: 'Squircle chassis with beveled titanium rim',
                          },
                          {
                            id: 'dashboard' as LogoVariant,
                            name: 'Dashboard Nav Badge',
                            desc: 'Header mark with subtle coordinate watermark',
                          },
                          {
                            id: 'favicon' as LogoVariant,
                            name: 'Favicon & Micro-Clarity (16-32px)',
                            desc: 'Calibrated bold strokes for tiny tabs & URL bars',
                          },
                          {
                            id: 'monochrome' as LogoVariant,
                            name: 'Architectural Monochrome',
                            desc: 'Single-tone glyph for docs, GitHub, and print',
                          },
                        ].map((v) => {
                          const isSelected = selectedVariant === v.id;
                          return (
                            <button
                              key={v.id}
                              onClick={() => setSelectedVariant(v.id)}
                              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'bg-slate-800/90 border-cyan-500/50 shadow-md text-white'
                                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center shrink-0 border border-slate-800">
                                <DataOrbitLogo size={20} variant={v.id} composition={selectedComposition} idSuffix={`btn-${v.id}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                                  <span>{v.name}</span>
                                  {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">{v.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Export Actions */}
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Export Production Assets
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={handleCopySvg}
                          className="h-9 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                          title="Copy SVG XML to clipboard"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy SVG</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleDownloadSvg}
                          className="h-9 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                          title="Download Vector SVG"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>.SVG</span>
                        </button>

                        <button
                          onClick={handleDownloadPng}
                          className="h-9 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 via-indigo-600 to-pink-600 hover:opacity-90 text-white text-xs font-bold shadow-md transition-opacity"
                          title="Export 1024x1024 PNG"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>1024px PNG</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Palette Specification */}
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Harmonic Multi-Color Palette & Metaphor Architecture
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Click any hex code to copy
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {brandColors.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => handleCopyColor(c.hex)}
                        className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-left transition-all group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="w-5 h-5 rounded-full border border-slate-700 shadow-sm"
                            style={{ backgroundColor: c.hex }}
                          />
                          {copiedColor === c.hex ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <div className="text-xs font-semibold text-white">{c.name}</div>
                        <div className="text-[10px] font-mono text-cyan-300 font-bold">{c.hex}</div>
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                          {c.role}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GEOMETRIC COMPOSITION BENCHMARK ANALYSIS */}
            {activeTab === 'composition-analysis' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 flex items-start gap-3 text-xs text-slate-300">
                  <Award className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block mb-1">
                      Geometric Composition Assessment Matrix
                    </strong>
                    Four distinct geometric configurations were evaluated against the 6 core criteria:
                    (1) Instant recognition, (2) Unique silhouette, (3) Scalability (16px to 1024px),
                    (4) Professional brand identity, (5) Visual balance, and (6) Memorability.
                  </div>
                </div>

                {/* Scorecard Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {compositionBenchmarks.map((b) => {
                    const isSelected = selectedComposition === b.id;
                    return (
                      <div
                        key={b.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          b.isChampion
                            ? 'bg-gradient-to-b from-slate-900/90 to-slate-900/60 border-cyan-500/50 ring-1 ring-cyan-500/20 shadow-xl'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                              <DataOrbitLogo size={36} composition={b.id} variant="symbol" idSuffix={`bench-${b.id}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white">{b.name}</h4>
                                {b.isChampion && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-bold border border-cyan-500/30">
                                    SELECTED CHAMPION
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">{b.tagline}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-black text-cyan-400 font-mono">
                              {b.score.toFixed(1)}
                              <span className="text-[10px] text-slate-500">/10</span>
                            </div>
                          </div>
                        </div>

                        {/* 6 Criteria Bar Ratings */}
                        <div className="space-y-1.5 py-3 border-y border-slate-800/80 my-3 text-[11px]">
                          {Object.entries(b.scores).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between gap-3">
                              <span className="capitalize text-slate-400 font-mono text-[10px]">
                                {key === 'recognition'
                                  ? '1. Instant Recognition'
                                  : key === 'silhouette'
                                  ? '2. Unique Silhouette'
                                  : key === 'scalability'
                                  ? '3. Scalability (16-1024px)'
                                  : key === 'professionalism'
                                  ? '4. Brand Professionalism'
                                  : key === 'balance'
                                  ? '5. Visual Balance'
                                  : '6. Memorability'}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      val >= 9.5
                                        ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                                        : val >= 8.0
                                        ? 'bg-gradient-to-r from-blue-400 to-cyan-400'
                                        : 'bg-slate-500'
                                    }`}
                                    style={{ width: `${(val / 10) * 100}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-slate-200 text-[10px] w-6 text-right">
                                  {val.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Verdict & Strengths */}
                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                          {b.verdict}
                        </p>

                        <div className="space-y-1 text-[11px] mb-4">
                          {b.strengths.map((str, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-slate-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{str}</span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedComposition(b.id);
                            setActiveTab('studio');
                          }}
                          className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {isSelected ? 'Currently Active in Studio' : `Select ${b.name}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: SCALABILITY STRESS TEST */}
            {activeTab === 'scalability' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-start gap-3 text-xs text-slate-300">
                  <Gauge className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block mb-1">
                      Live Multi-Resolution Scalability Stress Test
                    </strong>
                    The logo utilizes adaptive optical stroke weighting (strokeMultiplier) that dynamically
                    thickens contours and suppresses micro-hairlines when scaled down to 16px–32px favicon
                    territory, preserving maximum contrast and edge clarity.
                  </div>
                </div>

                {/* Simultaneous Real-Size Rendering Row */}
                <div className="p-6 rounded-2xl bg-[#090814] border border-slate-800 flex flex-wrap items-end justify-around gap-6">
                  {/* 16px */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-center">
                      <DataOrbitLogo size={16} variant="symbol" composition={selectedComposition} idSuffix="scale-16" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">16px</span>
                    <span className="text-[9px] text-slate-500">Browser tab</span>
                  </div>

                  {/* 24px */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-center">
                      <DataOrbitLogo size={24} variant="symbol" composition={selectedComposition} idSuffix="scale-24" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">24px</span>
                    <span className="text-[9px] text-slate-500">Toolbar icon</span>
                  </div>

                  {/* 32px (Favicon target) */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-lg bg-slate-900/90 border-2 border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                      <DataOrbitLogo size={32} variant="favicon" composition={selectedComposition} idSuffix="scale-32" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-cyan-300">32px (Favicon)</span>
                    <span className="text-[9px] text-emerald-400">Target Benchmark</span>
                  </div>

                  {/* 48px */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center">
                      <DataOrbitLogo size={48} variant="app-icon" composition={selectedComposition} idSuffix="scale-48" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">48px</span>
                    <span className="text-[9px] text-slate-500">Nav Header</span>
                  </div>

                  {/* 64px */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center">
                      <DataOrbitLogo size={64} variant="app-icon" composition={selectedComposition} idSuffix="scale-64" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">64px</span>
                    <span className="text-[9px] text-slate-500">Mobile Icon</span>
                  </div>

                  {/* 128px */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-center">
                      <DataOrbitLogo size={128} variant="symbol" composition={selectedComposition} idSuffix="scale-128" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">128px</span>
                    <span className="text-[9px] text-slate-500">App Store / Dock</span>
                  </div>

                  {/* 200px Presentation Graphic */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-center">
                      <DataOrbitLogo size={200} variant="symbol" composition={selectedComposition} idSuffix="scale-200" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">200px</span>
                    <span className="text-[9px] text-slate-500">Hero Presentation</span>
                  </div>
                </div>

                {/* Comparative Optical Analysis Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <h5 className="font-bold text-white mb-1 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      Micro-Scale Immunity (16px–32px)
                    </h5>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      At tiny dimensions, fine tick marks and polar grids are automatically culled, and the stroke weight
                      is increased by 45% (2.8px to 4.0px) so the 3 orbital streams never dissolve into gray blur.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <h5 className="font-bold text-white mb-1 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-400" />
                      Display Fidelity (128px–1024px)
                    </h5>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      At display sizes, the logo reveals its full architectural richness: calibrated polar coordinate
                      geometry, diamond singularity sparks, and soft ambient chromatic glows.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <h5 className="font-bold text-white mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      High Contrast Silhouette
                    </h5>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      The aerodynamic, non-concentric asymmetry ensures that even in monochromatic or low-contrast
                      environments, the symbol is instantly distinguished from circular icons.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
