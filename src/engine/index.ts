import {
  NewsItem,
  AnalysisResult,
  AggregatedStats,
  EngineStatus,
  KeywordItem
} from './types';
import { analyzeSentiment } from './sentiment';
import { extractKeywords } from './keywords';
import { generateSummary } from './summary';

export class AnalysisEngine {
  private _status: EngineStatus = {
    isLoaded: true,
    isLoading: false,
    loadProgress: 100,
    engineType: 'rule'
  };

  get status(): EngineStatus {
    return { ...this._status };
  }

  async load(progressCallback?: (progress: number) => void): Promise<void> {
    if (this._status.isLoaded) return;

    this._status.isLoading = true;
    this._status.loadProgress = 0;

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 50));
      this._status.loadProgress = i;
      progressCallback?.(i);
    }

    this._status.isLoaded = true;
    this._status.isLoading = false;
    this._status.loadProgress = 100;
  }

  async analyze(newsList: NewsItem[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (const news of newsList) {
      const [sentiment, keywords, summary] = await Promise.all([
        analyzeSentiment(news.content),
        extractKeywords(news.content),
        generateSummary(news.content)
      ]);

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
      const [sentiment, keywords, summary] = await Promise.all([
        analyzeSentiment(news.content),
        extractKeywords(news.content),
        generateSummary(news.content)
      ]);

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
