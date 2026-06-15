import { KeywordItem, KeywordCategory } from '../types';
import { allKeywords } from '../../data/financeTerms';

const stopWords = new Set([
  '的', '了', '和', '是', '在', '我', '有', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '他', '她', '它', '们', '什么', '这个', '那个', '哪些',
  '可以', '因为', '所以', '但是', '如果', '虽然', '而且', '或者', '还是',
  '已经', '正在', '将会', '曾经', '一直', '经常', '偶尔', '从来', '总是',
  '今天', '明天', '昨天', '今年', '去年', '明年', '现在', '以前', '以后',
  '关于', '对于', '由于', '通过', '根据', '按照', '除了', '包括', '以及',
  '等', '等等', '之类', '等等', '什么的', '这样', '那样', '如何', '怎么',
  '多少', '几', '个', '只', '条', '件', '项', '种', '类', '方面', '部分',
  '问题', '情况', '时候', '时间', '地方', '东西', '方式', '方法', '结果',
  '发展', '建设', '工作', '生活', '经济', '社会', '国家', '人民', '企业',
  '市场', '行业', '公司', '产品', '服务', '业务', '管理', '技术', '项目',
  '投资', '融资', '资金', '资本', '资产', '负债', '收入', '支出', '成本',
  '增长', '下降', '提高', '降低', '增加', '减少', '扩大', '缩小', '优化',
  '推动', '促进', '加强', '深化', '加快', '推进', '提升', '改善', '完善',
  '实现', '完成', '达到', '超过', '突破', '创造', '创新', '改革', '开放',
  '发展', '稳定', '安全', '风险', '挑战', '机遇', '前景', '趋势', '方向',
  '认为', '表示', '指出', '强调', '说明', '显示', '表明', '发现', '看到',
  '据悉', '据了解', '据报道', '据统计', '数据显示', '分析认为', '业内人士',
  '记者', '报道', '消息', '新闻', '资讯', '信息', '公告', '声明', '表示'
]);

export function extractKeywords(text: string): KeywordItem[] {
  const keywordsMap = new Map<string, { count: number; category: KeywordCategory }>();

  for (const kw of allKeywords) {
    const regex = new RegExp(kw.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      const existing = keywordsMap.get(kw.name);
      if (existing) {
        existing.count += matches.length;
      } else {
        keywordsMap.set(kw.name, {
          count: matches.length,
          category: kw.category as KeywordCategory
        });
      }
    }
  }

  const chineseWords = extractChineseWords(text);
  for (const { word, count } of chineseWords) {
    if (word.length < 2 || word.length > 8) continue;
    if (stopWords.has(word)) continue;
    if (keywordsMap.has(word)) continue;
    if (count < 2) continue;

    keywordsMap.set(word, {
      count,
      category: 'other'
    });
  }

  const result: KeywordItem[] = [];
  for (const [word, data] of keywordsMap.entries()) {
    result.push({
      word,
      count: data.count,
      category: data.category
    });
  }

  result.sort((a, b) => {
    const categoryPriority = { company: 4, industry: 3, indicator: 2, other: 1 };
    const priorityDiff = categoryPriority[b.category] - categoryPriority[a.category];
    if (priorityDiff !== 0) return priorityDiff;
    return b.count - a.count;
  });

  return result.slice(0, 50);
}

function extractChineseWords(text: string): { word: string; count: number }[] {
  const wordCount = new Map<string, number>();

  const cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ');

  for (let len = 2; len <= 6; len++) {
    for (let i = 0; i <= cleaned.length - len; i++) {
      const word = cleaned.substring(i, i + len);
      if (word.includes(' ')) continue;
      if (/^[0-9]+$/.test(word)) continue;
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  }

  const result: { word: string; count: number }[] = [];
  for (const [word, count] of wordCount.entries()) {
    result.push({ word, count });
  }

  result.sort((a, b) => b.count - a.count);
  return result;
}

export function highlightKeywords(text: string, keywords: KeywordItem[]): string {
  if (keywords.length === 0) return text;

  let result = text;
  const sortedKeywords = [...keywords].sort((a, b) => b.word.length - a.word.length);

  for (const kw of sortedKeywords) {
    const regex = new RegExp(`(${kw.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');
    result = result.replace(regex, `<mark class="kw-${kw.category}">$1</mark>`);
  }

  return result;
}
