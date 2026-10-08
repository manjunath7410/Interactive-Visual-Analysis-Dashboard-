// Comprehensive, realistic multi-dimensional demo datasets

export interface SampleDatasetConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  recordCount: number;
  generateData: () => { rows: Record<string, any>[]; headers: string[] };
}

// 1. SaaS Enterprise Operations & Revenue (Flagship Demo)
export const generateSaaSDataset = () => {
  const regions = ['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East'];
  const products = ['Cloud Infrastructure', 'AI Workspace', 'Security Suite', 'DevOps Automate', 'Enterprise CRM'];
  const tiers = ['Enterprise Plus', 'Mid-Market', 'Growth Tier', 'Startup Pro'];
  const channels = ['Direct Sales', 'Partner Referral', 'Self-Serve', 'Event Inbound'];

  const rows: Record<string, any>[] = [];
  const startDate = new Date('2024-01-01');

  for (let i = 0; i < 360; i++) {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + Math.floor(i * 1.5));
    const dateStr = curDate.toISOString().split('T')[0];

    const region = regions[i % regions.length];
    const product = products[(i * 3 + Math.floor(i / 5)) % products.length];
    const tier = tiers[(i * 2) % tiers.length];
    const channel = channels[i % channels.length];

    // Base value based on tier and product
    const tierMultiplier = tier === 'Enterprise Plus' ? 4.5 : tier === 'Mid-Market' ? 2.2 : 1.0;
    const prodMultiplier = product.includes('AI') ? 1.6 : product.includes('Cloud') ? 1.4 : 1.0;
    const seasonTrend = 1 + (i / 360) * 0.45; // upward growth trend

    // Add controlled variance and occasional outlier
    const isOutlier = i === 42 || i === 185 || i === 312;
    const outlierFactor = isOutlier ? 3.8 : 1.0;

    const baseRevenue = (1800 + Math.sin(i * 0.2) * 500 + Math.random() * 800) * tierMultiplier * prodMultiplier * seasonTrend * outlierFactor;
    const revenue = Math.round(baseRevenue);
    const units = Math.max(1, Math.round((revenue / 1200) + Math.random() * 5));
    const profitMargin = Math.min(68, Math.max(18, Math.round(38 + Math.cos(i * 0.15) * 12 + Math.random() * 10)));
    const churnRisk = Math.min(28, Math.max(1.2, Number((4.5 + (isOutlier ? 12 : 0) + (100 - profitMargin) * 0.1 + Math.random() * 2).toFixed(1))));
    const npsScore = Math.min(10, Math.max(6, Math.round(7.8 + Math.sin(i * 0.1) * 1.5 + (profitMargin > 40 ? 0.8 : -0.5))));
    const resolutionHours = Math.round(14 + Math.random() * 24 - (tier === 'Enterprise Plus' ? 6 : 0));

    rows.push({
      'Transaction Date': dateStr,
      'Region': region,
      'Product Line': product,
      'Customer Tier': tier,
      'Acquisition Channel': channel,
      'Net Revenue ($)': revenue,
      'Units Contracted': units,
      'Profit Margin (%)': profitMargin,
      'Churn Risk (%)': churnRisk,
      'NPS Rating': npsScore,
      'Support SLA (Hours)': resolutionHours,
    });
  }

  const headers = [
    'Transaction Date',
    'Region',
    'Product Line',
    'Customer Tier',
    'Acquisition Channel',
    'Net Revenue ($)',
    'Units Contracted',
    'Profit Margin (%)',
    'Churn Risk (%)',
    'NPS Rating',
    'Support SLA (Hours)',
  ];

  return { rows, headers };
};

// 2. Global E-Commerce & Retail Performance
export const generateRetailDataset = () => {
  const categories = ['Electronics & Audio', 'Smart Home & IoT', 'Apparel & Footwear', 'Office & Productivity', 'Health & Fitness'];
  const countries = ['United States', 'Germany', 'Japan', 'United Kingdom', 'Canada', 'Australia'];
  const fulfillment = ['Express 2-Day', 'Standard Freight', 'Same-Day Local', 'Priority Air'];

  const rows: Record<string, any>[] = [];
  const startDate = new Date('2024-03-01');

  for (let i = 0; i < 280; i++) {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + i);
    const dateStr = curDate.toISOString().split('T')[0];

    const category = categories[i % categories.length];
    const country = countries[(i * 2 + 1) % countries.length];
    const method = fulfillment[i % fulfillment.length];

    const discountRate = Math.round(Math.random() * 25);
    const orderValue = Math.round((120 + Math.random() * 450 + (category === 'Electronics & Audio' ? 300 : 0)) * (1 - discountRate / 100));
    const itemsCount = Math.max(1, Math.round(1 + Math.random() * 6));
    const returnRate = Number((2.1 + (discountRate > 15 ? 4.2 : 0) + Math.random() * 3).toFixed(1));
    const customerReview = Number((4.1 + (method.includes('Express') ? 0.6 : -0.2) + Math.random() * 0.3).toFixed(1));

    rows.push({
      'Order Date': dateStr,
      'Product Category': category,
      'Destination Market': country,
      'Fulfillment Method': method,
      'Order Value ($)': orderValue,
      'Items Ordered': itemsCount,
      'Discount Applied (%)': discountRate,
      'Return Rate (%)': returnRate,
      'Customer Review (1-5)': Math.min(5.0, customerReview),
    });
  }

  const headers = [
    'Order Date',
    'Product Category',
    'Destination Market',
    'Fulfillment Method',
    'Order Value ($)',
    'Items Ordered',
    'Discount Applied (%)',
    'Return Rate (%)',
    'Customer Review (1-5)',
  ];

  return { rows, headers };
};

