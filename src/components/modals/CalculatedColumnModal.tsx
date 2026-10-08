import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calculator,
  Plus,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Hash,
  ArrowRight,
  Code,
} from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { evaluateCalculatedFormula, addCalculatedColumn } from '../../utils/dataEngine';
import { soundFx } from '../../utils/audioFx';

interface CalculatedColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: DatasetAnalytics;
  rawRows: Record<string, any>[];
  onApplyCalculatedColumn: (newRows: Record<string, any>[], newColName: string) => void;
}

export const CalculatedColumnModal: React.FC<CalculatedColumnModalProps> = ({
  isOpen,
  onClose,
  analytics,
  rawRows,
  onApplyCalculatedColumn,
}) => {
  const [columnName, setColumnName] = useState('');
  const [formula, setFormula] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Insert column token into formula
  const handleInsertColumn = (col: string) => {
    soundFx.playTick();
    setFormula((prev) => `${prev}[${col}]`);
  };

  // Insert operator
  const handleInsertOperator = (op: string) => {
    soundFx.playTick();
    setFormula((prev) => `${prev} ${op} `);
  };

  // Live test preview on sample row
  const sampleRow = rawRows[0] || {};
  const testSampleResult = formula.trim() ? evaluateCalculatedFormula(formula, sampleRow) : null;

  const handleSave = () => {
    if (!columnName.trim()) {
      setErrorMsg('Please specify a valid column name.');
      return;
    }
    if (!formula.trim()) {
      setErrorMsg('Please enter a mathematical formula.');
      return;
    }

    const res = addCalculatedColumn(rawRows, columnName, formula);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to evaluate formula across dataset.');
      return;
    }

    soundFx.playChime();
    onApplyCalculatedColumn(res.updatedRows, columnName.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Calculated Column & Metric Builder
              </h3>
              <p className="text-xs text-slate-400">
                Define custom calculated features using column algebraic formulas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Column Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              New Calculated Column Name
            </label>
            <input
              type="text"
              value={columnName}
              onChange={(e) => {
                setColumnName(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="e.g. Gross Margin %, Total Value, Adjusted Score"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Formula Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Mathematical Formula Expression
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Wrap columns in brackets: [Column]
              </span>
            </div>
            <textarea
              value={formula}
              onChange={(e) => {
                setFormula(e.target.value);
                setErrorMsg(null);
              }}
              rows={3}
              placeholder="e.g. ([Revenue] - [Cost]) / [Revenue] * 100"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-cyan-300 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Quick Insert Column Chips */}
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 font-mono block mb-1.5">
              Click to Insert Column:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {analytics.numericColumnNames.map((col) => (
                <button
                  key={col}
                  onClick={() => handleInsertColumn(col)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono inline-flex items-center gap-1 transition-colors"
                >
                  <Hash className="w-3 h-3 text-cyan-400" />
                  <span>{col}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Operators */}
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400 font-mono block mb-1.5">
              Quick Operators:
            </span>
            <div className="flex items-center gap-2">
              {['+', '-', '*', '/', '(', ')', '^'].map((op) => (
                <button
                  key={op}
                  onClick={() => handleInsertOperator(op)}
                  className="w-8 h-8 rounded-lg bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-slate-200 text-xs font-mono font-bold flex items-center justify-center transition-colors"
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Sample */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Live Sample Row Preview:</span>
            <span className="font-mono font-bold text-cyan-300">
              {testSampleResult !== null ? `${testSampleResult}` : '— (Pending formula)'}
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Calculated Metric</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
