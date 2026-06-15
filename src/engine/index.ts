import {
  NewsItem,
  AnalysisResult,
  AggregatedStats,
  EngineStatus,
  KeywordItem,
  SentimentResult
} from './types';
import { analyzeSentimentRuleBased } from './sentiment';
import {
  loadSentimentModel,
  analyzeSentimentTransformer,
  isTransformersAvailable,
  isTransformersLoading,
  getTransformersError
} from './sentiment/transformer';
import { extractKeywords } from './keywords';
import { generateSummary } from './summary';

export type EngineMode = 'rule' | 'transformer';

class AnalysisEngine {
  private _mode: EngineMode = 'rule';
  private _transformerLoaded = false;
  private _isLoading = false;
  private _loadProgress = 0;
  private _loadError?: string;

  get status(): EngineStatus {
    return {
      isLoaded: this._mode === 'rule' ? true : this._transformerLoaded,
      isLoading: this._isLoading,
      loadProgress: this._loadProgress,
      loadError: this._loadError,
      engineType: this._mode
    };
  }

  get mode(): EngineMode {
    return this._mode;
  }

  setMode(mode: EngineMode) {
    this._mode = mode;
  }

  async loadTransformer(progressCallback?: (progress: number) => void): Promise<boolean> {
    if (this._transformerLoaded) return true;
    if (this._isLoading) return false;

    this._isLoading = true;
    this._loadProgress = 0;
    this._loadError = undefined;

    try {
      const success = await loadSentimentModel((progress) => {
        this._loadProgress = progress;
        progressCallback?.(progress);
      });

      if (success) {
        this._transformerLoaded = true;
        this._mode = 'transformer';
      } else {
        this._loadError = getTransformersError() || '模型加载失败';
      }

      return success;
    } catch (error) {
      this._loadError = error instanceof Error ? error.message : '模型加载失败';
      return false;
    } finally {
      this._isLoading = false;
      if (this._transformerLoaded) {
        this._loadProgress = 100;
      }
    }
  }

  async analyze(newsList: NewsItem[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (const news of newsList) {
      const sentiment = await this.analyzeSentiment(news.content);
      const keywords = await extractKeywords(news.content);
      const summary = await generateSummary(news.content);

      results.push({
        newsId: news.id,
        news,
        sentiment,
        keywords,
        summary
      });
    }

    return results;
  }

  async analyzeWithProgress(
    newsList: NewsItem[],
    progressCallback?: (current: number, total: number) => void
  ): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (let i = 0; i < newsList.length; i++) {
      const news = newsList[i];
      const sentiment = await this.analyzeSentiment(news.content);
      const keywords = await extractKeywords(news.content);
      const summary = await generateSummary(news.content);

      results.push({
        newsId: news.id,
        news,
        sentiment,
        keywords,
        summary
      });

      progressCallback?.(i + 1, newsList.length);
    }

    return results;
  }

  private async analyzeSentiment(text: string): Promise<SentimentResult> {
    if (this._mode === 'transformer' && this._transformerLoaded) {
      try {
        return await analyzeSentimentTransformer(text);
      } catch {
        return analyzeSentimentRuleBased(text);
      }
    }

    return analyzeSentimentRuleBased(text);
  }

  isTransformerReady(): boolean {
    return this._transformerLoaded && isTransformersAvailable();
  }

  isTransformerLoading(): boolean {
    return this._isLoading || isTransformersLoading();
  }
}

export function aggregateStats(results: AnalysisResult[]): AggregatedStats {
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let totalScore = 0;

  const keywordMap = new Map<string, KeywordItem>();

  for (const result of results) {
    switch (result.sentiment.label) {
      case 'positive':
        positive++;
        break;
      case 'negative':
        negative++;
        break;
      default:
        neutral++;
    }

    totalScore += result.sentiment.score;

    for (const kw of result.keywords) {
      const existing = keywordMap.get(kw.word);
      if (existing) {
        existing.count += kw.count;
      } else {
        keywordMap.set(kw.word, { ...kw });
      }
    }
  }

  const topKeywords = Array.from(keywordMap.values())
    .sort((a, b) => {
      const categoryPriority = { company: 4, industry: 3, indicator: 2, other: 1 };
      const priorityDiff = categoryPriority[b.category] - categoryPriority[a.category];
      if (priorityDiff !== 0) return priorityDiff;
      return b.count - a.count;
    })
    .slice(0, 30);

  return {
    total: results.length,
    positive,
    neutral,
    negative,
    averageScore: results.length > 0 ? totalScore / results.length : 0,
    topKeywords
  };
}

export const engine = new AnalysisEngine();
