import { useState, useCallback, useRef } from 'react';
import { engine, aggregateStats } from '../engine';
import {
  NewsItem,
  AnalysisResult,
  AggregatedStats,
  EngineStatus
} from '../engine/types';

export function useAnalysisEngine() {
  const [status, setStatus] = useState<EngineStatus>(engine.status);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 });
  const abortRef = useRef(false);

  const loadEngine = useCallback(async () => {
    if (status.isLoaded || status.isLoading) return;

    try {
      setStatus(prev => ({ ...prev, isLoading: true, loadProgress: 0 }));
      await engine.load((progress) => {
        setStatus(prev => ({ ...prev, loadProgress: progress }));
      });
      setStatus(engine.status);
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        loadError: error instanceof Error ? error.message : '加载失败'
      }));
    }
  }, [status.isLoaded, status.isLoading]);

  const analyze = useCallback(async (newsList: NewsItem[]) => {
    if (newsList.length === 0) {
      setResults([]);
      setStats(null);
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeProgress({ current: 0, total: newsList.length });
    abortRef.current = false;

    try {
      const analysisResults = await engine.analyzeWithProgress(
        newsList,
        (current, total) => {
          if (!abortRef.current) {
            setAnalyzeProgress({ current, total });
          }
        }
      );

      if (!abortRef.current) {
        setResults(analysisResults);
        setStats(aggregateStats(analysisResults));
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      if (!abortRef.current) {
        setIsAnalyzing(false);
      }
    }
  }, []);

  const clearResults = useCallback(() => {
    abortRef.current = true;
    setResults([]);
    setStats(null);
    setIsAnalyzing(false);
    setAnalyzeProgress({ current: 0, total: 0 });
  }, []);

  return {
    status,
    results,
    stats,
    isAnalyzing,
    analyzeProgress,
    loadEngine,
    analyze,
    clearResults
  };
}
