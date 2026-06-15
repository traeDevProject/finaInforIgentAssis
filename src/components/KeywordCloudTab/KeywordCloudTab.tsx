import React, { useState, useMemo } from 'react';
import { Card, Tag, Tabs, List, Space } from 'antd';
import {
  BankOutlined,
  ShopOutlined,
  BarChartOutlined,
  TagsOutlined
} from '@ant-design/icons';
import { AnalysisResult, KeywordItem, KeywordCategory } from '../../engine/types';

interface KeywordCloudTabProps {
  results: AnalysisResult[];
  isLoading: boolean;
}

const categoryConfig: Record<KeywordCategory, { label: string; color: string; icon: React.ReactNode }> = {
  company: { label: '公司', color: '#3b82f6', icon: <BankOutlined /> },
  industry: { label: '行业', color: '#8b5cf6', icon: <ShopOutlined /> },
  indicator: { label: '指标', color: '#f59e0b', icon: <BarChartOutlined /> },
  other: { label: '其他', color: '#6b7280', icon: <TagsOutlined /> }
};

const KeywordCloudTab: React.FC<KeywordCloudTabProps> = ({ results, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'all' | KeywordCategory>('all');

  const allKeywords = useMemo(() => {
    const keywordMap = new Map<string, KeywordItem>();

    for (const result of results) {
      for (const kw of result.keywords) {
        const existing = keywordMap.get(kw.word);
        if (existing) {
          existing.count += kw.count;
        } else {
          keywordMap.set(kw.word, { ...kw });
        }
      }
    }

    return Array.from(keywordMap.values()).sort((a, b) => {
      const categoryPriority = { company: 4, industry: 3, indicator: 2, other: 1 };
      const priorityDiff = categoryPriority[b.category] - categoryPriority[a.category];
      if (priorityDiff !== 0) return priorityDiff;
      return b.count - a.count;
    });
  }, [results]);

  const filteredKeywords = useMemo(() => {
    if (activeTab === 'all') return allKeywords;
    return allKeywords.filter(kw => kw.category === activeTab);
  }, [allKeywords, activeTab]);

  const getWordSize = (count: number, maxCount: number) => {
    const minSize = 12;
    const maxSize = 32;
    if (maxCount === 0) return minSize;
    const ratio = count / maxCount;
    return minSize + (maxSize - minSize) * Math.sqrt(ratio);
  };

  const maxCount = useMemo(() => {
    if (filteredKeywords.length === 0) return 1;
    return Math.max(...filteredKeywords.map(k => k.count));
  }, [filteredKeywords]);

  if (isLoading) {
    return (
      <div className="loading-placeholder">
        <Card loading style={{ height: 300 }} />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="empty-state">
        <TagsOutlined className="empty-icon" />
        <p>暂无关键词数据</p>
        <span className="empty-hint">请在左侧输入新闻并点击分析</span>
      </div>
    );
  }

  return (
    <div className="keyword-cloud-tab">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as typeof activeTab)}
        size="small"
        items={[
          { key: 'all', label: `全部 (${allKeywords.length})` },
          { key: 'company', label: `公司 (${allKeywords.filter(k => k.category === 'company').length})` },
          { key: 'industry', label: `行业 (${allKeywords.filter(k => k.category === 'industry').length})` },
          { key: 'indicator', label: `指标 (${allKeywords.filter(k => k.category === 'indicator').length})` },
          { key: 'other', label: `其他 (${allKeywords.filter(k => k.category === 'other').length})` }
        ]}
      />

      <Card className="word-cloud-card" size="small">
        <div className="word-cloud-container">
          {filteredKeywords.slice(0, 50).map((keyword, index) => {
            const config = categoryConfig[keyword.category];
            const size = getWordSize(keyword.count, maxCount);
            return (
              <span
                key={keyword.word}
                className="word-cloud-item"
                style={{
                  fontSize: `${size}px`,
                  color: config.color,
                  opacity: 0.6 + 0.4 * (keyword.count / maxCount)
                }}
                title={`${keyword.word} (${keyword.count}次) - ${config.label}`}
              >
                {keyword.word}
              </span>
            );
          })}
          {filteredKeywords.length === 0 && (
            <div className="no-keywords">暂无该类别关键词</div>
          )}
        </div>
      </Card>

      <Card
        className="keyword-list-card"
        size="small"
        title={<span>关键词列表 (Top 20)</span>}
      >
        <List
          size="small"
          dataSource={filteredKeywords.slice(0, 20)}
          renderItem={(item, index) => {
            const config = categoryConfig[item.category];
            return (
              <List.Item className="keyword-list-item">
                <Space size="middle">
                  <span className="keyword-rank">{index + 1}</span>
                  <Tag color={config.color} icon={config.icon}>
                    {config.label}
                  </Tag>
                  <span className="keyword-word">{item.word}</span>
                </Space>
                <span className="keyword-count">
                  {item.count} 次
                </span>
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default KeywordCloudTab;
