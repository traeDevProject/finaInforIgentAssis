import React, { useState } from 'react';
import { Tabs } from 'antd';
import {
  SmileOutlined,
  CloudOutlined,
  FileTextOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import SentimentTab from '../SentimentTab/SentimentTab';
import KeywordCloudTab from '../KeywordCloudTab/KeywordCloudTab';
import SentimentDashboard from '../SentimentDashboard/SentimentDashboard';
import SummaryTab from '../SummaryTab/SummaryTab';
import { AnalysisResult, AggregatedStats } from '../../engine/types';

interface ResultPanelProps {
  results: AnalysisResult[];
  stats: AggregatedStats | null;
  isAnalyzing: boolean;
  onFavoriteChange?: () => void;
  favoriteRevision?: number;
  isFavoriteFn?: (id: string) => boolean;
  toggleFavoriteFn?: (id: string) => boolean;
}

const ResultPanel: React.FC<ResultPanelProps> = ({
  results,
  stats,
  isAnalyzing,
  onFavoriteChange,
  favoriteRevision,
  isFavoriteFn,
  toggleFavoriteFn
}) => {
  const [activeTab, setActiveTab] = useState('sentiment');

  const tabItems = [
    {
      key: 'sentiment',
      label: (
        <span>
          <SmileOutlined />
          情感分析
        </span>
      )
    },
    {
      key: 'keywords',
      label: (
        <span>
          <CloudOutlined />
          关键词词云
        </span>
      )
    },
    {
      key: 'summary',
      label: (
        <span>
          <FileTextOutlined />
          智能摘要
        </span>
      )
    }
  ];

  return (
    <div className="result-panel">
      <div className="panel-header">
        <h2>
          <DashboardOutlined />
          分析结果
        </h2>
      </div>

      <div className="dashboard-section">
        <SentimentDashboard stats={stats} />
      </div>

      <div className="tabs-section">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          size="large"
          className="result-tabs"
        />

        <div className="tab-content">
          {activeTab === 'sentiment' && (
            <SentimentTab
              results={results}
              isLoading={isAnalyzing}
              onFavoriteChange={onFavoriteChange}
              favoriteRevision={favoriteRevision}
              isFavoriteFn={isFavoriteFn}
              toggleFavoriteFn={toggleFavoriteFn}
            />
          )}
          {activeTab === 'keywords' && (
            <KeywordCloudTab results={results} isLoading={isAnalyzing} />
          )}
          {activeTab === 'summary' && (
            <SummaryTab results={results} isLoading={isAnalyzing} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultPanel;
