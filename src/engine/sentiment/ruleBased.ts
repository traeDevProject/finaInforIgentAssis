import { SentimentResult, SentimentLabel } from '../types';
import { positiveWords, negativeWords, degreeAdverbs, negativeAdverbs } from '../../data/sentimentDict';

export function analyzeSentimentRuleBased(text: string): SentimentResult {
  let positiveScore = 0;
  let negativeScore = 0;
  const foundPositive: string[] = [];
  const foundNegative: string[] = [];

  const sentences = text.split(/[。！？；\n\r]+/).filter(s => s.trim().length > 0);

  for (const sentence of sentences) {
    let sentencePositive = 0;
    let sentenceNegative = 0;
    let sentencePosWords: string[] = [];
    let sentenceNegWords: string[] = [];
    let hasNegativeAdverb = false;
    let currentDegree = 1;

    for (let i = 0; i < sentence.length; i++) {
      let matched = false;

      for (let len = 8; len >= 2; len--) {
        if (i + len > sentence.length) continue;
        const word = sentence.substring(i, i + len);

        if (positiveWords.includes(word)) {
          let weight = currentDegree;
          if (hasNegativeAdverb) weight *= -0.5;
          sentencePositive += weight;
          sentencePosWords.push(word);
          i += len - 1;
          matched = true;
          break;
        }

        if (negativeWords.includes(word)) {
          let weight = -currentDegree;
          if (hasNegativeAdverb) weight *= -0.5;
          sentencePositive += weight;
          sentenceNegWords.push(word);
          i += len - 1;
          matched = true;
          break;
        }
      }

      if (matched) {
        currentDegree = 1;
        hasNegativeAdverb = false;
        continue;
      }

      for (const adv of degreeAdverbs) {
        if (sentence.substring(i, i + adv.word.length) === adv.word) {
          currentDegree = adv.weight;
          i += adv.word.length - 1;
          matched = true;
          break;
        }
      }

      if (matched) continue;

      for (const neg of negativeAdverbs) {
        if (sentence.substring(i, i + neg.length) === neg) {
          hasNegativeAdverb = true;
          i += neg.length - 1;
          matched = true;
          break;
        }
      }
    }

    positiveScore += Math.max(0, sentencePositive);
    negativeScore += Math.abs(Math.min(0, sentencePositive));
    foundPositive.push(...sentencePosWords);
    foundNegative.push(...sentenceNegWords);
  }

  const totalScore = positiveScore - negativeScore;
  const maxScore = Math.max(positiveScore, negativeScore, 1);
  const normalizedScore = totalScore / maxScore;

  let label: SentimentLabel;
  if (normalizedScore > 0.15) {
    label = 'positive';
  } else if (normalizedScore < -0.15) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  const confidence = Math.min(Math.abs(normalizedScore) * 0.6 + 0.4, 0.95);

  return {
    label,
    score: Math.max(-1, Math.min(1, normalizedScore)),
    confidence,
    positiveWords: [...new Set(foundPositive)].slice(0, 10),
    negativeWords: [...new Set(foundNegative)].slice(0, 10)
  };
}
