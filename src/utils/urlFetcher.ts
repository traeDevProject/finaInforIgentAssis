export interface FetchNewsResult {
  success: boolean;
  title?: string;
  content?: string;
  error?: string;
  source?: string;
}

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest='
];

export async function fetchNewsFromUrl(url: string): Promise<FetchNewsResult> {
  if (!isValidUrl(url)) {
    return { success: false, error: '请输入有效的网址' };
  }

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxyUrl = CORS_PROXIES[i] + encodeURIComponent(url);
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) continue;

      const html = await response.text();
      const parsed = parseHtmlContent(html, url);

      if (parsed.content && parsed.content.length > 50) {
        return {
          success: true,
          title: parsed.title,
          content: parsed.content,
          source: getDomain(url)
        };
      }
    } catch {
      continue;
    }
  }

  return {
    success: false,
    error: '无法获取网页内容，可能受跨域限制。请手动复制新闻正文粘贴到输入框中。'
  };
}

export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function parseHtmlContent(html: string, url: string): { title: string; content: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let title = '';
  const titleElement = doc.querySelector('title');
  if (titleElement?.textContent) {
    title = titleElement.textContent.trim();
  }

  const ogTitle = doc.querySelector('meta[property="og:title"]');
  if (ogTitle?.getAttribute('content')) {
    title = ogTitle.getAttribute('content')!;
  }

  let content = '';

  const articleSelectors = [
    'article',
    '.article-content',
    '.article-body',
    '.news-content',
    '.news-body',
    '.content-article',
    '.post-content',
    '.entry-content',
    '#article-content',
    '#news-content',
    '.detail-content',
    '.main-content'
  ];

  for (const selector of articleSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      content = extractTextFromElement(element);
      if (content.length > 100) break;
    }
  }

  if (content.length < 100) {
    const paragraphs = doc.querySelectorAll('p');
    const paragraphTexts: string[] = [];
    paragraphs.forEach((p) => {
      const text = p.textContent?.trim() || '';
      if (text.length > 20) {
        paragraphTexts.push(text);
      }
    });

    if (paragraphTexts.length > 0) {
      content = paragraphTexts.join('\n\n');
    }
  }

  if (content.length < 50) {
    const bodyText = doc.body?.textContent || '';
    content = bodyText.replace(/\s+/g, ' ').trim();
  }

  content = cleanContent(content);

  return { title, content };
}

function extractTextFromElement(element: Element): string {
  const paragraphs: string[] = [];

  const pElements = element.querySelectorAll('p');
  pElements.forEach((p) => {
    const text = p.textContent?.trim() || '';
    if (text.length > 10) {
      paragraphs.push(text);
    }
  });

  if (paragraphs.length === 0) {
    const text = element.textContent?.trim() || '';
    return text.replace(/\s+/g, ' ');
  }

  return paragraphs.join('\n\n');
}

function cleanContent(text: string): string {
  let cleaned = text
    .replace(/\t/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ +/g, ' ')
    .trim();

  cleaned = cleaned.replace(/点击查看.*?全文/g, '');
  cleaned = cleaned.replace(/展开全文/g, '');
  cleaned = cleaned.replace(/本文来自.*?转载/g, '');
  cleaned = cleaned.replace(/免责声明.*$/s, '');
  cleaned = cleaned.replace(/风险提示.*$/s, '');

  return cleaned.trim();
}

export function batchFetchNewsUrls(urls: string[]): Promise<FetchNewsResult[]> {
  return Promise.all(urls.map(url => fetchNewsFromUrl(url)));
}
