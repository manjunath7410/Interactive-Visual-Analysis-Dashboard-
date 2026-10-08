import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  ColumnProfile,
  ColumnType,
  CorrelationPair,
  DatasetAnalytics,
  FilterState,
  InsightCardData,
} from '../types/dataset';

// Infer column type based on sample values
export const inferColumnType = (values: any[]): ColumnType => {
  const nonNullValues = values.filter(
    (v) => v !== null && v !== undefined && String(v).trim() !== ''
  );
  if (nonNullValues.length === 0) return 'string';

  let numCount = 0;
  let dateCount = 0;
  let boolCount = 0;

  for (const v of nonNullValues.slice(0, 100)) {
    const str = String(v).trim().toLowerCase();

    // Boolean check
    if (str === 'true' || str === 'false' || str === 'yes' || str === 'no') {
      boolCount++;
      continue;
    }

    // Number check (strip currency signs and commas like $1,234.50)
    const cleanedNum = str.replace(/[$€£,]/g, '').trim();
    if (!isNaN(Number(cleanedNum)) && cleanedNum !== '') {
      numCount++;
      continue;
    }

    // Date check (look for common date patterns)
    if (
      (str.includes('-') || str.includes('/') || str.includes('T')) &&
      !isNaN(Date.parse(str)) &&
      str.length >= 6
    ) {
      dateCount++;
      continue;
    }
  }

  const sampleSize = Math.min(nonNullValues.length, 100);
  if (numCount / sampleSize > 0.75) return 'number';
  if (dateCount / sampleSize > 0.75) return 'date';
  if (boolCount / sampleSize > 0.75) return 'boolean';
  return 'string';
};

// Clean and convert values according to inferred column type
export const normalizeRowValue = (val: any, type: ColumnType): any => {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (str === '' || str.toLowerCase() === 'na' || str.toLowerCase() === 'null') return null;

  if (type === 'number') {
    const cleaned = str.replace(/[$€£,%]/g, '').replace(/,/g, '').trim();
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }
  if (type === 'date') {
    const d = new Date(str);
    return isNaN(d.getTime()) ? str : d.toISOString().split('T')[0];
  }
  if (type === 'boolean') {
    const s = str.toLowerCase();
    return s === 'true' || s === 'yes' || s === '1';
  }
  return str;
};

// Calculate statistical summary for numeric values
export const calculateNumericStats = (values: number[]) => {
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      sum: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      outliersCount: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / n;

  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Quartiles
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  // Variance & Standard Deviation
  const variance =
    sorted.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (n > 1 ? n - 1 : 1);
  const stdDev = Math.sqrt(variance);

  // Outliers by 1.5 * IQR rule
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = sorted.filter((v) => v < lowerBound || v > upperBound);

  return {
    min: sorted[0],
    max: sorted[n - 1],
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    sum: Number(sum.toFixed(2)),
    q1: Number(q1.toFixed(2)),
    q3: Number(q3.toFixed(2)),
    iqr: Number(iqr.toFixed(2)),
    outliersCount: outliers.length,
  };
};

