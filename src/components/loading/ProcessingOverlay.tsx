import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2, Sparkles, Database } from 'lucide-react';

interface ProcessingOverlayProps {
  isVisible: boolean;
  onFinished?: () => void;
}

const STAGES = [
  'Reading dataset...',
  'Analyzing columns & inferring types...',
  'Calculating statistics & distributions...',
  'Building multidimensional visualizations...',
  'Preparing AI analytical insights...',
];

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  isVisible,
  onFinished,
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          if (onFinished) {
            setTimeout(onFinished, 400);
          }
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isVisible, onFinished]);

  if (!isVisible) return null;

  const progressPercentage = Math.round(
    ((currentStageIndex + 1) / STAGES.length) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center text-center"
      >
        <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="relative w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <Database className="w-7 h-7 text-indigo-400" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          Processing Dataset
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          InsightFlow analytical engine is computing full statistical profile
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ ease: 'easeInOut', duration: 0.3 }}
          />
        </div>

        {/* Stages Checklist */}
        <div className="w-full space-y-2.5 text-left mb-2">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={stage}
                className={`flex items-center gap-3 text-xs transition-colors duration-200 ${
                  isCompleted
                    ? 'text-emerald-400'
                    : isCurrent
                    ? 'text-indigo-300 font-medium'
                    : 'text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span>{stage}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
