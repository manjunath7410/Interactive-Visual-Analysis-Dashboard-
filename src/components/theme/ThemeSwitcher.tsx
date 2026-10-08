import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeId } from '../../types/theme';

export const ThemeSwitcher: React.FC = () => {
  const { themeId, theme, setThemeId, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 inline-flex items-center gap-2 px-2.5 text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-pink-500/50 rounded-lg transition-all shrink-0 whitespace-nowrap shadow-sm group"
        title="Switch Multi-Colour Theme"
      >
        <div className="w-4 h-4 rounded-full p-[1px] bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 flex items-center justify-center shrink-0">
          <Palette className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="font-semibold tracking-tight">{theme.name}</span>

        {/* Multi-color swatch dots */}
        <div className="flex items-center -space-x-1 ml-0.5">
          {theme.swatches.slice(0, 4).map((color, idx) => (
            <span
              key={idx}
              className="w-2.5 h-2.5 rounded-full border border-slate-900 shadow-sm"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 p-2.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl z-50 space-y-1.5 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Color Themes & Palettes</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
              {availableThemes.length} Schemes
            </span>
          </div>

          <div className="space-y-1 pt-1 max-h-80 overflow-y-auto pr-1">
            {availableThemes.map((t) => {
              const isSelected = t.id === themeId;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setThemeId(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all text-left group ${
                    isSelected
                      ? 'bg-gradient-to-r from-slate-800 to-slate-800/90 text-white font-medium border border-slate-700 shadow-sm'
                      : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {/* Swatches pill */}
                    <div className="flex items-center -space-x-1 shrink-0 p-1 rounded-full bg-slate-950/80 border border-slate-800">
                      {t.swatches.map((color, i) => (
                        <span
                          key={i}
                          className="w-2.5 h-2.5 rounded-full border border-slate-950"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-100">{t.name}</span>
                        {t.id === 'multicolor' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-gradient-to-r from-pink-500/20 to-cyan-500/20 text-pink-300 border border-pink-500/30">
                            Rainbow
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{t.description}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center shrink-0 ml-2">
                      <Check className="w-3 h-3 text-pink-300" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