// Calculate Pearson Correlation between two numerical columns
export const calculatePearsonCorrelation = (
  xValues: number[],
  yValues: number[]
): number => {
  const n = Math.min(xValues.length, yValues.length);
  if (n < 3) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const x = xValues[i];
    const y = yValues[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  const r = numerator / denominator;
  return Number(Math.max(-1, Math.min(1, r)).toFixed(3));
};

// Comprehensive dataset profiling engine
export const analyzeDataset = (
  rows: Record<string, any>[],
  headers: string[]
): DatasetAnalytics => {
  const totalRows = rows.length;
  const totalColumns = headers.length;

  if (totalRows === 0 || totalColumns === 0) {
    return {
      totalRows: 0,
      totalColumns: 0,
      duplicateRows: 0,
      overallMissingCount: 0,
      overallMissingPercentage: 0,
      completenessScore: 100,
      memorySizeEstimateKb: 0,
      columnProfiles: {},
      numericColumnNames: [],
      categoricalColumnNames: [],
      dateColumnNames: [],
      correlations: [],
      outliersSummary: [],
    };
  }

  // 1. Column Types
  const columnTypes: Record<string, ColumnType> = {};
  for (const h of headers) {
    const sampleVals = rows.map((r) => r[h]);
    columnTypes[h] = inferColumnType(sampleVals);
  }

  // 2. Duplicate Detection (Fast Fingerprint Hashing, Sampled for large datasets N > 20,000)
  const maxDupCheckRows = Math.min(rows.length, 25000);
  const rowHash = new Set<string>();
  let sampleDuplicates = 0;
  const hashCols = headers.slice(0, 8); // Fast 8-dimension fingerprint

  for (let i = 0; i < maxDupCheckRows; i++) {
    const r = rows[i];
    let key = '';
    for (let c = 0; c < hashCols.length; c++) {
      key += r[hashCols[c]] + '~';
    }
    if (rowHash.has(key)) {
      sampleDuplicates++;
    } else {
      rowHash.add(key);
    }
  }
  const duplicateRows = rows.length > 25000
    ? Math.round((sampleDuplicates / maxDupCheckRows) * rows.length)
    : sampleDuplicates;

  // 3. Profiles per column
  const columnProfiles: Record<string, ColumnProfile> = {};
  let totalMissingCells = 0;
  const numericCols: string[] = [];
  const categoricalCols: string[] = [];
  const dateCols: string[] = [];

  for (const h of headers) {
    const type = columnTypes[h];
    let missingCount = 0;
    const cleanVals: any[] = [];

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const normalized = normalizeRowValue(rows[rIdx][h], type);
      if (normalized === null) {
        missingCount++;
      } else {
        cleanVals.push(normalized);
      }
    }

    totalMissingCells += missingCount;
    const missingPercentage = Number(((missingCount / totalRows) * 100).toFixed(1));
    const uniqueValues = new Set(cleanVals);
    const uniqueCount = uniqueValues.size;

    const profile: ColumnProfile = {
      name: h,
      type,
      missingCount,
      missingPercentage,
      uniqueCount,
    };

    if (type === 'number') {
      numericCols.push(h);
      const numVals = cleanVals as number[];
      const stats = calculateNumericStats(numVals);
      Object.assign(profile, stats);

      // Generate a mini 12-point sparkline for visual aesthetics
      if (numVals.length > 0) {
        const step = Math.max(1, Math.floor(numVals.length / 12));
        const sparkline: number[] = [];
        for (let i = 0; i < numVals.length; i += step) {
          sparkline.push(numVals[i]);
          if (sparkline.length >= 12) break;
        }
        profile.sampleSparkline = sparkline;
      }
    } else if (type === 'date') {
      dateCols.push(h);
    } else {
      categoricalCols.push(h);
      // Value counts
      const counts: Record<string, number> = {};
      for (const val of cleanVals) {
        const key = String(val);
        counts[key] = (counts[key] || 0) + 1;
      }
      const sortedCounts = Object.entries(counts)
        .map(([value, count]) => ({
          value,
          count,
          percentage: Number(((count / cleanVals.length) * 100).toFixed(1)),
        }))
        .sort((a, b) => b.count - a.count);

      profile.topValues = sortedCounts.slice(0, 8);
      profile.mode = sortedCounts[0]?.value;
    }

    columnProfiles[h] = profile;
  }

  // 4. Correlations between numeric columns (Adaptive Sampling for N > 5,000 for sub-second analysis)
  const correlations: CorrelationPair[] = [];
  const correlationStep = Math.max(1, Math.floor(rows.length / 5000));
  const maxNumericColsToCorrelate = Math.min(numericCols.length, 12); // Correlate top 12 numeric features

  for (let i = 0; i < maxNumericColsToCorrelate; i++) {
    for (let j = i + 1; j < maxNumericColsToCorrelate; j++) {
      const colA = numericCols[i];
      const colB = numericCols[j];
      const pairs: [number, number][] = [];

      for (let rIdx = 0; rIdx < rows.length; rIdx += correlationStep) {
        const r = rows[rIdx];
        const valA = normalizeRowValue(r[colA], 'number');
        const valB = normalizeRowValue(r[colB], 'number');
        if (valA !== null && valB !== null) {
          pairs.push([valA, valB]);
        }
      }

      if (pairs.length >= 5) {
        const r = calculatePearsonCorrelation(
          pairs.map((p) => p[0]),
          pairs.map((p) => p[1])
        );
        correlations.push({ colA, colB, correlation: r });
      }
    }
  }

  // Sort correlations by absolute strength
  correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  // 5. Outliers summary
  const outliersSummary = numericCols
    .map((col) => {
      const prof = columnProfiles[col];
      const q1 = prof.q1 || 0;
      const q3 = prof.q3 || 0;
      const iqr = prof.iqr || 0;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;

      const indices: number[] = [];
      const outlierStep = Math.max(1, Math.floor(rows.length / 30000));
      for (let idx = 0; idx < rows.length; idx += outlierStep) {
        const v = normalizeRowValue(rows[idx][col], 'number');
        if (v !== null && (v < lower || v > upper)) {
          indices.push(idx);
          if (indices.length >= 500) break; // Keep manageable memory bound
        }
      }

      return {
        column: col,
        count: outlierStep > 1 ? indices.length * outlierStep : indices.length,
        indices,
      };
    })
    .filter((o) => o.count > 0);

  // 6. Primary Column Selection for Initial Charts
  // Prioritize financial or key measure column names for primary numeric
  const primaryNumericKeywords = ['revenue', 'sales', 'profit', 'amount', 'total', 'price', 'value', 'gmv', 'cost'];
  let primaryNumeric = numericCols.find((c) =>
    primaryNumericKeywords.some((kw) => c.toLowerCase().includes(kw))
  );
  if (!primaryNumeric && numericCols.length > 0) {
    primaryNumeric = numericCols[0];
  }

  // Prioritize category or dimension column
  const primaryCatKeywords = ['category', 'region', 'segment', 'type', 'status', 'tier', 'country', 'department'];
  let primaryCategorical = categoricalCols.find((c) =>
    primaryCatKeywords.some((kw) => c.toLowerCase().includes(kw))
  );
  if (!primaryCategorical && categoricalCols.length > 0) {
    // pick one with good cardinality (2-12 unique items)
    primaryCategorical =
      categoricalCols.find(
        (c) => columnProfiles[c].uniqueCount >= 2 && columnProfiles[c].uniqueCount <= 15
      ) || categoricalCols[0];
  }

  // Date column
  const primaryDateKeywords = ['date', 'time', 'timestamp', 'day', 'month', 'year', 'period'];
  let primaryDate = dateCols.find((c) =>
    primaryDateKeywords.some((kw) => c.toLowerCase().includes(kw))
  );
  if (!primaryDate && dateCols.length > 0) {
    primaryDate = dateCols[0];
  }

  const totalCells = totalRows * totalColumns;
  const overallMissingPercentage = Number(
    ((totalMissingCells / (totalCells || 1)) * 100).toFixed(1)
  );
  const completenessScore = Number((100 - overallMissingPercentage).toFixed(1));
  const memorySizeEstimateKb = Number(
    ((JSON.stringify(rows).length * 2) / 1024).toFixed(1)
  );

  return {
    totalRows,
    totalColumns,
    duplicateRows,
    overallMissingCount: totalMissingCells,
    overallMissingPercentage,
    completenessScore,
    memorySizeEstimateKb,
    columnProfiles,
    numericColumnNames: numericCols,
    categoricalColumnNames: categoricalCols,
    dateColumnNames: dateCols,
    primaryNumericColumn: primaryNumeric,
    primaryCategoricalColumn: primaryCategorical,
    primaryDateColumn: primaryDate,
    correlations,
    outliersSummary,
  };
};

