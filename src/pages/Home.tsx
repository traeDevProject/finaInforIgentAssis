import { useState, useEffect } from 'react';
import {
  ConfigProvider,
  theme,
  App as AntdApp,
  Progress,
  Modal,
  Tag,
  Tooltip,
  Button,
  message
} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import {
  ThunderboltOutlined,
  SafetyOutlined,
  GlobalOutlined,
  RobotOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import InputPanel from '@/components/InputPanel/InputPanel';
import ResultPanel from '@/components/ResultPanel/ResultPanel';
import { useAnalysisEngine } from '@/hooks/useAnalysisEngine';
import { NewsItem } from '@/engine/types';
import { EngineMode } from '@/engine';
import './Home.css';

export default function Home() {
  const {
    results,
    stats,
    isAnalyzing,
    analyzeProgress,
    analyze,
    status,
    engineMode,
    isLoadingModel,
    modelLoadProgress,
    modelLoadError,
    switchEngineMode
  } = useAnalysisEngine();

  const [showLoadModal, setShowLoadModal] = useState(false);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);

  useEffect(() => {
    if (modelLoadError) {
      message.warning(modelLoadError);
    }
  }, [modelLoadError]);

  const handleAnalyze = async (news: NewsItem[]) => {
    setNewsList(news);
    if (!status.isLoaded && engineMode === 'transformer') {
      setShowLoadModal(true);
    }
    await analyze(news);
    setShowLoadModal(false);
  };

  const handleModeSwitch = (mode: EngineMode) => {
    if (mode === 'transformer' && !isLoadingModel) {
      setShowLoadModal(true);
    }
    switchEngineMode(mode);
  };

  const handleCloseLoadModal = () => {
    if (!isLoadingModel) {
      setShowLoadModal(false);
    }
  };

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

              <div className="header-right">
                <div className="engine-selector">
                  <Tooltip title="规则引擎：快速、轻量、零延迟">
                    <Tag.CheckableTag
                      checked={engineMode === 'rule'}
                      onChange={() => handleModeSwitch('rule')}
                      className={`engine-tag ${engineMode === 'rule' ? 'active' : ''}`}
                    >
                      <FileTextOutlined /> 规则引擎
                    </Tag.CheckableTag>
                  </Tooltip>
                  <Tooltip
                    title={
                      isLoadingModel
                        ? '正在加载模型...'
                        : engineMode === 'transformer'
                        ? 'Transformer 模型已加载'
                        : 'Transformer 模型：更准确，首次需下载约 80MB'
                    }
                  >
                    <Tag.CheckableTag
                      checked={engineMode === 'transformer'}
                      onChange={() => handleModeSwitch('transformer')}
                      className={`engine-tag ${engineMode === 'transformer' ? 'active transformer' : ''}`}
                    >
                      <RobotOutlined spin={isLoadingModel} />
                      {' '}
                      AI 模型
                      {isLoadingModel && ` (${modelLoadProgress}%)`}
                    </Tag.CheckableTag>
                  </Tooltip>
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
            title={
              <span>
                <RobotOutlined /> 加载 AI 模型
              </span>
            }
            open={showLoadModal && (isLoadingModel || modelLoadError ? true : false)}
            footer={
              !isLoadingModel
                ? [
                    <Button key="close" onClick={handleCloseLoadModal}>
                      关闭
                    </Button>
                  ]
                : null
            }
            closable={!isLoadingModel}
            mask={{ closable: false }}
            width={440}
            centered
            className="load-modal"
            onCancel={handleCloseLoadModal}
          >
            <div className="load-modal-content">
              {isLoadingModel ? (
                <>
                  <div className="load-icon">
                    <RobotOutlined spin />
                  </div>
                  <p className="load-text">正在下载 AI 模型，请稍候...</p>
                  <p className="load-subtext">
                    首次使用需要下载约 80MB 模型文件，之后会缓存到浏览器
                  </p>
                  <Progress
                    percent={modelLoadProgress}
                    status="active"
                    strokeColor={{
                      '0%': '#3b82f6',
                      '100%': '#8b5cf6'
                    }}
                  />
                  <div className="load-tips">
                    <p>
                      <InfoCircleOutlined /> 小提示：
                    </p>
                    <ul>
                      <li>模型加载完成后分析速度会更快</li>
                      <li>模型缓存在浏览器中，下次使用无需重新下载</li>
                      <li>如果加载失败，可继续使用规则引擎</li>
                    </ul>
                  </div>
                </>
              ) : modelLoadError ? (
                <div className="load-error">
                  <div className="error-icon">
                    <InfoCircleOutlined />
                  </div>
                  <p className="error-title">模型加载失败</p>
                  <p className="error-message">{modelLoadError}</p>
                  <p className="error-hint">
                    您仍可以使用规则引擎进行分析，速度更快但准确度稍低。
                  </p>
                </div>
              ) : null}
            </div>
          </Modal>

          {isAnalyzing && analyzeProgress.total > 0 && (
            <div className="analyze-progress-bar">
              <div className="progress-info">
                <span>正在分析新闻...</span>
                <span>
                  {analyzeProgress.current} / {analyzeProgress.total}
                </span>
              </div>
              <Progress
                percent={Math.round(
                  (analyzeProgress.current / analyzeProgress.total) * 100
                )}
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
