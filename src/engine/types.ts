export interface NewsItem {
  id: string;
  content: string;
  title?: string;
  source?: string;
}

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface SentimentResult {
  label: SentimentLabel;
  score: number;
  confidence: number;
  positiveWords: string[];
  negativeWords: string[];
}

export type KeywordCategory = 'company' | 'industry' | 'indicator' | 'other';

export interface KeywordItem {
  word: string;
  count: number;
  category: KeywordCategory;
}

export interface SummaryResult {
  sentences: string[];
  keywords: string[];
}

export interface AnalysisResult {
  newsId: string;
  news: NewsItem;
  sentiment: SentimentResult;
  keywords: KeywordItem[];
  summary: SummaryResult;
}

export interface EngineStatus {
  isLoaded: boolean;
  isLoading: boolean;
  loadProgress: number;
  loadError?: string;
  engineType: 'rule' | 'transformer';
}

export interface IAnalysisEngine {
  status: EngineStatus;
  load(progressCallback?: (progress: number) => void): Promise<void>;
  analyze(news: NewsItem[]): Promise<AnalysisResult[]>;
}

export interface AggregatedStats {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  averageScore: number;
  topKeywords: KeywordItem[];
}