// Filter rows based on live FilterState
export const applyFilters = (
  rows: Record<string, any>[],
  filters: FilterState,
  analytics: DatasetAnalytics
): Record<string, any>[] => {
  const query = filters.searchQuery.trim().toLowerCase();

  return rows.filter((row, rowIndex) => {
    // 1. Text Search across all columns
    if (query) {
      let matched = false;
      for (const key of Object.keys(row)) {
        const val = row[key];
        if (val !== null && val !== undefined && String(val).toLowerCase().includes(query)) {
          matched = true;
          break;
        }
      }
      if (!matched) return false;
    }

    // 2. Outliers-only toggle
    if (filters.onlyOutliers) {
      const isOutlier = analytics.outliersSummary.some((o) =>
        o.indices.includes(rowIndex)
      );
      if (!isOutlier) return false;
    }

    // 3. Categorical Filters
    for (const [col, selectedVals] of Object.entries(filters.categoryFilters)) {
      if (!selectedVals || selectedVals.length === 0) continue;
      const rowVal = String(row[col] ?? '');
      if (!selectedVals.includes(rowVal)) {
        return false;
      }
    }

    // 4. Numeric Range Filters
    for (const [col, [minVal, maxVal]] of Object.entries(filters.numericRanges)) {
      const v = normalizeRowValue(row[col], 'number');
      if (v === null) continue; // let missing pass or filter? usually keep or filter if strictly in range
      if (v < minVal || v > maxVal) {
        return false;
      }
    }

    // 5. Date Range Filter
    if (filters.dateRange && analytics.primaryDateColumn) {
      const [startStr, endStr] = filters.dateRange;
      if (startStr || endStr) {
        const rowDateStr = normalizeRowValue(row[analytics.primaryDateColumn], 'date');
        if (rowDateStr) {
          if (startStr && rowDateStr < startStr) return false;
          if (endStr && rowDateStr > endStr) return false;
        }
      }
    }

    return true;
  });
};

