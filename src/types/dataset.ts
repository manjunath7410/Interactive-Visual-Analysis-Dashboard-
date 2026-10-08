export type ColumnType = 'number' | 'string' | 'date' | 'boolean';

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  // Numerical stats
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  sum?: number;
  q1?: number;
  q3?: number;
  iqr?: number;
  outliersCount?: number;
  // Categorical stats
  topValues?: { value: string; count: number; percentage: number }[];
  mode?: string;
  // Sparkline data
  sampleSparkline?: number[];
}

export interface CorrelationPair {
  colA: string;
  colB: string;
  correlation: number;
}

export interface DatasetAnalytics {
  totalRows: number;
  totalColumns: number;
  duplicateRows: number;
  overallMissingCount: number;
  overallMissingPercentage: number;
  completenessScore: number;
  memorySizeEstimateKb: number;
  columnProfiles: Record<string, ColumnProfile>;
  numericColumnNames: string[];
  categoricalColumnNames: string[];
  dateColumnNames: string[];
  primaryNumericColumn?: string;
  primaryCategoricalColumn?: string;
  primaryDateColumn?: string;
  correlations: CorrelationPair[];
  outliersSummary: {
    column: string;
    count: number;
    indices: number[];
  }[];
}

export interface FilterState {
  searchQuery: string;
  categoryFilters: Record<string, string[]>;
  numericRanges: Record<string, [number, number]>;
  dateRange?: [string, string];
  onlyOutliers?: boolean;
}

export type InsightType = 'growth' | 'attention' | 'pattern' | 'anomaly';

export interface InsightCardData {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  metricHighlight?: string;
  badgeText: string;
  actionText?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isAi?: boolean;
}

export interface DatasetFile {
  name: string;
  sizeBytes: number;
  lastModified?: number;
  rawRows: Record<string, any>[];
  headers: string[];
}
