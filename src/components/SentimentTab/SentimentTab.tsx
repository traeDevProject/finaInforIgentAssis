import React, { useState, useMemo } from 'react';
import {
  Card,
  Tag,
  Progress,
  List,
  Badge,
  Space,
  Button,
  Tooltip,
  Empty,
  Input,
  Segmented,
  message
} from 'antd';
import {
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  StarOutlined,
  StarFilled,
  SearchOutlined,
  FilterOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { AnalysisResult, SentimentLabel } from '../../engine/types';
import { toggleFavorite, isFavorite } from '../../store/appStore';

interface SentimentTabProps {
  results: AnalysisResult[];
  isLoading: boolean;
  onFavoriteChange?: () => void;
  favoriteRevision?: number;
  isFavoriteFn?: (id: string) => boolean;
  toggleFavoriteFn?: (id: string) => boolean;
}

type FilterType = 'all' | SentimentLabel | 'favorite';

const SENTIMENT_CONFIG: Record<SentimentLabel, {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  strongly_positive: {
    label: '强烈利好',
    shortLabel: '强利好',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.12)',
    borderColor: 'rgba(5, 150, 105, 0.35)',
    icon: <RiseOutlined />
  },
  positive: {
    label: '利好',
    shortLabel: '利好',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    icon: <ArrowUpOutlined />
  },
  neutral: {
    label: '中性',
    shortLabel: '中性',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.12)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    icon: <MehOutlined />
  },
  negative: {
    label: '利空',
    shortLabel: '利空',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    icon: <ArrowDownOutlined />
  },
  strongly_negative: {
    label: '强烈利空',
    shortLabel: '强利空',
    color: '#991b1b',
    bgColor: 'rgba(153, 27, 27, 0.12)',
    borderColor: 'rgba(153, 27, 27, 0.35)',
    icon: <FallOutlined />
  }
};

