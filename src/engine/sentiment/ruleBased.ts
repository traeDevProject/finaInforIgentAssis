import { SentimentResult, SentimentLabel } from '../types';
import {
  positiveWords,
  negativeWords,
  negativeAdverbs,
  strongNegativeAdverbs,
  degreeAdverbs,
  turningWords
} from '../../data/sentimentDict';
import { getCustomDict } from '../../store/dictionaryStore';

const PUNCTUATION_REGEX = /[。！？；.!?;,\s，、]+/;
const MAX_NEGATION_DISTANCE = 8;

function scoreToLabel(score: number): SentimentLabel {
  if (score >= 0.6) return 'strongly_positive';
  if (score >= 0.2) return 'positive';
  if (score <= -0.6) return 'strongly_negative';
  if (score <= -0.2) return 'negative';
  return 'neutral';
}

function buildWordSet() {
  const customDict = getCustomDict();
  const positiveSet = new Map<string, number>();
  const negativeSet = new Map<string, number>();
  const negationSet = new Map<string, number>();
  const degreeSet = new Map<string, number>();
  const turningSet = new Set<string>();

  for (const word of positiveWords) {
    positiveSet.set(word, 1.0);
  }
  for (const word of negativeWords) {
    negativeSet.set(word, -1.0);
  }
  for (const word of negativeAdverbs) {
    negationSet.set(word, 0.7);
  }
  for (const word of strongNegativeAdverbs) {
    negationSet.set(word, 0.9);
  }
  for (const item of degreeAdverbs) {
    degreeSet.set(item.word, item.weight);
  }
  for (const word of turningWords) {
    turningSet.add(word);
  }

  for (const entry of customDict) {
    if (entry.type === 'positive') {
      positiveSet.set(entry.word, entry.weight || 1.0);
    } else if (entry.type === 'negative') {
      negativeSet.set(entry.word, entry.weight || -1.0);
    } else if (entry.type === 'negation') {
      negationSet.set(entry.word, entry.weight || 0.7);
    } else if (entry.type === 'degree') {
      degreeSet.set(entry.word, entry.weight || 1.0);
    }
  }

  return { positiveSet, negativeSet, negationSet, degreeSet, turningSet };
}

function matchLongestWord(text: string, start: number, wordMap: Map<string, number>): { word: string; weight: number; length: number } | null {
  let longestMatch: { word: string; weight: number; length: number } | null = null;

  for (const [word, weight] of wordMap.entries()) {
    if (text.startsWith(word, start)) {
      if (!longestMatch || word.length > longestMatch.length) {
        longestMatch = { word, weight, length: word.length };
      }
    }
  }

  return longestMatch;
}

function matchAnyWord(text: string, start: number, wordSet: Set<string>): string | null {
  for (const word of wordSet) {
    if (text.startsWith(word, start)) {
      return word;
    }
  }
  return null;
}

