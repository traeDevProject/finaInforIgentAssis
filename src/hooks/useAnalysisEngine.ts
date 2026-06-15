import { useState, useCallback, useRef } from 'react';
import { engine, aggregateStats, EngineMode } from '../engine';
import {
  NewsItem,
  AnalysisResult,
  AggregatedStats,
  EngineStatus
} from '../engine/types';

export function useAnalysisEngine() {
  const [status, setStatus] = useState<EngineStatus>(engine.status);
  const [engineMode, setEngineMode] = useState<EngineMode>('rule');
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 });
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const loadTransformerModel = useCallback(async (): Promise<boolean> => {
    if (isLoadingModel) return false;

    setIsLoadingModel(true);
    setModelLoadProgress(0);
    setModelLoadError(null);

    try {
      const success = await engine.loadTransformer((progress) => {
        setModelLoadProgress(progress);
      });

      if (success) {
        setEngineMode('transformer');
        setStatus(engine.status);
      } else {
        setModelLoadError('模型加载失败，将继续使用规则引擎');
      }

      return success;
    } catch (error) {
      setModelLoadError(error instanceof Error ? error.message : '模型加载失败');
      return false;
    } finally {
      setIsLoadingModel(false);
    }
  }, [isLoadingModel]);

  const switchEngineMode = useCallback((mode: EngineMode) => {
    if (mode === 'transformer' && !engine.isTransformerReady()) {
      loadTransformerModel();
    } else {
      engine.setMode(mode);
      setEngineMode(mode);
      setStatus(engine.status);
    }
  }, [loadTransformerModel]);

  const analyze = useCallback(async (newsList: NewsItem[]) => {
    if (newsList.length === 0) {
      setResults([]);
      setStats(null);
      return;
    }

    abortRef.current = false;
    setIsAnalyzing(true);
    setAnalyzeProgress({ current: 0, total: newsList.length });

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
    engineMode,
    results,
    stats,
    isAnalyzing,
    analyzeProgress,
    isLoadingModel,
    modelLoadProgress,
    modelLoadError,
    loadTransformerModel,
    switchEngineMode,
    analyze,
    clearResults
  };
}
