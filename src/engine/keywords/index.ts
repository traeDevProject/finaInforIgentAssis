import { KeywordItem } from '../types';
import { extractKeywords, highlightKeywords } from './dictionary';

export { extractKeywords, highlightKeywords };

export async function extractKeywordsFromText(text: string): Promise<KeywordItem[]> {
  return extractKeywords(text);
}