// Generate high-confidence dynamic statistical insight cards
export const generateStatisticalInsightCards = (
  analytics: DatasetAnalytics,
  rows: Record<string, any>[]
): InsightCardData[] => {
  const cards: InsightCardData[] = [];

  // Card 1: Primary Metric & Top Contributor (Growth Opportunity)
  if (analytics.primaryNumericColumn && analytics.primaryCategoricalColumn) {
    const numCol = analytics.primaryNumericColumn;
    const catCol = analytics.primaryCategoricalColumn;

    // aggregate by category
    const catSums: Record<string, number> = {};
    let totalSum = 0;
    for (const r of rows) {
      const val = normalizeRowValue(r[numCol], 'number') || 0;
      const cat = String(r[catCol] || 'Uncategorized');
      catSums[cat] = (catSums[cat] || 0) + val;
      totalSum += val;
    }

    const sortedCats = Object.entries(catSums).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0 && totalSum > 0) {
      const [topCat, topVal] = sortedCats[0];
      const share = ((topVal / totalSum) * 100).toFixed(1);
      cards.push({
        id: 'growth-1',
        type: 'growth',
        title: `Dominant Driver: ${topCat}`,
        description: `"${topCat}" generates ${share}% of total ${numCol} across the analyzed dataset (${formatNumberShort(topVal)} out of ${formatNumberShort(totalSum)}).`,
        metricHighlight: `${share}% of ${numCol}`,
        badgeText: 'Growth Driver',
        actionText: 'Filter by this segment',
      });
    }
  }

  // Card 2: Strongest Correlation (Key Pattern)
  if (analytics.correlations.length > 0) {
    const topCorr = analytics.correlations[0];
    const strength = Math.abs(topCorr.correlation);
    if (strength >= 0.4) {
      const direction = topCorr.correlation > 0 ? 'positive' : 'inverse';
      const adjective = strength > 0.7 ? 'Strong' : 'Moderate';
      cards.push({
        id: 'pattern-1',
        type: 'pattern',
        title: `${adjective} Relationship: ${topCorr.colA} & ${topCorr.colB}`,
        description: `Statistical Pearson correlation coefficient is r = ${topCorr.correlation.toFixed(2)}, indicating a notable ${direction} co-movement between these indicators.`,
        metricHighlight: `r = ${topCorr.correlation > 0 ? '+' : ''}${topCorr.correlation.toFixed(2)}`,
        badgeText: 'Statistical Pattern',
      });
    }
  }

  // Card 3: Outlier & Variance Alert (Anomaly)
  if (analytics.outliersSummary.length > 0) {
    const topOutlier = analytics.outliersSummary.sort((a, b) => b.count - a.count)[0];
    cards.push({
      id: 'anomaly-1',
      type: 'anomaly',
      title: `Statistical Outliers in ${topOutlier.column}`,
      description: `Detected ${topOutlier.count} records exceeding 1.5× interquartile range (IQR). Review high-deviation transactions or extremes.`,
      metricHighlight: `${topOutlier.count} Outliers`,
      badgeText: 'Anomaly Detection',
      actionText: 'View Outliers',
    });
  }

  // Card 4: Quality & Integrity (Attention or Health)
  if (analytics.overallMissingPercentage > 2) {
    cards.push({
      id: 'attention-1',
      type: 'attention',
      title: `Data Missingness Alert (${analytics.overallMissingPercentage}%)`,
      description: `Found ${analytics.overallMissingCount.toLocaleString()} unpopulated values. Consider imputation or filtering out incomplete records for predictive modeling.`,
      metricHighlight: `${analytics.completenessScore}% Completeness`,
      badgeText: 'Data Quality Attention',
    });
  } else {
    cards.push({
      id: 'pattern-2',
      type: 'pattern',
      title: `High Data Fidelity: ${analytics.completenessScore}%`,
      description: `Clean dataset structure with ${analytics.duplicateRows === 0 ? 'zero duplicate rows' : `${analytics.duplicateRows} duplicates`} and minimal missingness across ${analytics.totalColumns} dimensions.`,
      metricHighlight: `${analytics.totalRows.toLocaleString()} Valid Records`,
      badgeText: 'Health Index',
    });
  }

  return cards;
};

