import { useState, useRef, useCallback } from 'react';
import {
  ConfigProvider,
  theme,
  App as AntdApp,
  Progress,
  Button,
  message
} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import {
  ThunderboltOutlined,
  SafetyOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import InputPanel from '@/components/InputPanel/InputPanel';
import ResultPanel from '@/components/ResultPanel/ResultPanel';
import CustomDictionaryModal from '@/components/Modals/CustomDictionaryModal';
import HistoryModal from '@/components/Modals/HistoryModal';
import { useAnalysisEngine } from '@/hooks/useAnalysisEngine';
import { NewsItem } from '@/engine/types';
import { toggleFavorite, isFavorite } from '@/store/appStore';
import './Home.css';

export default function Home() {
  const {
    results,
    stats,
    isAnalyzing,
    analyzeProgress,
    analyze,
    historyList,
    loadHistory,
    deleteHistory,
    renameHistory,
    clearAllHistory,
    exportBackup,
    importBackup,
    refreshResults
  } = useAnalysisEngine();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [dictOpen, setDictOpen] = useState(false);
  const [favoriteRevision, setFavoriteRevision] = useState(0);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = useCallback(async (news: NewsItem[], name?: string) => {
    await analyze(news, name);
  }, [analyze]);

  const handleFavoriteChange = useCallback(() => {
    setFavoriteRevision(prev => prev + 1);
    refreshResults();
  }, [refreshResults]);

  const handleImportBackupClick = useCallback(() => {
    backupInputRef.current?.click();
  }, []);

  const handleBackupFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      await importBackup(file);
      message.success('数据恢复成功');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '导入失败');
    }
  }, [importBackup]);

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
          },
          Modal: {
            colorBgElevated: 'rgba(15, 23, 42, 0.95)',
            colorIcon: '#94a3b8',
            colorIconHover: '#fff'
          },
          Table: {
            colorBgContainer: 'rgba(15, 23, 42, 0.6)',
            colorBgElevated: 'rgba(30, 41, 59, 0.8)',
            colorBorderSecondary: 'rgba(148, 163, 184, 0.1)',
            headerColor: '#e2e8f0',
            headerBg: 'rgba(30, 41, 59, 0.9)',
            rowHoverBg: 'rgba(51, 65, 85, 0.4)'
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
                  onOpenHistory={() => setHistoryOpen(true)}
                  onOpenDictionary={() => setDictOpen(true)}
                  onExportBackup={exportBackup}
                  onImportBackup={handleImportBackupClick}
                />
              </div>
              <div className="right-panel">
                <ResultPanel
                  results={results}
                  stats={stats}
                  isAnalyzing={isAnalyzing}
                  onFavoriteChange={handleFavoriteChange}
                  favoriteRevision={favoriteRevision}
                  isFavoriteFn={isFavorite}
                  toggleFavoriteFn={toggleFavorite}
                />
              </div>
            </div>
          </main>

          <footer className="app-footer">
            <p>所有分析均在浏览器本地完成，您的数据不会上传到任何服务器</p>
          </footer>

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

        <input
          ref={backupInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleBackupFileChange}
        />

        <HistoryModal
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          historyList={historyList}
          onLoad={(id) => {
            loadHistory(id);
            setHistoryOpen(false);
          }}
          onDelete={deleteHistory}
          onRename={renameHistory}
          onClearAll={clearAllHistory}
        />

        <CustomDictionaryModal
          open={dictOpen}
          onClose={() => setDictOpen(false)}
        />
      </AntdApp>
    </ConfigProvider>
  );
}
