import { CustomDictEntry } from '../engine/types';

const STORAGE_KEY = 'fina_analysis_custom_dict_v1';

let cache: CustomDictEntry[] | null = null;
let cacheReady = false;

function loadFromStorage(): CustomDictEntry[] {
  if (cacheReady && cache) return cache;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = JSON.parse(raw);
    } else {
      cache = [];
    }
  } catch {
    cache = [];
  }

  cacheReady = true;
  return cache as CustomDictEntry[];
}

function saveToStorage(data: CustomDictEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    cache = data;
    cacheReady = true;
  } catch (e) {
    console.error('保存自定义词典失败:', e);
  }
}

export function getCustomDict(): CustomDictEntry[] {
  return loadFromStorage();
}

export function addDictEntry(entry: Omit<CustomDictEntry, 'createdAt'>): CustomDictEntry {
  const dict = loadFromStorage();
  const exists = dict.findIndex(e => e.word === entry.word && e.type === entry.type);
  const newEntry: CustomDictEntry = {
    ...entry,
    createdAt: Date.now()
  };

  if (exists >= 0) {
    dict[exists] = newEntry;
  } else {
    dict.push(newEntry);
  }

  saveToStorage(dict);
  return newEntry;
}

export function removeDictEntry(word: string, type: string): boolean {
  const dict = loadFromStorage();
  const filtered = dict.filter(e => !(e.word === word && e.type === type));
  saveToStorage(filtered);
  return filtered.length !== dict.length;
}

export function clearDict() {
  saveToStorage([]);
}

export function importDict(entries: CustomDictEntry[]): number {
  const dict = loadFromStorage();
  const existingKeys = new Set(dict.map(e => `${e.word}_${e.type}`));
  let added = 0;

  for (const entry of entries) {
    const key = `${entry.word}_${entry.type}`;
    if (!existingKeys.has(key)) {
      dict.push({
        ...entry,
        createdAt: entry.createdAt || Date.now()
      });
      existingKeys.add(key);
      added++;
    }
  }

  saveToStorage(dict);
  return added;
}

export function exportDict(): CustomDictEntry[] {
  return loadFromStorage();
}