// Parse CSV file content
export const parseCsvFile = async (
  file: File
): Promise<{ rows: Record<string, any>[]; headers: string[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          reject(new Error('The uploaded CSV file is empty.'));
          return;
        }
        const headers = results.meta.fields || Object.keys(results.data[0] || {});
        // Filter out empty headers
        const validHeaders = headers.filter((h) => h && h.trim().length > 0);
        resolve({
          rows: results.data as Record<string, any>[],
          headers: validHeaders,
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
};

// Parse Excel (.xlsx, .xls) file content
export const parseExcelFile = async (
  file: File
): Promise<{ rows: Record<string, any>[]; headers: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', dense: true, cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('No worksheets found in this Excel workbook.'));
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        if (!json || json.length === 0) {
          reject(new Error('The worksheet contains no data.'));
          return;
        }
        const headers = Object.keys(json[0] as object).filter((h) => h && h.trim().length > 0);
        resolve({
          rows: json as Record<string, any>[],
          headers,
        });
      } catch (err: any) {
        reject(new Error(`Failed to read Excel file: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('File reading failed.'));
    reader.readAsArrayBuffer(file);
  });
};

// Clean number formatting for KPIs
export const formatNumberShort = (num: number): string => {
  if (num === 0) return '0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}k`;
  }
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
};

// Format currency or metric with label
export const formatMetricDisplay = (val: number, colName = ''): string => {
  const name = colName.toLowerCase();
  const formatted = formatNumberShort(val);
  if (name.includes('revenue') || name.includes('sales') || name.includes('price') || name.includes('cost') || name.includes('amount') || name.includes('gmv')) {
    return `$${formatted}`;
  }
  if (name.includes('percent') || name.includes('rate') || name.includes('margin') || name.includes('share') || name.includes('churn')) {
    return `${val.toFixed(1)}%`;
  }
  return formatted;
};

// Safe algebraic expression evaluator for calculated metrics / columns
export const evaluateCalculatedFormula = (
  formula: string,
  row: Record<string, any>
): number | null => {
  try {
    if (!formula.trim()) return null;

    // Replace [Column Name] with numeric values from row
    let parsedExpr = formula.replace(/\[([^\]]+)\]/g, (_, colName) => {
      const rawVal = row[colName];
      const numVal = normalizeRowValue(rawVal, 'number');
      return numVal !== null && !isNaN(numVal) ? String(numVal) : '0';
    });

    // Sanitization: Allow only numbers, operators, parentheses, decimal dots, and math functions
    if (/[^0-9+\-*/().\s^%Math.sqrtabsminmaxpow]/.test(parsedExpr)) {
      return null;
    }

    // Replace '^' with exponentiation
    parsedExpr = parsedExpr.replace(/\^/g, '**');

    // Safe Function evaluation
    const fn = new Function(`return (${parsedExpr});`);
    const result = Number(fn());
    return isNaN(result) || !isFinite(result) ? null : Number(result.toFixed(4));
  } catch {
    return null;
  }
};

// Add calculated column across all rows
export const addCalculatedColumn = (
  rows: Record<string, any>[],
  columnName: string,
  formula: string
): { updatedRows: Record<string, any>[]; success: boolean; error?: string } => {
  if (!columnName.trim()) {
    return { updatedRows: rows, success: false, error: 'Column name cannot be empty.' };
  }
  if (!formula.trim()) {
    return { updatedRows: rows, success: false, error: 'Formula cannot be empty.' };
  }

  // Test formula on first row
  const testSample = rows[0] || {};
  const testResult = evaluateCalculatedFormula(formula, testSample);
  if (testResult === null && rows.length > 0) {
    return {
      updatedRows: rows,
      success: false,
      error: 'Invalid formula syntax. Ensure referenced columns match [ColumnName] format.',
    };
  }

  const updatedRows = rows.map((r) => {
    const calculatedVal = evaluateCalculatedFormula(formula, r);
    return {
      ...r,
      [columnName.trim()]: calculatedVal !== null ? calculatedVal : 0,
    };
  });

  return { updatedRows, success: true };
};

// Natural Language to Filter Query Parser (Text-to-Filter AST)
export const parseNaturalLanguageQuery = (
  query: string,
  analytics: DatasetAnalytics
): Partial<FilterState> | null => {
  if (!query.trim()) return null;

  const q = query.trim().toLowerCase();
  const partialFilters: Partial<FilterState> = {
    categoryFilters: {},
    numericRanges: {},
  };

  let matchedAny = false;

  // 1. Check for outlier intent
  if (q.includes('outlier') || q.includes('anomal')) {
    partialFilters.onlyOutliers = true;
    matchedAny = true;
  }

  // 2. Check numeric comparison: e.g. "revenue > 50000", "margin <= 20", "cost >= 1000"
  for (const numCol of analytics.numericColumnNames) {
    const colLower = numCol.toLowerCase();
    const regexGreater = new RegExp(`${colLower}\\s*(?:>|>=|greater than|above|over)\\s*([$€£]?[0-9,.]+[kmb]?)`, 'i');
    const regexLess = new RegExp(`${colLower}\\s*(?:<|<=|less than|under|below)\\s*([$€£]?[0-9,.]+[kmb]?)`, 'i');

    const matchG = q.match(regexGreater);
    const matchL = q.match(regexLess);

    const parseUnitNum = (str: string): number => {
      let clean = str.replace(/[$€£,]/g, '').trim().toLowerCase();
      let mult = 1;
      if (clean.endsWith('k')) { mult = 1_000; clean = clean.slice(0, -1); }
      else if (clean.endsWith('m')) { mult = 1_000_000; clean = clean.slice(0, -1); }
      else if (clean.endsWith('b')) { mult = 1_000_000_000; clean = clean.slice(0, -1); }
      return (Number(clean) || 0) * mult;
    };

    if (matchG || matchL) {
      const prof = analytics.columnProfiles[numCol];
      let minVal = prof?.min ?? 0;
      let maxVal = prof?.max ?? 1_000_000;

      if (matchG && matchG[1]) {
        minVal = parseUnitNum(matchG[1]);
        matchedAny = true;
      }
      if (matchL && matchL[1]) {
        maxVal = parseUnitNum(matchL[1]);
        matchedAny = true;
      }

      if (!partialFilters.numericRanges) partialFilters.numericRanges = {};
      partialFilters.numericRanges[numCol] = [minVal, maxVal];
    }
  }

  // 3. Check categorical mentions: e.g. "region: EMEA", "status is Active"
  for (const catCol of analytics.categoricalColumnNames) {
    const prof = analytics.columnProfiles[catCol];
    if (!prof || !prof.topValues) continue;

    for (const item of prof.topValues) {
      const valLower = String(item.value).toLowerCase();
      if (valLower.length >= 2 && q.includes(valLower)) {
        if (!partialFilters.categoryFilters) partialFilters.categoryFilters = {};
        if (!partialFilters.categoryFilters[catCol]) {
          partialFilters.categoryFilters[catCol] = [];
        }
        if (!partialFilters.categoryFilters[catCol].includes(item.value)) {
          partialFilters.categoryFilters[catCol].push(item.value);
          matchedAny = true;
        }
      }
    }
  }

  return matchedAny ? partialFilters : null;
};

// Multivariate Anomaly Scorer (Standard Euclidean/Z-Score Centroid Distance)
export const calculateMultivariateAnomalies = (
  rows: Record<string, any>[],
  numericCols: string[]
): { indices: number[]; scores: number[] } => {
  if (rows.length < 5 || numericCols.length < 2) {
    return { indices: [], scores: [] };
  }

  const validCols = numericCols.slice(0, 6); // Up to 6 dimensions
  const stats = validCols.map((c) => {
    const vals = rows.map((r) => Number(r[c]) || 0);
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length || 1);
    const stdDev = Math.sqrt(variance) || 1;
    return { col: c, mean, stdDev };
  });

  const scores = rows.map((r) => {
    let sumSqZ = 0;
    for (const s of stats) {
      const v = Number(r[s.col]) || 0;
      const z = (v - s.mean) / s.stdDev;
      sumSqZ += z * z;
    }
    return Math.sqrt(sumSqZ / stats.length);
  });

  // Flag observations with composite Z-score > 2.5
  const anomalyIndices: number[] = [];
  scores.forEach((score, idx) => {
    if (score > 2.5) {
      anomalyIndices.push(idx);
    }
  });

  return { indices: anomalyIndices, scores };
};
