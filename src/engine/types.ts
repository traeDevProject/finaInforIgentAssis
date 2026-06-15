export interface NewsItem {
  id: string;
  content: string;
  title?: string;
  source?: string;
}

export type SentimentLabel =
  | 'strongly_negative'
  | 'negative'
  | 'neutral'
  | 'positive'
  | 'strongly_positive';

export interface SentimentResult {
  label: SentimentLabel;
  score: number;
  confidence: number;
  positiveWords: string[];
  negativeWords: string[];
  detail: {
    positiveScore: number;
    negativeScore: number;
    degree: number;
  };
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
  favorite: boolean;
  analyzedAt: number;
}

export interface EngineStatus {
  isLoaded: boolean;
  isLoading: boolean;
  loadProgress: number;
  loadError?: string;
  engineType: 'rule';
}

export interface AggregatedStats {
  total: number;
  strongly_negative: number;
  negative: number;
  neutral: number;
  positive: number;
  strongly_positive: number;
  averageScore: number;
  topKeywords: KeywordItem[];
}

export interface HistoryRecord {
  id: string;
  createdAt: number;
  name: string;
  newsCount: number;
  results: AnalysisResult[];
  stats: AggregatedStats;
}

export interface CustomDictEntry {
  word: string;
  type: 'positive' | 'negative' | 'negation' | 'degree';
  weight: number;
  category?: string;
  createdAt: number;
}

export interface BackupData {
  version: string;
  exportedAt: number;
  history: HistoryRecord[];
  dictionary: CustomDictEntry[];
  favorites: string[];
}