export function analyzeSentimentRuleBased(text: string): SentimentResult {
  if (!text || !text.trim()) {
    return {
      label: 'neutral',
      score: 0,
      confidence: 0.5,
      positiveWords: [],
      negativeWords: [],
      detail: { positiveScore: 0, negativeScore: 0, degree: 0 }
    };
  }

  const { positiveSet, negativeSet, negationSet, degreeSet, turningSet } = buildWordSet();

  const cleanText = text.replace(/\s+/g, '');
  const allPositiveWords: string[] = [];
  const allNegativeWords: string[] = [];

  let negationScope = false;
  let negationStrength = 0.7;
  let degreeModifier = 1;
  let distanceFromNegation = 0;

  let totalPositive = 0;
  let totalNegative = 0;
  let totalDegree = 1;
  let degreeCount = 0;
  let hitCount = 0;

  let i = 0;
  while (i < cleanText.length) {
    const char = cleanText[i];

    if (PUNCTUATION_REGEX.test(char)) {
      negationScope = false;
      degreeModifier = 1;
      distanceFromNegation = 0;
      i++;
      continue;
    }

    if (matchAnyWord(cleanText, i, turningSet)) {
      negationScope = false;
      degreeModifier = 1;
      distanceFromNegation = 0;
      i += 2;
      continue;
    }

    const negationMatch = matchLongestWord(cleanText, i, negationSet);
    if (negationMatch) {
      negationScope = true;
      negationStrength = negationMatch.weight;
      distanceFromNegation = 0;
      i += negationMatch.length;
      continue;
    }

    const degreeMatch = matchLongestWord(cleanText, i, degreeSet);
    if (degreeMatch) {
      degreeModifier *= degreeMatch.weight;
      i += degreeMatch.length;
      continue;
    }

    const positiveMatch = matchLongestWord(cleanText, i, positiveSet);
    if (positiveMatch) {
      hitCount++;
      let weight = positiveMatch.weight * degreeModifier;

      if (negationScope && distanceFromNegation <= MAX_NEGATION_DISTANCE) {
        weight = weight * negationStrength * -1;
      }

      if (weight > 0) {
        totalPositive += weight;
        allPositiveWords.push(positiveMatch.word);
      } else {
        totalNegative += Math.abs(weight);
        allNegativeWords.push(`不${positiveMatch.word}`);
      }

      totalDegree *= degreeModifier;
      degreeCount++;
      degreeModifier = 1;
      i += positiveMatch.length;
      if (negationScope) distanceFromNegation += positiveMatch.length;
      continue;
    }

    const negativeMatch = matchLongestWord(cleanText, i, negativeSet);
    if (negativeMatch) {
      hitCount++;
      let weight = negativeMatch.weight * degreeModifier;

      if (negationScope && distanceFromNegation <= MAX_NEGATION_DISTANCE) {
        weight = Math.abs(weight) * negationStrength;
        allPositiveWords.push(`不${negativeMatch.word}`);
      } else {
        allNegativeWords.push(negativeMatch.word);
      }

      if (weight > 0) {
        totalPositive += weight;
      } else {
        totalNegative += Math.abs(weight);
      }

      totalDegree *= degreeModifier;
      degreeCount++;
      degreeModifier = 1;
      i += negativeMatch.length;
      if (negationScope) distanceFromNegation += negativeMatch.length;
      continue;
    }

    i++;
    if (negationScope) distanceFromNegation++;
    if (distanceFromNegation > MAX_NEGATION_DISTANCE) {
      negationScope = false;
    }
  }

  const textLength = cleanText.length;
  const hitDensity = textLength > 0 ? hitCount / Math.max(1, Math.floor(textLength / 100)) : 0;

  let rawScore = 0;
  let confidence = 0.5;

  if (totalPositive === 0 && totalNegative === 0) {
    rawScore = 0;
    confidence = 0.5;
  } else {
    rawScore = (totalPositive - totalNegative) / Math.max(totalPositive, totalNegative);
    const totalStrength = totalPositive + totalNegative;
    const avgDegree = degreeCount > 0 ? Math.pow(totalDegree, 1 / degreeCount) : 1;
    confidence = 0.5 + Math.min(hitDensity, 3) * 0.1 + Math.min(avgDegree - 1, 2) * 0.05;
    confidence = Math.min(confidence, 0.98);
  }

  const score = Math.max(-1, Math.min(1, rawScore));
  const label = scoreToLabel(score);

  return {
    label,
    score,
    confidence,
    positiveWords: Array.from(new Set(allPositiveWords)),
    negativeWords: Array.from(new Set(allNegativeWords)),
    detail: {
      positiveScore: Number(totalPositive.toFixed(3)),
      negativeScore: Number(totalNegative.toFixed(3)),
      degree: degreeCount > 0 ? Number(Math.pow(totalDegree, 1 / degreeCount).toFixed(2)) : 1
    }
  };
}
