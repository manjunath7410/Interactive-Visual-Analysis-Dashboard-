import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
  Loader2,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  Copy,
  Check,
  Zap,
  Target,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { ChatMessage, DatasetAnalytics } from '../../types/dataset';
import { formatNumberShort, formatMetricDisplay } from '../../utils/dataEngine';

interface AiDataAssistantProps {
  analytics: DatasetAnalytics;
  filteredRows: Record<string, any>[];
  datasetName: string;
}

const SUGGESTED_PROMPTS = [
  '⚡ Explain this dataset in simple English',
  '🎯 Give me 3 key takeaways',
  '📈 What is the strongest growth driver?',
  '⚠️ Are there risky outliers?',
  '🔍 Which category performs best?',
  '🚀 What should I do next?',
];

export const AiDataAssistant: React.FC<AiDataAssistantProps> = ({
  analytics,
  filteredRows,
  datasetName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I'm your **InsightFlow AI Advisor**. I have synthesized **${filteredRows.length.toLocaleString()} records** and **${analytics.totalColumns} dimensions** from **${datasetName}**.\n\n* **Quick status:** Data completeness is high at **${analytics.completenessScore}%**.\n* **Primary focus:** **${analytics.primaryNumericColumn || 'Key Metrics'}** segmented by **${analytics.primaryCategoricalColumn || 'Categories'}**.\n\nAsk me anything in plain English, and I will give you clear, bulleted answers!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAi: true,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [simpleMode, setSimpleMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Build lightweight dataset context
      const datasetContext = {
        name: datasetName,
        totalRows: filteredRows.length,
        totalColumns: analytics.totalColumns,
        columnNames: Object.keys(analytics.columnProfiles),
        summary: {
          primaryNumeric: analytics.primaryNumericColumn,
          primaryCategory: analytics.primaryCategoricalColumn,
          completeness: `${analytics.completenessScore}%`,
          missingCount: analytics.overallMissingCount,
        },
        topCategories: analytics.categoricalColumnNames.slice(0, 3).reduce((acc, col) => {
          acc[col] = analytics.columnProfiles[col]?.topValues?.slice(0, 4);
          return acc;
        }, {} as any),
        correlations: analytics.correlations.slice(0, 5),
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          chatHistory: messages.slice(-6),
          datasetContext,
          simplifyMode: simpleMode,
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: true,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        // Fallback intelligent response generator with Google-standard clarity
        generateLocalResponse(query);
      }
    } catch (err) {
      console.warn('Gemini chat API error, answering with local analytics reasoning:', err);
      generateLocalResponse(query);
    } finally {
      setIsTyping(false);
    }
  };

  const generateLocalResponse = (query: string) => {
    const q = query.toLowerCase();
    let reply = '';

    const topCorr = analytics.correlations[0];
    const topOutlier = analytics.outliersSummary[0];
    const primaryNum = analytics.primaryNumericColumn;
    const primaryCat = analytics.primaryCategoricalColumn;
    const meanVal = analytics.columnProfiles[primaryNum || '']?.mean || 0;
    const maxVal = analytics.columnProfiles[primaryNum || '']?.max || 0;

    if (q.includes('simple') || q.includes('plain english') || q.includes('explain')) {
      reply = `**Here is the plain English breakdown of ${datasetName}:**\n\n* **What this is:** A clean collection of **${filteredRows.length.toLocaleString()} records** with **${analytics.completenessScore}% completeness**.\n* **The big story:** Activity is heavily concentrated in **${primaryCat || 'the top segment'}**, which is generating the majority of **${primaryNum || 'results'}**.\n* **Key link:** ${
        topCorr
          ? `When **${topCorr.colA}** goes up, **${topCorr.colB}** goes up reliably.`
          : 'Numbers are evenly distributed across categories.'
      }\n\n**Takeaway:** Focus your attention on the top 20% of segments driving 80% of volume.`;
    } else if (q.includes('trend') || q.includes('time') || q.includes('velocity') || q.includes('growth')) {
      reply = `**Growth & Trajectory Insights:**\n\n* **Average Metric:** Average **${primaryNum || 'metric'}** is **${formatNumberShort(
        meanVal
      )}** per record.\n* **Peak Ceiling:** Top record reaches **${formatNumberShort(
        maxVal
      )}**.\n* **Pacing:** Upward trajectory is strongest among leading categorical cohorts.\n\n**Next Action:** Filter by recent dates in the overview tab to verify if momentum is accelerating.`;
    } else if (q.includes('category') || q.includes('segment') || q.includes('perform') || q.includes('winner')) {
      const topCatProf = primaryCat ? analytics.columnProfiles[primaryCat] : null;
      const topVal = topCatProf?.topValues?.[0];
      reply = topVal
        ? `**Top Performing Segment:**\n\n* **Category Leader:** **"${topVal.value}"** is #1 in **${primaryCat}**.\n* **Market Share:** Represents **${topVal.percentage}%** of all rows (${topVal.count.toLocaleString()} occurrences).\n* **Impact:** Generates the bulk of overall **${primaryNum || 'volume'}**.\n\n**Next Action:** Double-click this category in the bar chart to isolate its records.`
        : `Categorical analysis across ${analytics.categoricalColumnNames.join(', ')} shows healthy distribution without single-point dependency.`;
    } else if (q.includes('outlier') || q.includes('unusual') || q.includes('anomaly') || q.includes('risk')) {
      reply = topOutlier
        ? `**Risk & Anomaly Scan:**\n\n* **Anomalies Detected:** Found **${topOutlier.count} outliers** in **${topOutlier.column}** exceeding 1.5× the normal spread.\n* **Missing Data:** Contained at **${analytics.overallMissingPercentage}%**.\n\n**Takeaway:** Check the Scatter Plot or Explorer tab to verify whether these are legitimate high-value transactions or data entry bugs.`
        : `**Clean Health Check:** Zero severe anomalies detected. All active values fall safely within expected bounds.`;
    } else if (q.includes('takeaway') || q.includes('next') || q.includes('recommend') || q.includes('action')) {
      reply = `**Top 3 Actionable Takeaways:**\n\n1. **Focus on Champions:** Invest resources in **${primaryCat || 'top segments'}** where conversion is highest.\n2. **Check Correlation Driver:** Review the relationship between **${topCorr?.colA || 'primary metric'}** and **${topCorr?.colB || 'secondary metric'}**.\n3. **Audit Outliers:** Review the **${topOutlier ? topOutlier.count : 0} unusual records** before presenting to leadership.`;
    } else {
      reply = `**Executive Summary for ${datasetName}:**\n\n* **Dataset Scale:** **${filteredRows.length.toLocaleString()} rows** across **${analytics.totalColumns} dimensions**.\n* **Key Average:** **${primaryNum || 'Metric'}** averages **${formatNumberShort(meanVal)}**.\n* **Data Integrity:** **${analytics.completenessScore}%** rating.\n\nWould you like me to identify top drivers or analyze a specific category?`;
    }

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAi: true,
    };
    setMessages((prev) => [...prev, aiMsg]);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        text: 'Chat history cleared. What would you like to explore next in your data?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAi: true,
      },
    ]);
  };

  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl backdrop-blur-md flex flex-col h-[650px] overflow-hidden">
      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              InsightFlow Assistant
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                Plain English
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Clear, bulleted answers · Zero dense paragraphs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimpleMode(!simpleMode)}
            className={`h-7 px-2.5 rounded-lg border text-[11px] font-medium transition-colors flex items-center gap-1 ${
              simpleMode
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle simplified plain-English answers"
          >
            <Zap className="w-3 h-3" />
            <span>Simple</span>
          </button>

          <button
            onClick={handleClearChat}
            title="Clear conversation"
            className="h-7 inline-flex items-center gap-1 px-2.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick Query Chips */}
      <div className="px-3.5 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Prompts:
        </span>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            disabled={isTyping}
            className="h-6 inline-flex items-center text-[11px] shrink-0 px-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-cyan-400 border border-slate-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed relative group ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-md'
                    : 'bg-slate-950/90 border border-slate-800/90 text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                {/* Render Assistant Message with Scannable Formatting */}
                <div className="space-y-1.5">
                  {msg.text.split('\n\n').map((paragraph, pIdx) => {
                    // Check if it's a bullet list
                    if (paragraph.includes('\n* ') || paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
                      const bullets = paragraph.split(/\n(?=[*-] )/).map(b => b.replace(/^[*-] /, '').trim());
                      return (
                        <div key={pIdx} className="space-y-1.5 my-1.5">
                          {bullets.map((b, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2 text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                              <div
                                className="flex-1"
                                dangerouslySetInnerHTML={{
                                  __html: b.replace(
                                    /\*\*(.*?)\*\*/g,
                                    '<strong class="text-white font-bold">$1</strong>'
                                  ),
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // Check if it's a numbered list
                    if (/^\d+\.\s*/.test(paragraph)) {
                      const numbered = paragraph.split(/\n(?=\d+\.\s*)/).map(n => n.replace(/^\d+\.\s*/, '').trim());
                      return (
                        <div key={pIdx} className="space-y-1.5 my-1.5">
                          {numbered.map((item, nIdx) => (
                            <div key={nIdx} className="flex items-start gap-2 text-slate-300">
                              <span className="w-4 h-4 rounded bg-cyan-500/20 text-cyan-300 font-bold font-mono text-[10px] inline-flex items-center justify-center shrink-0 mt-0.5">
                                {nIdx + 1}
                              </span>
                              <div
                                className="flex-1"
                                dangerouslySetInnerHTML={{
                                  __html: item.replace(
                                    /\*\*(.*?)\*\*/g,
                                    '<strong class="text-white font-bold">$1</strong>'
                                  ),
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // Standard crisp paragraph
                    return (
                      <div
                        key={pIdx}
                        dangerouslySetInnerHTML={{
                          __html: paragraph.replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong class="text-white font-bold">$1</strong>'
                          ),
                        }}
                      />
                    );
                  })}
                </div>

                {/* Footer Bar with Timestamp & 1-Click Copy */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/40 text-[10px] text-slate-400">
                  <span>{msg.timestamp}</span>

                  {!isUser && (
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-white"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-xs text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-medium">Formulating plain English bullets...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask in plain English (e.g. 'What is the top driver?')..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            className="flex-1 h-10 bg-slate-900 border border-slate-800 rounded-xl px-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shrink-0"
          >
            {isTyping ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Send className="w-4 h-4 shrink-0" />}
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
