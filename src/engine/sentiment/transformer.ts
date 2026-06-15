import { SentimentResult, SentimentLabel } from '../types';

let pipeline: any = null;
let isLoading = false;
let loadError: string | null = null;

const SENTIMENT_MODEL = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';

const CDN_SOURCES = [
  { name: 'jsDelivr', host: 'https://cdn.jsdelivr.net/npm/@xenova' },
  { name: 'HuggingFace', host: 'https://huggingface.co' }
];

export async function loadSentimentModel(
  progressCallback?: (progress: number) => void
): Promise<boolean> {
  if (pipeline) return true;
  if (isLoading) return false;
  if (loadError) return false;

  isLoading = true;
  loadError = null;

  const { pipeline: createPipeline, env } = await import('@xenova/transformers');

  env.allowLocalModels = false;
  env.useBrowserCache = true;
  env.allowRemoteModels = true;

  progressCallback?.(5);

  for (let i = 0; i < CDN_SOURCES.length; i++) {
    const source = CDN_SOURCES[i];
    try {
      if (source.host.includes('jsdelivr')) {
        env.remoteHost = source.host;
        env.remotePathTemplate = '/{model}/resolve/{revision}/';
      } else {
        env.remoteHost = source.host;
        env.remotePathTemplate = '/{model}/resolve/{revision}/';
      }

      progressCallback?.(10 + i * 10);

      const localPipeline = await createPipeline('sentiment-analysis', SENTIMENT_MODEL, {
        progress_callback: (data: any) => {
          if (data.status === 'progress' && data.total) {
            const baseProgress = 10 + i * 10;
            const rangeProgress = 80 - i * 10;
            const progress = baseProgress + Math.round((data.loaded / data.total) * rangeProgress);
            progressCallback?.(Math.min(progress, 99));
          }
        }
      });

      pipeline = localPipeline;
      progressCallback?.(100);
      isLoading = false;
      return true;
    } catch (error) {
      console.warn(`从 ${source.name} 加载模型失败:`, error);
      if (i === CDN_SOURCES.length - 1) {
        loadError = error instanceof Error ? error.message : '模型加载失败，请检查网络连接';
      }
    }
  }

  isLoading = false;
  pipeline = null;
  return false;
}

export function isTransformersAvailable(): boolean {
  return pipeline !== null;
}

export function isTransformersLoading(): boolean {
  return isLoading;
}

export function getTransformersError(): string | null {
  return loadError;
}

export async function analyzeSentimentTransformer(
  text: string
): Promise<SentimentResult> {
  if (!pipeline) {
    throw new Error('模型未加载');
  }

  try {
    const chunks = splitTextForTransformer(text);
    const results = await Promise.all(
      chunks.map(chunk => pipeline(chunk))
    );

    let positiveScore = 0;
    let negativeScore = 0;
    let totalConfidence = 0;

    for (const result of results) {
      const label = result[0].label.toLowerCase();
      const score = result[0].score;

      if (label.includes('positive') || label === '正面') {
        positiveScore += score;
      } else {
        negativeScore += score;
      }
      totalConfidence += score;
    }

    const avgPositive = positiveScore / results.length;
    const avgNegative = negativeScore / results.length;

    let label: SentimentLabel;
    let score: number;

    if (avgPositive > avgNegative) {
      label = 'positive';
      score = avgPositive;
    } else if (avgNegative > avgPositive) {
      label = 'negative';
      score = -avgNegative;
    } else {
      label = 'neutral';
      score = 0;
    }

    const confidence = totalConfidence / results.length;

    return {
      label,
      score: Math.max(-1, Math.min(1, score)),
      confidence: Math.min(confidence, 0.98),
      positiveWords: [],
      negativeWords: []
    };
  } catch (error) {
    throw error;
  }
}

function splitTextForTransformer(text: string, maxLength: number = 500): string[] {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  if (cleanText.length <= maxLength) {
    return [cleanText];
  }

  const chunks: string[] = [];
  const sentences = cleanText.split(/(?<=[。！？；.!?;])/).filter(s => s.trim());

  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.slice(0, 5);
}

export function unloadSentimentModel() {
  pipeline = null;
  loadError = null;
  isLoading = false;
}
