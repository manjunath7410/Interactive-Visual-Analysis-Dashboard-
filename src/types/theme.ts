export type ThemeId =
  | 'multicolor'
  | 'cyberpunk'
  | 'sunset'
  | 'aurora'
  | 'midnight'
  | 'emerald'
  | 'vibrant'
  | 'sapphire';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  swatches: string[];
  classes: {
    bgCanvas: string;
    bgPanel: string;
    bgSubtle: string;
    border: string;
    borderHover: string;
    accentPrimary: string;
    accentHover: string;
    accentText: string;
    accentRing: string;
    activeNav: string;
    glowFrom: string;
    glowTo: string;
    badgeStyle: string;
  };
  chartPalette: string[];
  trendGradients: {
    strokeFrom: string;
    strokeMid: string;
    strokeTo: string;
    fillColor: string;
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  multicolor: {
    id: 'multicolor',
    name: 'Prism Multi-Colour',
    tagline: 'Vibrant Rainbow Spectrum',
    description: 'Dynamic rainbow chromatic spectrum across all UI, charts & 3D space',
    swatches: ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
    classes: {
      bgCanvas: 'bg-[#090814]',
      bgPanel: 'bg-[#120f26]/85',
      bgSubtle: 'bg-[#0c091a]/70',
      border: 'border-[#2d2252]/80',
      borderHover: 'hover:border-pink-500/50',
      accentPrimary: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500',
      accentHover: 'hover:brightness-110',
      accentText: 'text-pink-400',
      accentRing: 'focus:border-pink-500 focus:ring-pink-500',
      activeNav: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white shadow-pink-500/20 shadow-md',
      glowFrom: 'rgba(236, 72, 153, 0.25)',
      glowTo: 'rgba(6, 182, 212, 0.22)',
      badgeStyle: 'bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 border-pink-500/30 text-pink-300',
    },
    chartPalette: [
      '#ec4899', // Hot Pink
      '#06b6d4', // Cyan
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#8b5cf6', // Violet
      '#f43f5e', // Rose
      '#84cc16', // Lime
      '#fb923c', // Orange
      '#38bdf8', // Sky Blue
      '#d946ef', // Fuchsia
    ],
    trendGradients: {
      strokeFrom: '#ec4899',
      strokeMid: '#8b5cf6',
      strokeTo: '#06b6d4',
      fillColor: '#ec4899',
    },
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk',
    tagline: 'High-Voltage Synth',
    description: 'Acid lime, neon magenta, electric cyan & hyper violet',
    swatches: ['#d946ef', '#a3e635', '#06b6d4', '#facc15'],
    classes: {
      bgCanvas: 'bg-[#08070d]',
      bgPanel: 'bg-[#130f1e]/85',
      bgSubtle: 'bg-[#0c0817]/70',
      border: 'border-[#301b4d]/80',
      borderHover: 'hover:border-fuchsia-400/50',
      accentPrimary: 'bg-gradient-to-r from-fuchsia-500 to-cyan-400',
      accentHover: 'hover:brightness-110',
      accentText: 'text-fuchsia-400',
      accentRing: 'focus:border-fuchsia-500 focus:ring-fuchsia-500',
      activeNav: 'bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-slate-950 font-bold shadow-fuchsia-500/20 shadow-md',
      glowFrom: 'rgba(217, 70, 239, 0.25)',
      glowTo: 'rgba(163, 230, 53, 0.20)',
      badgeStyle: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300',
    },
    chartPalette: [
      '#d946ef', // Neon Magenta
      '#a3e635', // Acid Lime
      '#06b6d4', // Cyan
      '#facc15', // Neon Yellow
      '#ec4899', // Hot Pink
      '#38bdf8', // Sky Blue
      '#a855f7', // Violet
      '#fb923c', // Neon Orange
    ],
    trendGradients: {
      strokeFrom: '#d946ef',
      strokeMid: '#06b6d4',
      strokeTo: '#a3e635',
      fillColor: '#d946ef',
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Solar Sunset',
    tagline: 'Warm Horizon Glow',
    description: 'Crimson rose, blood orange, golden amber & twilight violet',
    swatches: ['#f43f5e', '#fb923c', '#eab308', '#a855f7'],
    classes: {
      bgCanvas: 'bg-[#100707]',
      bgPanel: 'bg-[#1f0e10]/85',
      bgSubtle: 'bg-[#14080a]/70',
      border: 'border-[#441a22]/80',
      borderHover: 'hover:border-rose-500/50',
      accentPrimary: 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500',
      accentHover: 'hover:brightness-110',
      accentText: 'text-rose-400',
      accentRing: 'focus:border-rose-500 focus:ring-rose-500',
      activeNav: 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white shadow-rose-500/20 shadow-md',
      glowFrom: 'rgba(244, 63, 94, 0.25)',
      glowTo: 'rgba(251, 146, 60, 0.22)',
      badgeStyle: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    },
    chartPalette: [
      '#f43f5e', // Rose
      '#fb923c', // Orange
      '#eab308', // Amber
      '#a855f7', // Purple
      '#ec4899', // Pink
      '#f97316', // Deep Orange
      '#facc15', // Yellow
      '#c084fc', // Lilac
    ],
    trendGradients: {
      strokeFrom: '#f43f5e',
      strokeMid: '#fb923c',
      strokeTo: '#eab308',
      fillColor: '#f43f5e',
    },
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora Borealis',
    tagline: 'Northern Lights Shimmer',
    description: 'Electric teal, luminous emerald, icy cyan & polar violet',
    swatches: ['#10b981', '#06b6d4', '#8b5cf6', '#34d399'],
    classes: {
      bgCanvas: 'bg-[#040e10]',
      bgPanel: 'bg-[#081b1e]/85',
      bgSubtle: 'bg-[#051316]/70',
      border: 'border-[#12383c]/80',
      borderHover: 'hover:border-teal-400/50',
      accentPrimary: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400',
      accentHover: 'hover:brightness-110',
      accentText: 'text-teal-400',
      accentRing: 'focus:border-teal-500 focus:ring-teal-500',
      activeNav: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 text-slate-950 font-bold shadow-teal-500/20 shadow-md',
      glowFrom: 'rgba(16, 185, 129, 0.25)',
      glowTo: 'rgba(6, 182, 212, 0.25)',
      badgeStyle: 'bg-teal-500/10 border-teal-500/30 text-teal-300',
    },
    chartPalette: [
      '#10b981', // Emerald
      '#06b6d4', // Cyan
      '#8b5cf6', // Violet
      '#34d399', // Mint
      '#2dd4bf', // Teal
      '#a78bfa', // Lavender
      '#38bdf8', // Ice Blue
      '#4ade80', // Green
    ],
    trendGradients: {
      strokeFrom: '#10b981',
      strokeMid: '#06b6d4',
      strokeTo: '#8b5cf6',
      fillColor: '#10b981',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Deep Midnight',
    tagline: 'Classic Dark Blue',
    description: 'Deep indigo, electric violet & cyan accents',
    swatches: ['#6366f1', '#8b5cf6', '#06b6d4'],
    classes: {
      bgCanvas: 'bg-slate-950',
      bgPanel: 'bg-slate-900/80',
      bgSubtle: 'bg-slate-950/70',
      border: 'border-slate-800/80',
      borderHover: 'hover:border-indigo-500/50',
      accentPrimary: 'bg-indigo-600',
      accentHover: 'hover:bg-indigo-500',
      accentText: 'text-indigo-400',
      accentRing: 'focus:border-indigo-500 focus:ring-indigo-500',
      activeNav: 'bg-indigo-600 text-white',
      glowFrom: 'rgba(99, 102, 241, 0.20)',
      glowTo: 'rgba(6, 182, 212, 0.15)',
      badgeStyle: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    },
    chartPalette: [
      '#6366f1', // Indigo
      '#8b5cf6', // Violet
      '#06b6d4', // Cyan
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#f43f5e', // Rose
      '#3b82f6', // Blue
      '#a855f7', // Purple
    ],
    trendGradients: {
      strokeFrom: '#818cf8',
      strokeMid: '#a855f7',
      strokeTo: '#38bdf8',
      fillColor: '#6366f1',
    },
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Matrix',
    tagline: 'Forest & Jade',
    description: 'Deep forest, jade & luminous teal tones',
    swatches: ['#10b981', '#14b8a6', '#06b6d4'],
    classes: {
      bgCanvas: 'bg-[#051310]',
      bgPanel: 'bg-[#08201a]/80',
      bgSubtle: 'bg-[#051511]/70',
      border: 'border-[#11382e]/80',
      borderHover: 'hover:border-emerald-500/50',
      accentPrimary: 'bg-emerald-600',
      accentHover: 'hover:bg-emerald-500',
      accentText: 'text-emerald-400',
      accentRing: 'focus:border-emerald-500 focus:ring-emerald-500',
      activeNav: 'bg-emerald-600 text-white',
      glowFrom: 'rgba(16, 185, 129, 0.20)',
      glowTo: 'rgba(20, 184, 166, 0.15)',
      badgeStyle: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    },
    chartPalette: [
      '#10b981', // Emerald
      '#14b8a6', // Teal
      '#06b6d4', // Cyan
      '#34d399', // Mint
      '#84cc16', // Lime
      '#0284c7', // Sky
      '#eab308', // Amber
      '#f97316', // Orange
    ],
    trendGradients: {
      strokeFrom: '#34d399',
      strokeMid: '#14b8a6',
      strokeTo: '#06b6d4',
      fillColor: '#10b981',
    },
  },
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant Magenta',
    tagline: 'Fuchsia & Sunset',
    description: 'Electric fuchsia, royal purple & sunset amber',
    swatches: ['#ec4899', '#8b5cf6', '#f59e0b'],
    classes: {
      bgCanvas: 'bg-[#0d0914]',
      bgPanel: 'bg-[#181126]/80',
      bgSubtle: 'bg-[#100a1c]/70',
      border: 'border-[#2d1f47]/80',
      borderHover: 'hover:border-fuchsia-500/50',
      accentPrimary: 'bg-fuchsia-600',
      accentHover: 'hover:bg-fuchsia-500',
      accentText: 'text-fuchsia-400',
      accentRing: 'focus:border-fuchsia-500 focus:ring-fuchsia-500',
      activeNav: 'bg-fuchsia-600 text-white',
      glowFrom: 'rgba(236, 72, 153, 0.20)',
      glowTo: 'rgba(139, 92, 246, 0.15)',
      badgeStyle: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300',
    },
    chartPalette: [
      '#ec4899', // Fuchsia
      '#8b5cf6', // Violet
      '#f59e0b', // Amber
      '#f43f5e', // Rose
      '#06b6d4', // Cyan
      '#a855f7', // Purple
      '#fb923c', // Coral
      '#38bdf8', // Sky
    ],
    trendGradients: {
      strokeFrom: '#f43f5e',
      strokeMid: '#ec4899',
      strokeTo: '#f59e0b',
      fillColor: '#ec4899',
    },
  },
  sapphire: {
    id: 'sapphire',
    name: 'Sapphire Cobalt',
    tagline: 'Oceanic Blue',
    description: 'Deep oceanic navy, cobalt & electric cyan',
    swatches: ['#3b82f6', '#0ea5e9', '#06b6d4'],
    classes: {
      bgCanvas: 'bg-[#060e1a]',
      bgPanel: 'bg-[#0b172a]/80',
      bgSubtle: 'bg-[#071120]/70',
      border: 'border-[#162a4a]/80',
      borderHover: 'hover:border-blue-500/50',
      accentPrimary: 'bg-blue-600',
      accentHover: 'hover:bg-blue-500',
      accentText: 'text-blue-400',
      accentRing: 'focus:border-blue-500 focus:ring-blue-500',
      activeNav: 'bg-blue-600 text-white',
      glowFrom: 'rgba(59, 130, 246, 0.20)',
      glowTo: 'rgba(14, 165, 233, 0.15)',
      badgeStyle: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    },
    chartPalette: [
      '#3b82f6', // Blue
      '#0ea5e9', // Sky
      '#06b6d4', // Cyan
      '#6366f1', // Indigo
      '#14b8a6', // Teal
      '#2dd4bf', // Aquamarine
      '#8b5cf6', // Violet
      '#38bdf8', // Light Sky
    ],
    trendGradients: {
      strokeFrom: '#60a5fa',
      strokeMid: '#38bdf8',
      strokeTo: '#2dd4bf',
      fillColor: '#3b82f6',
    },
  },
};
