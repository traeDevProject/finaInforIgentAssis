import React from 'react';
import { Card, Tag, Progress, List, Badge, Space } from 'antd';
import {
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { AnalysisResult } from '../../engine/types';

interface SentimentTabProps {
  results: AnalysisResult[];
  isLoading: boolean;
}

const SentimentTab: React.FC<SentimentTabProps> = ({ results, isLoading }) => {
  const getSentimentTag = (label: string) => {
    switch (label) {
      case 'positive':
        return (
          <Tag color="success" className="sentiment-tag positive">
            <ArrowUpOutlined /> 利好
          </Tag>
        );
      case 'negative':
        return (
          <Tag color="error" className="sentiment-tag negative">
            <ArrowDownOutlined /> 利空
          </Tag>
        );
      default:
        return (
          <Tag color="default" className="sentiment-tag neutral">
            <MehOutlined /> 中性
          </Tag>
        );
    }
  };

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive':
        return <SmileOutlined className="sentiment-icon positive" />;
      case 'negative':
        return <FrownOutlined className="sentiment-icon negative" />;
      default:
        return <MehOutlined className="sentiment-icon neutral" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 0.3) return '#10b981';
    if (score < -0.3) return '#ef4444';
    return '#6b7280';
  };

  const getProgressPercent = (score: number) => {
    return Math.round(((score + 1) / 2) * 100);
  };

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
      <List
        dataSource={results}
        renderItem={(result, index) => (
          <List.Item key={result.newsId} className="news-list-item">
            <Card
              className="news-card"
              size="small"
              title={
                <div className="news-card-title">
                  <Badge
                    count={index + 1}
                    style={{ backgroundColor: '#1e40af', marginRight: 12 }}
                  />
                  <span className="title-text">
                    {result.news.title || result.news.content.substring(0, 50)}
                  </span>
                  {getSentimentTag(result.sentiment.label)}
                </div>
              }
              extra={getSentimentIcon(result.sentiment.label)}
            >
              <div className="sentiment-score-section">
                <div className="score-header">
                  <span className="score-label">情感倾向得分</span>
                  <span
                    className="score-value"
                    style={{ color: getScoreColor(result.sentiment.score) }}
                  >
                    {result.sentiment.score >= 0 ? '+' : ''}
                    {result.sentiment.score.toFixed(2)}
                  </span>
                </div>
                <Progress
                  percent={getProgressPercent(result.sentiment.score)}
                  showInfo={false}
                  strokeColor={{
                    '0%': '#ef4444',
                    '50%': '#6b7280',
                    '100%': '#10b981'
                  }}
                  trailColor="#1e293b"
                  size="small"
                />
                <div className="score-labels">
                  <span className="label-negative">利空</span>
                  <span className="label-neutral">中性</span>
                  <span className="label-positive">利好</span>
                </div>
              </div>

              <div className="sentiment-words-section">
                <Space size={[8, 8]} wrap>
                  <span className="words-label">正面词汇:</span>
                  {result.sentiment.positiveWords.length > 0 ? (
                    result.sentiment.positiveWords.map((word, i) => (
                      <Tag key={i} color="success" className="word-tag">
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
                      <Tag key={i} color="error" className="word-tag">
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
        )}
      />
    </div>
  );
};

export default SentimentTab;