// 3. High-Volume Big Data Benchmark (10,000+ Records)
export const generateLargeScaleDataset = () => {
  const regions = ['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East', 'Global Cloud'];
  const segments = ['Enterprise Core', 'Hyper-Scale', 'Mid-Market Pro', 'Developer Self-Serve', 'Public Sector'];
  const systems = ['API Gateway', 'Real-Time Vector DB', 'Microservice Mesh', 'Streaming Pipeline', 'Identity Auth'];
  const statuses = ['Success', 'Degraded', 'Cached', 'Rate-Limited'];

  const rows: Record<string, any>[] = [];
  const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

  for (let i = 0; i < 10000; i++) {
    const timestamp = new Date(baseTime + i * 3600000).toISOString().split('T')[0];
    const region = regions[i % regions.length];
    const segment = segments[(i * 3) % segments.length];
    const system = systems[(i * 2 + Math.floor(i / 7)) % systems.length];
    const status = statuses[i % 137 === 0 ? 3 : i % 29 === 0 ? 1 : 0];

    const isSpike = i % 181 === 0;
    const latencyMs = Number((12 + Math.sin(i * 0.05) * 8 + Math.random() * 15 + (isSpike ? 240 : 0)).toFixed(1));
    const throughputRps = Math.round(1500 + Math.cos(i * 0.03) * 600 + Math.random() * 800 + (segment === 'Hyper-Scale' ? 1200 : 0));
    const payloadKb = Number((4.5 + Math.random() * 12 + (system.includes('Vector') ? 18 : 0)).toFixed(1));
    const costDollars = Number(((throughputRps * 0.0028) + (payloadKb * 0.012) + (isSpike ? 15 : 0)).toFixed(2));
    const errorRatePercent = Number((status === 'Success' ? Math.random() * 0.4 : status === 'Rate-Limited' ? 8.5 : 3.2).toFixed(2));

    rows.push({
      'Log Date': timestamp,
      'Region': region,
      'System Tier': segment,
      'Architecture Service': system,
      'Execution Status': status,
      'Latency (ms)': latencyMs,
      'Throughput (RPS)': throughputRps,
      'Payload (KB)': payloadKb,
      'Resource Cost ($)': costDollars,
      'Error Rate (%)': errorRatePercent,
    });
  }

  const headers = [
    'Log Date',
    'Region',
    'System Tier',
    'Architecture Service',
    'Execution Status',
    'Latency (ms)',
    'Throughput (RPS)',
    'Payload (KB)',
    'Resource Cost ($)',
    'Error Rate (%)',
  ];

  return { rows, headers };
};

// Available demo datasets
export const SAMPLE_DATASETS: SampleDatasetConfig[] = [
  {
    id: 'saas-ops',
    name: 'Enterprise Cloud & SaaS Operations',
    category: 'B2B Software',
    description: '360 multi-regional enterprise transactions with Revenue, Churn Risk, Profit Margin, SLA, and NPS satisfaction metrics.',
    recordCount: 360,
    generateData: generateSaaSDataset,
  },
  {
    id: 'retail-omnichannel',
    name: 'Global E-Commerce & Retail Performance',
    category: 'Retail & Consumer',
    description: '280 cross-border consumer orders with Category breakdown, Order Values, Discounts, Return Rates, and Delivery speeds.',
    recordCount: 280,
    generateData: generateRetailDataset,
  },
  {
    id: 'large-scale-benchmark',
    name: 'High-Volume Big Data Benchmark (10,000 Records)',
    category: 'Big Data / High Volume',
    description: '10,000 cloud infrastructure transactions testing sub-second vector throughput, latency distributions, and multivariate analysis.',
    recordCount: 10000,
    generateData: generateLargeScaleDataset,
  },
];
