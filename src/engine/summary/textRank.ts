import { SummaryResult } from '../types';

export function generateSummaryTextRank(text: string, maxSentences: number = 3): SummaryResult {
  const sentences = splitSentences(text);

  if (sentences.length <= maxSentences) {
    return {
      sentences: sentences.map(s => s.trim()).filter(s => s.length > 0),
      keywords: extractKeywordsFromText(text, 10)
    };
  }

  const sentenceVectors = sentences.map(sentence => {
    const words = tokenize(sentence);
    const wordSet = new Set(words);
    return {
      sentence,
      words,
      wordSet,
      score: 1.0
    };
  });

  const similarityMatrix: number[][] = [];
  for (let i = 0; i < sentences.length; i++) {
    similarityMatrix[i] = [];
    for (let j = 0; j < sentences.length; j++) {
      if (i === j) {
        similarityMatrix[i][j] = 0;
      } else {
        similarityMatrix[i][j] = calculateSimilarity(
          sentenceVectors[i].wordSet,
          sentenceVectors[j].wordSet
        );
      }
    }
  }

  const damping = 0.85;
  const iterations = 20;
  const threshold = 0.0001;

  for (let iter = 0; iter < iterations; iter++) {
    let maxDiff = 0;

    for (let i = 0; i < sentences.length; i++) {
      const oldScore = sentenceVectors[i].score;
      let sum = 0;

      for (let j = 0; j < sentences.length; j++) {
        if (i !== j && similarityMatrix[j][i] > 0) {
          const rowSum = similarityMatrix[j].reduce((a, b) => a + b, 0);
          if (rowSum > 0) {
            sum += (similarityMatrix[j][i] / rowSum) * sentenceVectors[j].score;
          }
        }
      }

      sentenceVectors[i].score = (1 - damping) + damping * sum;
      maxDiff = Math.max(maxDiff, Math.abs(sentenceVectors[i].score - oldScore));
    }

    if (maxDiff < threshold) break;
  }

  const scoredSentences = sentenceVectors
    .map((sv, idx) => ({ ...sv, index: idx }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map(sv => sv.sentence.trim())
    .filter(s => s.length > 0);

  return {
    sentences: scoredSentences,
    keywords: extractKeywordsFromText(text, 10)
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
      if (trimmed.length > 0) {
        sentences.push(trimmed);
      }
      current = '';
    }
  }

  if (current.trim().length > 0) {
    sentences.push(current.trim());
  }

  return sentences.filter(s => s.length >= 10);
}

function tokenize(text: string): string[] {
  const words: string[] = [];
  const cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ');

  let i = 0;
  while (i < cleaned.length) {
    const char = cleaned[i];
    if (char === ' ') {
      i++;
      continue;
    }

    if (/[\u4e00-\u9fa5]/.test(char)) {
      for (let len = 4; len >= 2; len--) {
        if (i + len <= cleaned.length) {
          const word = cleaned.substring(i, i + len);
          if (/^[\u4e00-\u9fa5]+$/.test(word)) {
            words.push(word);
            i += len;
            break;
          }
        }
      }
      if (/[\u4e00-\u9fa5]/.test(cleaned[i])) {
        i++;
      }
    } else {
      let word = '';
      while (i < cleaned.length && cleaned[i] !== ' ' && /[a-zA-Z0-9]/.test(cleaned[i])) {
        word += cleaned[i];
        i++;
      }
      if (word.length > 0) {
        words.push(word.toLowerCase());
      }
    }
  }

  return words;
}

function calculateSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 || set2.size === 0) return 0;

  let intersection = 0;
  for (const word of set1) {
    if (set2.has(word)) {
      intersection++;
    }
  }

  const union = set1.size + set2.size - intersection;
  if (union === 0) return 0;

  return intersection / Math.sqrt(set1.size * set2.size);
}

function extractKeywordsFromText(text: string, topN: number): string[] {
  const wordCount = new Map<string, number>();
  const words = tokenize(text);

  const stopWords = new Set([
    '的', '了', '和', '是', '在', '我', '有', '就', '不', '人', '都', '一', '一个',
    '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
    '自己', '这', '那', '他', '她', '它', '们', '什么', '这个', '那个', '哪些',
    '可以', '因为', '所以', '但是', '如果', '虽然', '而且', '或者', '还是',
    '已经', '正在', '将会', '曾经', '一直', '经常', '偶尔', '从来', '总是',
    '今天', '明天', '昨天', '今年', '去年', '明年', '现在', '以前', '以后',
    '关于', '对于', '由于', '通过', '根据', '按照', '除了', '包括', '以及',
    '等', '等等', '之类', '这样', '那样', '如何', '怎么', '多少', '几'
  ]);

  for (const word of words) {
    if (word.length < 2) continue;
    if (stopWords.has(word)) continue;
    if (/^[0-9]+$/.test(word)) continue;
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}
