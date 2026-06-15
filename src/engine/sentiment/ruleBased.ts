import { SentimentResult, SentimentLabel } from '../types';
import {
  positiveWords,
  negativeWords,
  degreeAdverbs,
  negativeAdverbs,
  strongNegativeAdverbs
} from '../../data/sentimentDict';

const stopPunctuations = new Set([
  '，', '。', '！', '？', '；', '：', '、',
  ',', '.', '!', '?', ';', ':',
  ' ', '\t', '\n', '\r',
  '但是', '不过', '然而', '可是', '但', '却',
  '虽然', '尽管', '即使', '就算',
  '而且', '并且', '同时', '另外', '此外',
  '因为', '所以', '因此', '于是'
]);

export function analyzeSentimentRuleBased(text: string): SentimentResult {
  let totalPositiveScore = 0;
  let totalNegativeScore = 0;
  const foundPositive: string[] = [];
  const foundNegative: string[] = [];

  const sentences = splitSentences(text);

  for (const sentence of sentences) {
    const result = analyzeSentence(sentence);
    totalPositiveScore += result.positiveScore;
    totalNegativeScore += result.negativeScore;
    foundPositive.push(...result.positiveWords);
    foundNegative.push(...result.negativeWords);
  }

  const totalScore = totalPositiveScore - totalNegativeScore;
  const maxScore = Math.max(totalPositiveScore, totalNegativeScore, 1);
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

function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    current += char;

    if (char === '。' || char === '！' || char === '？' || char === '；' || char === ';') {
      const nextChar = text[i + 1];
      if (nextChar === '”' || nextChar === '"' || nextChar === '）' || nextChar === ')') {
        current += nextChar;
        i++;
      }
      const trimmed = current.trim();
      if (trimmed.length > 5) {
        sentences.push(trimmed);
      }
      current = '';
    }
  }

  if (current.trim().length > 5) {
    sentences.push(current.trim());
  }

  return sentences;
}

function analyzeSentence(sentence: string): {
  positiveScore: number;
  negativeScore: number;
  positiveWords: string[];
  negativeWords: string[];
} {
  let positiveScore = 0;
  let negativeScore = 0;
  const positiveWordsFound: string[] = [];
  const negativeWordsFound: string[] = [];

  let negationScope = false;
  let negationStrength = 0.7;
  let degreeModifier = 1;
  let distanceFromNegation = 0;
  const maxNegationDistance = 6;

  let i = 0;
  while (i < sentence.length) {
    const char = sentence[i];

    if (stopPunctuations.has(char)) {
      negationScope = false;
      degreeModifier = 1;
      distanceFromNegation = 0;
      i++;
      continue;
    }

    let matched = false;

    for (let len = 8; len >= 2; len--) {
      if (i + len > sentence.length) continue;
      const word = sentence.substring(i, i + len);

      if (positiveWords.includes(word)) {
        let weight = degreeModifier;

        if (negationScope && distanceFromNegation <= maxNegationDistance) {
          weight = weight * negationStrength * -1;
        }

        if (weight > 0) {
          positiveScore += weight;
          positiveWordsFound.push(word);
        } else {
          negativeScore += Math.abs(weight);
          negativeWordsFound.push(`不${word}`);
        }

        negationScope = false;
        degreeModifier = 1;
        distanceFromNegation = 0;
        i += len;
        matched = true;
        break;
      }

      if (negativeWords.includes(word)) {
        let weight = -degreeModifier;

        if (negationScope && distanceFromNegation <= maxNegationDistance) {
          weight = weight * negationStrength * -1;
        }

        if (weight < 0) {
          negativeScore += Math.abs(weight);
          negativeWordsFound.push(word);
        } else {
          positiveScore += weight;
          positiveWordsFound.push(`不${word}`);
        }

        negationScope = false;
        degreeModifier = 1;
        distanceFromNegation = 0;
        i += len;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    for (const adv of degreeAdverbs) {
      if (sentence.substring(i, i + adv.word.length) === adv.word) {
        degreeModifier = adv.weight;
        i += adv.word.length;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    for (const neg of negativeAdverbs) {
      if (sentence.substring(i, i + neg.length) === neg) {
        negationScope = true;
        distanceFromNegation = 0;
        negationStrength = strongNegativeAdverbs.includes(neg) ? 0.9 : 0.7;
        i += neg.length;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    if (negationScope) {
      distanceFromNegation++;
      if (distanceFromNegation > maxNegationDistance) {
        negationScope = false;
      }
    }

    i++;
  }

  return {
    positiveScore,
    negativeScore,
    positiveWords: positiveWordsFound,
    negativeWords: negativeWordsFound
  };
}
