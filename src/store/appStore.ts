import { HistoryRecord, AnalysisResult, AggregatedStats, BackupData } from '../engine/types';

const HISTORY_KEY = 'fina_analysis_history_v1';
const FAVORITES_KEY = 'fina_analysis_favorites_v1';
const MAX_HISTORY = 50;

let historyCache: HistoryRecord[] | null = null;
let favoritesCache: Set<string> | null = null;

function loadHistory(): HistoryRecord[] {
  if (historyCache) return historyCache;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    historyCache = raw ? JSON.parse(raw) : [];
  } catch {
    historyCache = [];
  }
  return historyCache as HistoryRecord[];
}

function saveHistory(data: HistoryRecord[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
    historyCache = data;
  } catch (e) {
    console.error('保存历史记录失败:', e);
  }
}

function loadFavorites(): Set<string> {
  if (favoritesCache) return favoritesCache;
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    favoritesCache = new Set(raw ? JSON.parse(raw) : []);
  } catch {
    favoritesCache = new Set();
  }
  return favoritesCache as Set<string>;
}

function saveFavorites(data: Set<string>) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(data)));
    favoritesCache = data;
  } catch (e) {
    console.error('保存收藏失败:', e);
  }
}

export function addHistory(
  results: AnalysisResult[],
  stats: AggregatedStats,
  name?: string
): HistoryRecord {
  const history = loadHistory();
  const record: HistoryRecord = {
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    name: name || `分析记录 ${new Date().toLocaleString('zh-CN', { hour12: false })}`,
    newsCount: results.length,
    results,
    stats
  };

  history.unshift(record);
  while (history.length > MAX_HISTORY) {
    history.pop();
  }

  saveHistory(history);
  return record;
}

export function getHistory(): HistoryRecord[] {
  return loadHistory();
}

export function getHistoryById(id: string): HistoryRecord | undefined {
  return loadHistory().find(h => h.id === id);
}

export function removeHistory(id: string): boolean {
  const history = loadHistory();
  const filtered = history.filter(h => h.id !== id);
  saveHistory(filtered);
  return filtered.length !== history.length;
}

export function clearHistory() {
  saveHistory([]);
}

export function renameHistory(id: string, name: string): boolean {
  const history = loadHistory();
  const idx = history.findIndex(h => h.id === id);
  if (idx < 0) return false;
  history[idx] = { ...history[idx], name };
  saveHistory(history);
  return true;
}

export function isFavorite(newsId: string): boolean {
  return loadFavorites().has(newsId);
}

export function toggleFavorite(newsId: string): boolean {
  const favs = loadFavorites();
  if (favs.has(newsId)) {
    favs.delete(newsId);
    saveFavorites(favs);
    return false;
  } else {
    favs.add(newsId);
    saveFavorites(favs);
    return true;
  }
}

export function getAllFavorites(): string[] {
  return Array.from(loadFavorites());
}

export function clearFavorites() {
  saveFavorites(new Set());
}

export function exportBackup(): BackupData {
  const version = '1.0.0';
  const history = loadHistory();
  const dictionary: any[] = [];
  try {
    const raw = localStorage.getItem('fina_analysis_custom_dict_v1');
    if (raw) dictionary.push(...JSON.parse(raw));
  } catch {}
  const favorites = getAllFavorites();
  return {
    version,
    exportedAt: Date.now(),
    history,
    dictionary,
    favorites
  };
}

export function importBackup(data: BackupData): {
  historyAdded: number;
  dictAdded: number;
  favoritesAdded: number;
} {
  let historyAdded = 0;
  let dictAdded = 0;
  let favoritesAdded = 0;

  if (data.history && data.history.length > 0) {
    const history = loadHistory();
    const existingIds = new Set(history.map(h => h.id));

    for (const record of data.history) {
      if (!existingIds.has(record.id)) {
        history.push(record);
        historyAdded++;
      }
    }

    history.sort((a, b) => b.createdAt - a.createdAt);
    while (history.length > MAX_HISTORY) {
      history.pop();
    }
    saveHistory(history);
  }

  if (data.dictionary && data.dictionary.length > 0) {
    try {
      const existingRaw = localStorage.getItem('fina_analysis_custom_dict_v1');
      const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
      const existingKeys = new Set(existing.map(e => `${e.word}_${e.type}`));

      for (const entry of data.dictionary) {
        const key = `${entry.word}_${entry.type}`;
        if (!existingKeys.has(key)) {
          existing.push({ ...entry, createdAt: entry.createdAt || Date.now() });
          dictAdded++;
        }
      }

      localStorage.setItem('fina_analysis_custom_dict_v1', JSON.stringify(existing));
    } catch (e) {
      console.error('导入词典失败:', e);
    }
  }

  if (data.favorites && data.favorites.length > 0) {
    const favs = loadFavorites();
    const before = favs.size;
    for (const id of data.favorites) {
      favs.add(id);
    }
    favoritesAdded = favs.size - before;
    saveFavorites(favs);
  }

  return { historyAdded, dictAdded, favoritesAdded };
}

export function downloadBackup() {
  const backup = exportBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fina-analysis-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
