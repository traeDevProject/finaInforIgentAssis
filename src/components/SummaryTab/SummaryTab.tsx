import React from 'react';
import { Card, List, Tag, Badge, Space } from 'antd';
import { FileTextOutlined, HighlightOutlined } from '@ant-design/icons';
import { AnalysisResult } from '../../engine/types';

interface SummaryTabProps {
  results: AnalysisResult[];
  isLoading: boolean;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ results, isLoading }) => {
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
        <FileTextOutlined className="empty-icon" />
        <p>暂无摘要数据</p>
        <span className="empty-hint">请在左侧输入新闻并点击分析</span>
      </div>
    );
  }

  return (
    <div className="summary-tab">
      <List
        dataSource={results}
        renderItem={(result, index) => (
          <List.Item key={result.newsId} className="news-list-item">
            <Card
              className="summary-card"
              size="small"
              title={
                <div className="summary-card-title">
                  <Badge
                    count={index + 1}
                    style={{ backgroundColor: '#1e40af', marginRight: 12 }}
                  />
                  <span className="title-text">
                    {result.news.title || result.news.content.substring(0, 50)}
                  </span>
                </div>
              }
            >
              <div className="summary-section">
                <div className="section-header">
                  <HighlightOutlined className="section-icon" />
                  <span className="section-title">核心要点</span>
                </div>
                <div className="summary-sentences">
                  {result.summary.sentences.map((sentence, i) => (
                    <div key={i} className="summary-sentence">
                      <span className="sentence-number">{i + 1}</span>
                      <span className="sentence-text">{sentence}</span>
                    </div>
                  ))}
                  {result.summary.sentences.length === 0 && (
                    <div className="no-summary">
                      文本较短，暂无摘要
                    </div>
                  )}
                </div>
              </div>

              <div className="summary-keywords-section">
                <div className="section-header">
                  <FileTextOutlined className="section-icon" />
                  <span className="section-title">关键词</span>
                </div>
                <Space size={[6, 6]} wrap className="summary-keywords">
                  {result.summary.keywords.map((kw, i) => (
                    <Tag key={i} color="blue" className="keyword-tag">
                      {kw}
                    </Tag>
                  ))}
                  {result.summary.keywords.length === 0 && (
                    <span className="no-keywords">无</span>
                  )}
                </Space>
              </div>

              <div className="full-text-section">
                <div className="section-header">
                  <FileTextOutlined className="section-icon" />
                  <span className="section-title">原文</span>
                </div>
                <p className="full-text">{result.news.content}</p>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default SummaryTab;
