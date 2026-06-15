import { useState, useEffect } from 'react';
import { ConfigProvider, theme, App as AntdApp, Progress, Modal } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ThunderboltOutlined, SafetyOutlined, GlobalOutlined } from '@ant-design/icons';
import InputPanel from '@/components/InputPanel/InputPanel';
import ResultPanel from '@/components/ResultPanel/ResultPanel';
import { useAnalysisEngine } from '@/hooks/useAnalysisEngine';
import { NewsItem } from '@/engine/types';
import './Home.css';

export default function Home() {
  const { results, stats, isAnalyzing, analyzeProgress, analyze, status } = useAnalysisEngine();
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);

  const handleAnalyze = async (news: NewsItem[]) => {
    setNewsList(news);
    if (!status.isLoaded) {
      setShowLoadModal(true);
    }
    await analyze(news);
    setShowLoadModal(false);
  };

  useEffect(() => {
    if (!status.isLoaded && !status.isLoading && results.length === 0) {
    }
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorInfo: '#3b82f6',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          borderRadius: 8,
          fontSize: 14
        },
        components: {
          Card: {
            colorBgContainer: 'rgba(30, 41, 59, 0.8)',
            colorBorderSecondary: 'rgba(148, 163, 184, 0.1)'
          },
          Tabs: {
            itemColor: '#94a3b8',
            itemSelectedColor: '#fff',
            itemActiveColor: '#fff'
          },
          Input: {
            colorBgContainer: 'rgba(15, 23, 42, 0.6)',
            colorBorder: 'rgba(148, 163, 184, 0.2)'
          }
        }
      }}
    >
      <AntdApp>
        <div className="app-container">
          <div className="app-background">
            <div className="bg-gradient bg-gradient-1" />
            <div className="bg-gradient bg-gradient-2" />
            <div className="bg-grid" />
          </div>

          <header className="app-header">
            <div className="header-content">
              <div className="logo-section">
                <div className="logo-icon">
                  <ThunderboltOutlined />
                </div>
                <div className="logo-text">
                  <h1>财经资讯智能助手</h1>
                  <p>本地运行 · 隐私保护 · 离线可用</p>
                </div>
              </div>
              <div className="header-badges">
                <span className="badge">
                  <SafetyOutlined /> 数据不出浏览器
                </span>
                <span className="badge">
                  <GlobalOutlined /> 纯前端运行
                </span>
              </div>
            </div>
          </header>

          <main className="app-main">
            <div className="main-content">
              <div className="left-panel">
                <InputPanel
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                  newsCount={results.length}
                />
              </div>
              <div className="right-panel">
                <ResultPanel
                  results={results}
                  stats={stats}
                  isAnalyzing={isAnalyzing}
                />
              </div>
            </div>
          </main>

          <footer className="app-footer">
            <p>所有 AI 分析均在浏览器本地完成，您的数据不会上传到任何服务器</p>
          </footer>

          <Modal
            title="正在加载分析引擎..."
            open={showLoadModal && status.isLoading}
            footer={null}
            closable={false}
            mask={{ closable: false }}
            width={400}
            centered
            className="load-modal"
          >
            <div className="load-modal-content">
              <div className="load-icon">
                <ThunderboltOutlined spin />
              </div>
              <p className="load-text">首次加载分析引擎，请稍候...</p>
              <Progress
                percent={status.loadProgress}
                status="active"
                strokeColor={{
                  '0%': '#3b82f6',
                  '100%': '#8b5cf6'
                }}
              />
              <p className="load-hint">分析引擎加载完成后将自动开始分析</p>
            </div>
          </Modal>

          {isAnalyzing && analyzeProgress.total > 0 && (
            <div className="analyze-progress-bar">
              <div className="progress-info">
                <span>正在分析新闻...</span>
                <span>{analyzeProgress.current} / {analyzeProgress.total}</span>
              </div>
              <Progress
                percent={Math.round((analyzeProgress.current / analyzeProgress.total) * 100)}
                showInfo={false}
                strokeColor="#10b981"
                size="small"
              />
            </div>
          )}
        </div>
      </AntdApp>
    </ConfigProvider>
  );
}