const SentimentTab: React.FC<SentimentTabProps> = ({
  results,
  isLoading,
  onFavoriteChange,
  favoriteRevision,
  isFavoriteFn = isFavorite,
  toggleFavoriteFn = toggleFavorite
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchText, setSearchText] = useState('');

  const sentimentCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: results.length,
      favorite: 0,
      strongly_positive: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      strongly_negative: 0
    };
    for (const r of results) {
      counts[r.sentiment.label]++;
      if (isFavoriteFn(r.newsId)) counts.favorite++;
    }
    return counts;
  }, [results, favoriteRevision, isFavoriteFn]);

  const filteredResults = useMemo(() => {
    let list = results;
    if (filter === 'favorite') {
      list = list.filter(r => isFavoriteFn(r.newsId));
    } else if (filter !== 'all') {
      list = list.filter(r => r.sentiment.label === filter);
    }
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase();
      list = list.filter(r =>
        r.news.content.toLowerCase().includes(kw) ||
        (r.news.title?.toLowerCase().includes(kw))
      );
    }
    return list;
  }, [results, filter, searchText, favoriteRevision, isFavoriteFn]);

  const getSentimentTag = (label: SentimentLabel) => {
    const cfg = SENTIMENT_CONFIG[label];
    return (
      <Tag
        color={cfg.color}
        style={{
          background: cfg.bgColor,
          border: `1px solid ${cfg.borderColor}`,
          color: cfg.color,
          borderRadius: 4,
          padding: '2px 10px',
          fontSize: 12,
          fontWeight: 500
        }}
      >
        {cfg.icon} {cfg.label}
      </Tag>
    );
  };

  const getSentimentIcon = (label: SentimentLabel) => {
    switch (label) {
      case 'strongly_positive':
      case 'positive':
        return <SmileOutlined style={{ fontSize: 22, color: SENTIMENT_CONFIG[label].color }} />;
      case 'strongly_negative':
      case 'negative':
        return <FrownOutlined style={{ fontSize: 22, color: SENTIMENT_CONFIG[label].color }} />;
      default:
        return <MehOutlined style={{ fontSize: 22, color: '#6b7280' }} />;
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 0.6) return '#059669';
    if (score >= 0.2) return '#10b981';
    if (score > -0.2) return '#6b7280';
    if (score > -0.6) return '#ef4444';
    return '#991b1b';
  };

  const getProgressPercent = (score: number) => {
    return Math.round(((score + 1) / 2) * 100);
  };

  const handleToggleFavorite = (newsId: string, current: boolean) => {
    const next = toggleFavoriteFn(newsId);
    message.success(next ? '已收藏' : '已取消收藏');
    onFavoriteChange?.();
  };

  const filterOptions = [
    { label: `全部 (${sentimentCounts.all})`, value: 'all' },
    { label: `⭐ 收藏 (${sentimentCounts.favorite})`, value: 'favorite' },
    { label: `强烈利好 (${sentimentCounts.strongly_positive})`, value: 'strongly_positive' },
    { label: `利好 (${sentimentCounts.positive})`, value: 'positive' },
    { label: `中性 (${sentimentCounts.neutral})`, value: 'neutral' },
    { label: `利空 (${sentimentCounts.negative})`, value: 'negative' },
    { label: `强烈利空 (${sentimentCounts.strongly_negative})`, value: 'strongly_negative' }
  ];

  if (isLoading) {
    return (
      <div className="loading-placeholder">
        {[1, 2, 3].map(i => (
          <Card key={i} className="skeleton-card" loading>
            <p>加载中...</p>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="empty-state">
        <MehOutlined className="empty-icon" />
        <p>暂无分析结果</p>
        <span className="empty-hint">请在左侧输入新闻并点击分析</span>
      </div>
    );
  }

  return (
    <div className="sentiment-tab">
      <div className="sentiment-filter-bar" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, maxWidth: 300 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#64748b' }} />}
            placeholder="搜索新闻内容..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="small"
          />
        </div>
        <div style={{ flex: 1, minWidth: 380, overflow: 'auto' }}>
          <Segmented
            size="small"
            options={filterOptions}
            value={filter}
            onChange={(v) => setFilter(v as FilterType)}
            style={{ fontSize: 12 }}
          />
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <Empty
          description={
            <span style={{ color: '#64748b' }}>
              没有符合条件的结果
              {searchText && <div style={{ fontSize: 12 }}>尝试修改搜索关键词或筛选条件</div>}
            </span>
          }
          style={{ padding: '40px 0' }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
        dataSource={filteredResults}
        renderItem={(result) => {
          const originalIndex = results.findIndex(r => r.newsId === result.newsId) + 1;
          const cfg = SENTIMENT_CONFIG[result.sentiment.label];
          const fav = isFavoriteFn(result.newsId);
          return (
            <List.Item key={result.newsId} className="news-list-item">
              <Card
                className="news-card"
                size="small"
                title={
                  <div className="news-card-title" style={{ width: '100%' }}>
                    <Badge
                      count={originalIndex}
                      style={{
                        background: cfg.bgColor,
                        color: cfg.color,
                        boxShadow: 'none',
                        fontWeight: 600,
                        marginRight: 12,
                        border: `1px solid ${cfg.borderColor}`
                      }}
                    />
                    <span className="title-text" title={result.news.title || result.news.content.substring(0, 60)}>
                      {result.news.title || result.news.content.substring(0, 50)}
                    </span>
                    {getSentimentTag(result.sentiment.label)}
                    <div style={{ marginLeft: 'auto', paddingRight: 8 }}>
                      <Tooltip title={fav ? '取消收藏' : '收藏'}>
                        <Button
                          type="text"
                          size="small"
                          icon={fav ? <StarFilled style={{ color: '#f59e0b' }} /> : <StarOutlined />}
                          onClick={() => handleToggleFavorite(result.newsId, fav)}
                          style={{ color: fav ? '#f59e0b' : undefined }}
                        />
                      </Tooltip>
                    </div>
                  </div>
                }
                extra={getSentimentIcon(result.sentiment.label)}
                styles={{ header: { background: cfg.bgColor, borderBottom: `1px solid ${cfg.borderColor}` }}}
              >
                <div className="sentiment-score-section">
                  <div className="score-header">
                    <span className="score-label">情感倾向得分</span>
                    <span
                      className="score-value"
                      style={{ color: cfg.color, fontWeight: 700 }}
                    >
                      {result.sentiment.score >= 0 ? '+' : ''}
                      {result.sentiment.score.toFixed(2)}
                    </span>
                  </div>
                  <Progress
                    percent={getProgressPercent(result.sentiment.score)}
                    showInfo={false}
                    strokeColor={getProgressColor(result.sentiment.score)}
                    trailColor="rgba(30, 41, 59, 0.8)"
                    size="small"
                  />
                  <div className="score-labels">
                    <span className="label-negative">强烈利空</span>
                    <span className="label-neutral">中性</span>
                    <span className="label-positive">强烈利好</span>
                  </div>
                </div>

                <div className="sentiment-detail-section" style={{
                  display: 'flex',
                  gap: 16,
                  marginBottom: 12,
                  padding: '8px 12px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: 6,
                  fontSize: 12,
                  flexWrap: 'wrap'
                }}>
                  <span style={{ color: '#10b981' }}>正面强度: <strong>{result.sentiment.detail.positiveScore.toFixed(2)}</strong></span>
                  <span style={{ color: '#ef4444' }}>负面强度: <strong>{result.sentiment.detail.negativeScore.toFixed(2)}</strong></span>
                  <span style={{ color: '#3b82f6' }}>程度系数: <strong>×{result.sentiment.detail.degree.toFixed(2)}</strong></span>
                </div>

                <div className="sentiment-words-section">
                  <Space size={[8, 8]} wrap>
                    <span className="words-label">正面词汇:</span>
                    {result.sentiment.positiveWords.length > 0 ? (
                      result.sentiment.positiveWords.map((word, i) => (
                        <Tag key={`p-${i}`} color="success" className="word-tag" style={{ marginInlineEnd: 4 }}>
                          {word}
                        </Tag>
                      ))
                    ) : (
                      <span className="no-words">无</span>
                    )}
                  </Space>
                </div>

                <div className="sentiment-words-section">
                  <Space size={[8, 8]} wrap>
                    <span className="words-label">负面词汇:</span>
                    {result.sentiment.negativeWords.length > 0 ? (
                      result.sentiment.negativeWords.map((word, i) => (
                        <Tag key={`n-${i}`} color="error" className="word-tag" style={{ marginInlineEnd: 4 }}>
                          {word}
                        </Tag>
                      ))
                    ) : (
                      <span className="no-words">无</span>
                    )}
                  </Space>
                </div>

                <div className="news-preview">
                  <span className="preview-label">内容预览:</span>
                  <p className="preview-text">
                    {result.news.content.substring(0, 150)}
                    {result.news.content.length > 150 ? '...' : ''}
                  </p>
                </div>

                <div className="confidence-info">
                  置信度: {Math.round(result.sentiment.confidence * 100)}%
                </div>
              </Card>
            </List.Item>
          );
        }}
      />
      )}
    </div>
  );
};

export default SentimentTab;
