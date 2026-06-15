import {
  NewsItem,
  AnalysisResult,
  AggregatedStats,
  EngineStatus,
  KeywordItem,
  SentimentResult
} from './types';
import { analyzeSentimentRuleBased } from './sentiment';
import { extractKeywords } from './keywords';
import { generateSummary } from './summary';
import { isFavorite } from '../store/appStore';

class AnalysisEngine {
  get status(): EngineStatus {
    return {
      isLoaded: true,
      isLoading: false,
      loadProgress: 100,
      engineType: 'rule'
    };
  }

  async analyze(newsList: NewsItem[]): Promise<AnalysisResult[]> {
    return this.analyzeWithProgress(newsList);
  }

  async analyzeWithProgress(
    newsList: NewsItem[],
    progressCallback?: (current: number, total: number) => void
  ): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    const now = Date.now();

    for (let i = 0; i < newsList.length; i++) {
      const news = newsList[i];
      const sentiment = analyzeSentimentRuleBased(news.content);
      const keywords = await extractKeywords(news.content);
      const summary = await generateSummary(news.content);

      results.push({
        newsId: news.id,
        news,
        sentiment,
        keywords,
        summary,
        favorite: isFavorite(news.id),
        analyzedAt: now
      });

      progressCallback?.(i + 1, newsList.length);

      if (i > 0 && i % 5 === 0 && i < newsList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return results;
  }

  async analyzeChunked(
    newsList: NewsItem[],
    chunkSize: number = 10,
    progressCallback?: (current: number, total: number) => void
  ): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    let processed = 0;

    for (let start = 0; start < newsList.length; start += chunkSize) {
      const chunk = newsList.slice(start, start + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (news) => {
          const sentiment = analyzeSentimentRuleBased(news.content);
          const keywords = await extractKeywords(news.content);
          const summary = await generateSummary(news.content);
          return { news, sentiment, keywords, summary };
        })
      );

      const now = Date.now();
      for (const cr of chunkResults) {
        results.push({
          newsId: cr.news.id,
          news: cr.news,
          sentiment: cr.sentiment,
          keywords: cr.keywords,
          summary: cr.summary,
          favorite: isFavorite(cr.news.id),
          analyzedAt: now
        });
        processed++;
        progressCallback?.(processed, newsList.length);
      }

      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return results;
  }
}

export function aggregateStats(results: AnalysisResult[]): AggregatedStats {
  let strongly_negative = 0;
  let negative = 0;
  let neutral = 0;
  let positive = 0;
  let strongly_positive = 0;
  let totalScore = 0;

  const keywordMap = new Map<string, KeywordItem>();

  for (const result of results) {
    switch (result.sentiment.label) {
      case 'strongly_positive':
        strongly_positive++;
        break;
      case 'positive':
        positive++;
        break;
      case 'strongly_negative':
        strongly_negative++;
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
    strongly_negative,
    negative,
    neutral,
    positive,
    strongly_positive,
    averageScore: results.length > 0 ? totalScore / results.length : 0,
    topKeywords
  };
}

export const engine = new AnalysisEngine();
