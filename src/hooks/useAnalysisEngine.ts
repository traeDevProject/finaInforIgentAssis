import { useState, useCallback, useRef, useEffect } from 'react';
import { engine, aggregateStats } from '../engine';
import {
  NewsItem,
  AnalysisResult,
  AggregatedStats,
  EngineStatus,
  HistoryRecord
} from '../engine/types';
import {
  addHistory,
  getHistory,
  getHistoryById,
  removeHistory,
  renameHistory,
  clearHistory,
  exportBackup,
  importBackup,
  downloadBackup
} from '../store/appStore';

export function useAnalysisEngine() {
  const [status, setStatus] = useState<EngineStatus>(engine.status);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 });
  const [historyList, setHistoryList] = useState<HistoryRecord[]>([]);
  const abortRef = useRef(false);

  useEffect(() => {
    setHistoryList(getHistory());
  }, []);

  const analyze = useCallback(async (newsList: NewsItem[], historyName?: string) => {
    if (newsList.length === 0) {
      setResults([]);
      setStats(null);
      return;
    }

    abortRef.current = false;
    setIsAnalyzing(true);
    setAnalyzeProgress({ current: 0, total: newsList.length });

    try {
      const analysisResults = await engine.analyzeChunked(
        newsList,
        10,
        (current, total) => {
          if (!abortRef.current) {
            setAnalyzeProgress({ current, total });
          }
        }
      );

      if (!abortRef.current) {
        setResults(analysisResults);
        const aggregated = aggregateStats(analysisResults);
        setStats(aggregated);
        addHistory(analysisResults, aggregated, historyName);
        setHistoryList(getHistory());
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

  const loadHistory = useCallback((id: string) => {
    const record = getHistoryById(id);
    if (record) {
      setResults(record.results);
      setStats(record.stats);
    }
  }, []);

  const deleteHistory = useCallback((id: string) => {
    removeHistory(id);
    setHistoryList(getHistory());
  }, []);

  const doRenameHistory = useCallback((id: string, name: string) => {
    renameHistory(id, name);
    setHistoryList(getHistory());
  }, []);

  const doClearHistory = useCallback(() => {
    clearHistory();
    setHistoryList([]);
  }, []);

  const doExportBackup = useCallback(() => {
    downloadBackup();
  }, []);

  const doImportBackup = useCallback(async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          importBackup(data);
          setHistoryList(getHistory());
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file, 'utf-8');
    });
  }, []);

  const refreshResults = useCallback(() => {
    setResults(prev => [...prev]);
  }, []);

  return {
    status,
    results,
    stats,
    isAnalyzing,
    analyzeProgress,
    historyList,
    analyze,
    clearResults,
    loadHistory,
    deleteHistory,
    renameHistory: doRenameHistory,
    clearAllHistory: doClearHistory,
    exportBackup: doExportBackup,
    importBackup: doImportBackup,
    refreshResults
  };
}
