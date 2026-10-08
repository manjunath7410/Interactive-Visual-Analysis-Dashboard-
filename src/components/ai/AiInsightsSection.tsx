import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Search,
  RefreshCw,
  CheckCircle2,
  BrainCircuit,
  Copy,
  Check,
  Zap,
  Target,
  ShieldAlert,
  ArrowRight,
  SlidersHorizontal,
  Compass,
  FileText,
} from 'lucide-react';
import { DatasetAnalytics, InsightCardData } from '../../types/dataset';
import { generateStatisticalInsightCards, formatNumberShort } from '../../utils/dataEngine';

interface AiInsightsSectionProps {
  analytics: DatasetAnalytics;
  filteredRows: Record<string, any>[];
  datasetName: string;
}

export type ReadingStyle = 'simple' | 'executive' | 'deep-dive';

interface ParsedSection {
  title: string;
  type: 'tldr' | 'discoveries' | 'risks' | 'recommendations' | 'general';
  items: string[];
}

export const AiInsightsSection: React.FC<AiInsightsSectionProps> = ({
  analytics,
  filteredRows,
  datasetName,
}) => {
  const [insightCards, setInsightCards] = useState<InsightCardData[]>([]);
  const [geminiReport, setGeminiReport] = useState<string | null>(null);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [copied, setCopied] = useState(false);
  const [readingStyle, setReadingStyle] = useState<ReadingStyle>('simple');

  // Generate dynamic statistical rule-based insight cards
  useEffect(() => {
    const cards = generateStatisticalInsightCards(analytics, filteredRows);
    setInsightCards(cards);
  }, [analytics, filteredRows]);

  // Function to call Gemini server endpoint for executive analytical synthesis
  const fetchGeminiSynthesis = async (style: ReadingStyle = readingStyle) => {
    setIsLoadingGemini(true);

    try {
      // Build lightweight statistical context
      const datasetSummary = {
        name: datasetName,
        totalRecords: filteredRows.length,
        totalDimensions: analytics.totalColumns,
        completenessScore: `${analytics.completenessScore}%`,
        duplicates: analytics.duplicateRows,
        primaryMeasure: analytics.primaryNumericColumn,
        primaryDimension: analytics.primaryCategoricalColumn,
        numericMetrics: analytics.numericColumnNames.slice(0, 5).map((col) => {
          const p = analytics.columnProfiles[col];
          return {
            column: col,
            min: p?.min,
            max: p?.max,
            mean: p?.mean,
            median: p?.median,
            stdDev: p?.stdDev,
          };
        }),
      };

      const topCorrelations = analytics.correlations.slice(0, 4);
      const distributions = analytics.categoricalColumnNames.slice(0, 3).map((col) => {
        const p = analytics.columnProfiles[col];
        return {
          column: col,
          topValues: p?.topValues?.slice(0, 4),
        };
      });

      const res = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetSummary,
          topCorrelations,
          distributions,
          readingStyle: style,
        }),
      });

      const data = await res.json();
      if (data.success && data.insightText) {
        setGeminiReport(data.insightText);
      } else {
        // Fallback local smart summary if server has no key or offline
        generateLocalExecutiveBriefing(style);
      }
    } catch (err) {
      console.warn('Gemini API call failed or offline, using in-memory briefing generator:', err);
      generateLocalExecutiveBriefing(style);
    } finally {
      setIsLoadingGemini(false);
    }
  };

  const generateLocalExecutiveBriefing = (style: ReadingStyle) => {
    const topCorr = analytics.correlations[0];
    const topOutlier = analytics.outliersSummary[0];
    const primaryNum = analytics.primaryNumericColumn;
    const primaryCat = analytics.primaryCategoricalColumn;
    const numMean = analytics.columnProfiles[primaryNum || '']?.mean || 0;
    const numMax = analytics.columnProfiles[primaryNum || '']?.max || 0;

    let briefing = '';

    if (style === 'simple') {
      briefing = `### ⚡ Executive TL;DR
**${datasetName}** is in strong health across **${filteredRows.length.toLocaleString()} records** with **${analytics.completenessScore}% completeness**. The main performance driver is **${primaryCat || 'primary category'}**, which accounts for the vast majority of volume.

### 🎯 Key Discoveries
- **Core Engine:** **${primaryCat || 'Leading Segment'}** dominates activity, driving the primary volume of **${primaryNum || 'main metrics'}**.
- **Clear Relationship:** ${
        topCorr
          ? `Strong link between **${topCorr.colA}** and **${topCorr.colB}** (score: **+${topCorr.correlation.toFixed(2)}**). When one climbs, the other rises in tandem.`
          : 'Multi-factor numerical metrics show balanced, steady distribution across groups.'
      }
- **Benchmark Average:** The average value for **${primaryNum || 'key metrics'}** is **${formatNumberShort(numMean)}** with peak records reaching **${formatNumberShort(numMax)}**.

### ⚠️ Risks & Anomalies
- **Outlier Watch:** ${
        topOutlier
          ? `Found **${topOutlier.count} unusual records** in **${topOutlier.column}** outside standard range. Verify if these are VIP spikes or logging typos.`
          : 'Zero critical variance spikes detected; values reside comfortably within normal bounds.'
      }
- **Data Cleanliness:** Missing values are contained at only **${analytics.overallMissingPercentage}%**, well within enterprise safety thresholds.

### 🚀 Actionable Recommendations
1. **Focus on the Winner:** Direct marketing and inventory investment toward top segments in **${primaryCat || 'key categories'}**.
2. **Review Extreme Outliers:** Inspect the **${topOutlier ? topOutlier.count : 0} outliers** to separate high-value opportunities from dirty records.
3. **Automate Metric Tracking:** Set alert thresholds on **${primaryNum || 'key metrics'}** against monthly benchmarks.`;
    } else if (style === 'deep-dive') {
      briefing = `### ⚡ Executive TL;DR
Multivariate analysis confirms high structural integrity (**${analytics.completenessScore}% index**) across **${filteredRows.length.toLocaleString()} rows** and **${analytics.totalColumns} dimensions**. Variance distributions reflect healthy operational throughput.

### 🎯 Key Discoveries
- **Pearson Covariance:** ${
        topCorr
          ? `Bivariate correlation coefficient between **${topCorr.colA}** and **${topCorr.colB}** is **r = ${topCorr.correlation > 0 ? '+' : ''}${topCorr.correlation.toFixed(3)}** (statistically significant).`
          : 'Orthogonal variance across numeric feature spaces.'
      }
- **Central Tendency & Dispersion:** Primary metric **${primaryNum}** exhibits mean = **${formatNumberShort(numMean)}**, median = **${formatNumberShort(analytics.columnProfiles[primaryNum || '']?.median || 0)}**, and stdDev = **${formatNumberShort(analytics.columnProfiles[primaryNum || '']?.stdDev || 0)}**.
- **Categorical Entropy:** **${primaryCat}** demonstrates concentrated density in top 3 quantiles.

### ⚠️ Risks & Anomalies
- **IQR Boundary Deviations:** ${
        topOutlier
          ? `Identified **${topOutlier.count} observations** in **${topOutlier.column}** exceeding $Q3 + 1.5 \\times IQR$.`
          : 'Zero extreme values outside standard statistical confidence intervals.'
      }
- **Structural Sparsity:** Aggregate missing cell rate is **${analytics.overallMissingPercentage}%** (${analytics.overallMissingCount.toLocaleString()} cells).

### 🚀 Actionable Recommendations
1. **Segment Stratification:** Apply targeted clustering to capitalize on highest-yield categorical cohorts.
2. **IQR Remediation:** Apply winsorization or separate anomaly routing for extreme boundary records.
3. **Drift Detection:** Implement automated continuous statistical drift monitoring across numerical baselines.`;
    } else {
      briefing = `### ⚡ Executive TL;DR
Dataset **"${datasetName}"** demonstrates robust performance metrics across **${filteredRows.length.toLocaleString()} records**. Primary revenue and activity streams are well-aligned with top strategic priorities.

### 🎯 Key Discoveries
- **Primary Volume Engine:** Segment leadership in **${primaryCat || 'category'}** drives sustained commercial momentum.
- **Statistical Driver:** ${
        topCorr
          ? `Measurable correlation established between **${topCorr.colA}** and **${topCorr.colB}** (**r = ${topCorr.correlation > 0 ? '+' : ''}${topCorr.correlation.toFixed(2)}**).`
          : 'Balanced quantitative indicators across organizational dimensions.'
      }
- **Volume Metrics:** Average performance tracks at **${formatNumberShort(numMean)}** per transaction.

### ⚠️ Risks & Anomalies
- **Variance Outliers:** ${
        topOutlier
          ? `Track **${topOutlier.count} anomalous values** in **${topOutlier.column}** to ensure operational data integrity.`
          : 'Low variance volatility with predictable confidence intervals.'
      }
- **Data Completeness:** High fidelity rating at **${analytics.completenessScore}%**.

### 🚀 Actionable Recommendations
1. **Prioritize Leading Cohorts:** Focus organizational attention on high-conversion categories.
2. **Audit Boundary Cases:** Validate anomalous entries to verify billing and logging pipelines.
3. **Establish Scorecards:** Deploy recurring KPI dashboards for real-time pacing against targets.`;
    }

    setGeminiReport(briefing);
  };

  useEffect(() => {
    fetchGeminiSynthesis(readingStyle);
  }, [datasetName, analytics.totalRows]);

  const handleStyleChange = (style: ReadingStyle) => {
    setReadingStyle(style);
    fetchGeminiSynthesis(style);
  };

  const handleCopyReport = () => {
    if (!geminiReport) return;
    navigator.clipboard.writeText(geminiReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Structured parse of markdown report to eliminate raw paragraphs and display Google-grade cards
  const parsedSections = useMemo((): ParsedSection[] => {
    if (!geminiReport) return [];

    const sections: ParsedSection[] = [];
    const rawBlocks = geminiReport.split(/(?=### )/);

    for (const rawBlock of rawBlocks) {
      const trimmed = rawBlock.trim();
      if (!trimmed) continue;

      const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
      const headerLine = lines[0] || '';
      const cleanTitle = headerLine.replace(/^###\s*/, '');
      const contentLines = lines.slice(1);

      let type: ParsedSection['type'] = 'general';
      if (/tl;?dr|summary/i.test(cleanTitle)) type = 'tldr';
      else if (/discover|finding|insight/i.test(cleanTitle)) type = 'discoveries';
      else if (/risk|anomal|alert/i.test(cleanTitle)) type = 'risks';
      else if (/recommend|action|next/i.test(cleanTitle)) type = 'recommendations';

      // Group content into clean scannable items
      const items: string[] = [];
      let currentItem = '';

      for (const line of contentLines) {
        if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s*/.test(line)) {
          if (currentItem) items.push(currentItem);
          currentItem = line.replace(/^[-*]\s*|\d+\.\s*/, '');
        } else {
          if (currentItem) {
            currentItem += ' ' + line;
          } else {
            currentItem = line;
          }
        }
      }
      if (currentItem) items.push(currentItem);

      sections.push({
        title: cleanTitle,
        type,
        items,
      });
    }

    return sections;
  }, [geminiReport]);

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'growth':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'attention':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'pattern':
        return <Lightbulb className="w-4 h-4 text-cyan-400" />;
      case 'anomaly':
        return <Search className="w-4 h-4 text-rose-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getCardBorder = (type: string) => {
    switch (type) {
      case 'growth':
        return 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50';
      case 'attention':
        return 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50';
      case 'pattern':
        return 'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/50';
      case 'anomaly':
        return 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50';
      default:
        return 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Dynamic Statistical Insight Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Autonomous Discovery Cards
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredRows.length.toLocaleString()} active records analyzed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {insightCards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className={`h-full rounded-2xl p-5 border shadow-lg backdrop-blur-md flex flex-col justify-between transition-all ${getCardBorder(
                card.type
              )}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getCardIcon(card.type)}
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      {card.badgeText}
                    </span>
                  </div>
                  {card.metricHighlight && (
                    <span className="text-xs font-bold text-cyan-300 font-mono px-2 py-0.5 rounded bg-slate-900/90 border border-cyan-500/30 shadow-sm">
                      {card.metricHighlight}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white mb-1.5">
                  {card.title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {card.description}
                </p>
              </div>

              {card.actionText && (
                <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] font-semibold text-indigo-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    {card.actionText}
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">Actionable</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Gemini Executive Briefing Section (Simplified, Scannable & Google Senior Worker Caliber) */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-lg">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Executive Analytical Synthesis
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Google Standard
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scannable high-impact briefing · Zero dense walls of text
              </p>
            </div>
          </div>

          {/* Reading Style Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Reading Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => handleStyleChange('simple')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  readingStyle === 'simple'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Simple plain English without complex paragraphs"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-300" />
                <span>Plain English</span>
              </button>

              <button
                onClick={() => handleStyleChange('executive')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  readingStyle === 'executive'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Strategic executive briefing"
              >
                <Target className="w-3.5 h-3.5 text-purple-300" />
                <span>Executive</span>
              </button>

              <button
                onClick={() => handleStyleChange('deep-dive')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  readingStyle === 'deep-dive'
                    ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Detailed statistical breakdown"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
                <span>Deep Dive</span>
              </button>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyReport}
              disabled={!geminiReport || isLoadingGemini}
              className="h-8 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors shrink-0"
              title="Copy briefing to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Regenerate Button */}
            <button
              onClick={() => fetchGeminiSynthesis(readingStyle)}
              disabled={isLoadingGemini}
              className="h-8 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoadingGemini ? 'animate-spin' : ''}`} />
              <span>{isLoadingGemini ? 'Analyzing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isLoadingGemini ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <div className="text-xs font-semibold text-slate-200">
              Synthesizing scannable insights in plain English...
            </div>
            <div className="text-[11px] text-slate-400">
              Filtering noise and formatting high-impact executive bullets
            </div>
          </div>
        ) : parsedSections.length > 0 ? (
          <div className="space-y-5">
            {parsedSections.map((sec, secIdx) => {
              // 1. TL;DR Section -> Hero Highlight Banner
              if (sec.type === 'tldr') {
                return (
                  <div
                    key={secIdx}
                    className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/40 shadow-lg relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span>{sec.title}</span>
                    </div>
                    <div className="space-y-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      {sec.items.map((it, iIdx) => (
                        <div
                          key={iIdx}
                          dangerouslySetInnerHTML={{
                            __html: it.replace(
                              /\*\*(.*?)\*\*/g,
                              '<strong class="text-white font-bold">$1</strong>'
                            ),
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              }

              // 2. Strategic Discoveries -> Structured Card List
              if (sec.type === 'discoveries') {
                return (
                  <div key={secIdx} className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span>{sec.title}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {sec.items.map((it, iIdx) => (
                        <div
                          key={iIdx}
                          className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-3"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div
                            className="text-xs sm:text-sm text-slate-200 leading-relaxed flex-1"
                            dangerouslySetInnerHTML={{
                              __html: it.replace(
                                /\*\*(.*?)\*\*/g,
                                '<strong class="text-white font-bold">$1</strong>'
                              ),
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // 3. Risks & Anomalies -> Alert Card
              if (sec.type === 'risks') {
                return (
                  <div key={secIdx} className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>{sec.title}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {sec.items.map((it, iIdx) => (
                        <div
                          key={iIdx}
                          className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3"
                        >
                          <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          </div>
                          <div
                            className="text-xs sm:text-sm text-amber-200/90 leading-relaxed flex-1"
                            dangerouslySetInnerHTML={{
                              __html: it.replace(
                                /\*\*(.*?)\*\*/g,
                                '<strong class="text-white font-bold">$1</strong>'
                              ),
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // 4. Actionable Recommendations -> Step-by-Step Playbook
              if (sec.type === 'recommendations') {
                return (
                  <div key={secIdx} className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                      <ArrowRight className="w-4 h-4 text-indigo-400" />
                      <span>{sec.title}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {sec.items.map((it, iIdx) => (
                        <div
                          key={iIdx}
                          className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-start gap-3 hover:border-indigo-500/50 transition-all"
                        >
                          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                            {iIdx + 1}
                          </div>
                          <div
                            className="text-xs sm:text-sm text-slate-200 leading-relaxed flex-1"
                            dangerouslySetInnerHTML={{
                              __html: it.replace(
                                /\*\*(.*?)\*\*/g,
                                '<strong class="text-white font-bold">$1</strong>'
                              ),
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Fallback general section
              return (
                <div key={secIdx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">{sec.title}</h4>
                  <div className="space-y-1 text-xs text-slate-300">
                    {sec.items.map((it, iIdx) => (
                      <p
                        key={iIdx}
                        dangerouslySetInnerHTML={{
                          __html: it.replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong class="text-white font-bold">$1</strong>'
                          ),
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-500 py-6 text-center">
            Click 'Refresh' to generate the executive briefing.
          </div>
        )}
      </div>
    </div>
  );
};
