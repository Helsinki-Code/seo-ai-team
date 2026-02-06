
export interface KeywordMetric {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  intent: 'Informational' | 'Transactional' | 'Commercial' | 'Navigational';
  category?: string;
}

export interface CompetitorData {
  domain: string;
  rank: number;
  estimatedTraffic: number;
  domainAuthority: number;
  rankingChange: number; // + or - positions
}

export interface SerpResult {
  keyword: string;
  aiOverview: string;
  peopleAlsoAsk: string[];
  competitors: CompetitorData[];
  opportunityScore: number; // 0-100
  strategicInsight: string;
  group: string;
  timestamp: number;
}

export interface ArticleSection {
  heading: string;
  content: string;
  type: 'text' | 'list' | 'table' | 'chart' | 'image';
  visualType?: 'none' | 'chart' | 'table' | 'image';
  chartData?: any[]; // For visualizations
  imagePrompt?: string; // For generating images
  imageUrl?: string; // The generated image URL
}

export interface LinkSuggestion {
  id: string;
  anchorText: string;
  targetUrl: string;
  context: string;
  type: 'internal' | 'external';
  confidence: number;
}

export interface GeneratedArticle {
  id: string;
  keyword: string;
  title: string;
  status: 'queued' | 'researching' | 'drafting' | 'optimizing' | 'reviewing_links' | 'completed' | 'failed' | 'indexed';
  progress: number; // 0-100
  logs: string[];
  content: string; // Markdown
  mdContent: string; // Final downloadable MD
  featuredImage?: string;
  sections: ArticleSection[];
  wordCount: number;
  aiOverviewOptimized: boolean;
  linkSuggestions?: LinkSuggestion[];
  linksApplied?: boolean;
}

export interface RankHistoryPoint {
  date: string;
  rank: number;
}

export interface DomainRankInfo {
  domain: string;
  keyword: string;
  currentRank: number;
  history: RankHistoryPoint[];
}

export type AgentType = 'CRAWLER' | 'RESEARCHER' | 'ANALYST' | 'WRITER' | 'STRATEGIST' | 'DESIGNER' | 'LINK_BUILDER' | 'GA_ANALYST' | 'INDEXER';

export interface AgentTask {
  id: string;
  type: AgentType;
  name: string;
  status: 'idle' | 'working' | 'completed' | 'error';
  message: string;
  progress: number; // 0-100
  logs: string[]; // Detailed logs
  startTime: number;
  endTime?: number;
  resultPayload?: any; // Data to download (JSON string, CSV string, etc)
  resultType?: 'json' | 'csv' | 'md';
}

export interface ContentStrategy {
  clusters: { name: string; keywords: string[]; intent: string }[];
  calendar: { week: number; topic: string; type: string; bestDay: string }[];
  internalLinking: { sourceTopic: string; targetTopic: string; anchorText: string }[];
  summary: string;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  aspectRatio: string;
  createdAt: number;
}

export interface RankResult {
  keyword: string;
  rank: number | null; // Null if not found in top results
  url: string | null;
  title: string | null;
  analysis: string;
  found: boolean;
}

export interface BulkRankResponse {
  results: RankResult[];
  summary: string;
  groundingUrls: string[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface AnalyticsMetric {
  timestamp: string;
  activeUsers: number;
  sessions: number;
  bounceRate: number;
  avgDuration: number;
}

export interface PagePerformance {
  path: string;
  views: number;
  engagement: number;
  status: 'indexed' | 'crawled' | 'discovered' | 'unknown';
}
