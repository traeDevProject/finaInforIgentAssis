import { SentimentResult } from '../types';
import { analyzeSentimentRuleBased } from './ruleBased';

export { analyzeSentimentRuleBased };

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  return analyzeSentimentRuleBased(text);
}
