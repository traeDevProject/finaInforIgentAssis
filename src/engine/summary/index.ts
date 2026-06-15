import { SummaryResult } from '../types';
import { generateSummaryTextRank } from './textRank';

export { generateSummaryTextRank };

export async function generateSummary(text: string, maxSentences: number = 3): Promise<SummaryResult> {
  return generateSummaryTextRank(text, maxSentences);
}
