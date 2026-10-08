import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Minimize2 } from 'lucide-react';

export interface Card3DTiltProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  glare?: boolean;
  glareOpacity?: number;
  motionTrail?: boolean;
  trailIntensity?: number;
  floating?: boolean;
  floatingDistance?: number;
  floatingDuration?: number;
  floatingDelay?: number;
  expandable?: boolean;
  explosionDuration?: number;
  onExplodeChange?: (isExploded: boolean) => void;
  showExpandButton?: boolean;
}

/**
 * Enterprise Solid Card Container
 * Eliminates perspective distortion and parallax jitter to guarantee maximum readability
 * and pixel-perfect chart interaction in compliance with Google Enterprise standards.
 */
export const Card3DTilt: React.FC<Card3DTiltProps> = ({
  children,
  className = '',
  expandable = false,
  showExpandButton = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div
        className={`relative rounded-2xl transition-all duration-200 ${className}`}
      >
        {children}

        {expandable && showExpandButton && (
          <button
            onClick={() => setIsExpanded(true)}
            className="absolute top-4 right-4 z-20 p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80 transition-colors"
            title="Expand to Fullscreen View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Fullscreen Modal View if expanded */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-6xl max-h-[90vh] overflow-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 z-30 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Exit Fullscreen"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
