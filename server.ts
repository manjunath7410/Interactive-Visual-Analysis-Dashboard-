import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Shared Gemini client utility on the server with User-Agent header
let geminiClientInstance: GoogleGenAI | null = null;
let lastApiKey: string | undefined = undefined;

const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;

  if (!geminiClientInstance || lastApiKey !== apiKey) {
    geminiClientInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    lastApiKey = apiKey;
  }
  return geminiClientInstance;
};

// Async timeout helper to prevent socket hanging
const withTimeout = <T>(promise: Promise<T>, timeoutMs = 25000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request to AI service timed out after 25s')), timeoutMs)
    ),
  ]);
};

// Resilient content generation with automatic retry for transient 503 capacity spikes
const generateWithModelFallback = async (
  ai: GoogleGenAI,
  contents: string,
  systemInstruction: string,
  temperature = 0.3
): Promise<string> => {
  const maxRetries = 2;
  let lastErr: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 800ms
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            temperature,
            systemInstruction,
          },
        }),
        25000
      );
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastErr = err;
      const is503 = err?.message?.includes('503') || err?.status === 503;
      if (is503 && attempt < maxRetries) {
        console.warn(`Gemini 3.8 Flash temporary 503 capacity spike, retrying (attempt ${attempt + 1}/${maxRetries})...`);
        continue;
      }
      break;
    }
  }

  throw lastErr || new Error('AI model failed to generate content');
};

// API: Check AI service health
app.get('/api/gemini/health', (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    available: hasKey,
    model: 'gemini-3.8-flash',
  });
});

// API: Generate executive dataset insights
app.post('/api/gemini/insights', async (req: Request, res: Response) => {
  try {
    const { datasetSummary, topCorrelations, distributions, userGoal, readingStyle = 'simple' } = req.body || {};
    if (!datasetSummary || typeof datasetSummary !== 'object') {
      return res.status(400).json({ error: 'Valid datasetSummary object is required.' });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Falling back to local heuristic analysis.',
        fallback: true,
      });
    }

    const styleInstructions =
      readingStyle === 'simple'
        ? `MODE: SIMPLE & HIGH-IMPACT (GOOGLE EXECUTIVE STANDARD)
- DO NOT WRITE DENSE, COMPLEX PARAGRAPHS OR ESSAYS.
- Translate every statistical concept into crystal-clear plain English that anyone can grasp in 15 seconds.
- Instead of saying "Pearson r = 0.84 indicates bivariate colinearity", say "Strong Growth Driver: When X increases, Y climbs predictably by ~84%".
- Every discovery must be a concise, scannable bullet point with bold metrics.`
        : readingStyle === 'deep-dive'
        ? `MODE: DEEP STATISTICAL ANALYSIS
- Provide thorough multivariate observations, correlation coefficients, variance spreads, and outlier thresholds.
- Still maintain clean bullet points and bold highlights—no rambling unbroken walls of text.`
        : `MODE: STRATEGIC BUSINESS BRIEFING
- Balanced executive perspective focused on revenue drivers, operational efficiency, and risk containment.
- Use crisp bullet points and bold quantitative highlights.`;

    const prompt = `You are a Principal Data Scientist & Senior Strategy Lead at Google.
Analyze this structured dataset and provide a high-clarity executive analytical briefing.

${styleInstructions}

Dataset Profile:
${JSON.stringify(datasetSummary, null, 2)}

Key Statistical Correlations:
${JSON.stringify(topCorrelations || [], null, 2)}

Column Distributions & Outliers:
${JSON.stringify(distributions || [], null, 2)}

${userGoal ? `Specific User Focus: ${String(userGoal).slice(0, 500)}` : ''}

CRITICAL STRUCTURE REQUIREMENTS (Format exactly with these Markdown headings):
### ⚡ Executive TL;DR
(1-2 punchy sentences summarizing the core health and primary story of this dataset. Zero fluff.)

### 🎯 Key Discoveries
(3-4 bullet points. Each bullet MUST start with a bold label like "- **Leading Revenue Driver:** ...", followed by clear numbers, shares, or percentages.)

### ⚠️ Risks & Anomalies
(2-3 bullet points identifying outliers, missing values, or volatility risks with bold metric highlights.)

### 🚀 Actionable Recommendations
(3 concrete, numbered strategic steps. E.g. "1. **Double Down on Segment X:** ...")

CRITICAL: Keep sentences short, impactful, and easy to read. Strictly avoid multi-sentence academic paragraphs.`;

    const insightText = await generateWithModelFallback(
      ai,
      prompt,
      'You are a Google Senior Executive Analytics Advisor. You communicate with ultimate clarity: scannable bullet points, bold key metrics, zero rambling paragraphs, and intuitive plain English.',
      0.25
    );

    res.json({
      success: true,
      insightText: insightText || 'Analysis completed.',
    });
  } catch (error: any) {
    console.error('Gemini Insights Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate AI insights from dataset',
    });
  }
});

// API: Conversational Analytics Assistant ("Ask your data anything")
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { message, chatHistory, datasetContext, simplifyMode = true } = req.body || {};
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Valid message query is required.' });
    }

    const sanitizedQuery = message.trim().slice(0, 2000);
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured.',
        fallback: true,
      });
    }

    const prompt = `You are InsightFlow AI, an intelligent, ultra-clear data assistant designed like Google's top BI tools.

Dataset Context:
- Dataset Name: ${datasetContext?.name || 'Uploaded Dataset'}
- Total Rows: ${datasetContext?.totalRows || 0}
- Total Columns: ${datasetContext?.totalColumns || 0}
- Columns: ${Array.isArray(datasetContext?.columnNames) ? datasetContext.columnNames.join(', ') : 'None'}
- Metrics Summary: ${JSON.stringify(datasetContext?.summary || {}, null, 2)}
- Top Categories: ${JSON.stringify(datasetContext?.topCategories || {}, null, 2)}
- Correlation Highlights: ${JSON.stringify(datasetContext?.correlations || [], null, 2)}

Previous Conversation:
${Array.isArray(chatHistory) ? chatHistory.slice(-6).map((c: any) => `${c.role === 'user' ? 'User' : 'Assistant'}: ${c.text}`).join('\n') : ''}

User Query:
${sanitizedQuery}

STRICT GOOGLE SENIOR WORKER FORMATTING RULES:
1. NEVER output a wall of text or long rambling paragraphs.
2. Structure your answer in 3 quick parts:
   - **Direct Answer**: 1 single crisp sentence directly addressing the user's question.
   - **Key Numbers & Evidence**: 2 to 4 bullet points with bold highlights (e.g. "- **Top Segment:** Region West generates **$420k (42%)**...").
   - **Next Action / Takeaway**: 1 short sentence indicating what to investigate or do next.
3. If technical terms like correlation or standard deviation are mentioned, explain them in simple plain English (e.g. "strong positive relationship" instead of raw statistical jargon).`;

    const reply = await generateWithModelFallback(
      ai,
      prompt,
      'You are InsightFlow AI, a clear, friendly, and highly structured Google BI advisor. You always answer using scannable bullets, bold metrics, and simple plain English.',
      0.3
    );

    res.json({
      success: true,
      reply: reply || 'No response generated.',
    });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to process AI query',
    });
  }
});

// Setup Vite middleware in dev or static files in production
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InsightFlow Analytics server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
