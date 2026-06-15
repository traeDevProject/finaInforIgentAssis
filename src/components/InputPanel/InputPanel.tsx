import React, { useState } from 'react';
import { Button, Input, Space, message, Tag, Divider } from 'antd';
import {
  FileTextOutlined,
  ThunderboltOutlined,
  ClearOutlined,
  AppstoreOutlined,
  FileAddOutlined
} from '@ant-design/icons';
import { NewsItem } from '../../engine/types';

const { TextArea } = Input;

interface InputPanelProps {
  onAnalyze: (newsList: NewsItem[]) => void;
  isAnalyzing: boolean;
  newsCount: number;
}

const sampleNews: NewsItem[] = [
  {
    id: '1',
    title: '宁德时代一季度业绩超预期',
    content: '宁德时代发布2024年一季度财报，实现营业收入985亿元，同比增长25%；净利润120亿元，同比增长35%，业绩大超市场预期。公司动力电池出货量继续保持全球第一，市场份额进一步提升至38%。同时，公司在储能业务方面也取得突破，一季度储能电池出货量同比增长120%。分析师普遍看好公司全年表现，维持"买入"评级。'
  },
  {
    id: '2',
    title: '房地产市场持续低迷',
    content: '国家统计局数据显示，2024年1-4月全国房地产开发投资同比下降12%，商品房销售面积下降15%，销售额下降18%。重点城市新房成交量持续低迷，多个城市房价出现环比下跌。业内人士认为，房地产市场仍处于调整期，短期内难以出现明显复苏。部分房企面临较大的资金压力，债务风险值得关注。'
  },
  {
    id: '3',
    title: '央行宣布降准0.5个百分点',
    content: '中国人民银行宣布，下调金融机构存款准备金率0.5个百分点，预计释放长期资金约1万亿元。此次降准旨在优化金融机构资金结构，增强金融机构支持实体经济的能力。市场分析认为，降准将有助于降低社会融资成本，对股市、债市均构成利好。预计后续可能还有进一步的宽松政策出台。'
  },
  {
    id: '4',
    title: 'AI概念板块持续走强',
    content: '今日A股市场人工智能板块再度走强，多只相关个股涨停。科大讯飞、海康威视等龙头股均创出阶段新高。消息面上，国内多家科技公司相继发布大模型产品，AI应用落地速度加快。机构研报指出，AI产业正处于从技术突破向商业化落地的关键阶段，相关产业链公司有望迎来业绩爆发期。建议投资者关注算力、算法、应用三大方向的投资机会。'
  },
  {
    id: '5',
    title: '消费数据低于预期',
    content: '最新发布的社会消费品零售总额数据显示，4月同比增长2.5%，增速较上月回落1.2个百分点，低于市场预期。其中，餐饮收入增速放缓，商品零售表现疲软。分析认为，居民消费信心仍待恢复，收入预期不稳是制约消费的主要因素。促消费政策需要进一步加码发力。'
  }
];

const InputPanel: React.FC<InputPanelProps> = ({ onAnalyze, isAnalyzing, newsCount }) => {
  const [inputText, setInputText] = useState('');
  const [parseMode, setParseMode] = useState<'single' | 'batch'>('batch');

  const parseNewsItems = (text: string): NewsItem[] => {
    if (!text.trim()) return [];

    if (parseMode === 'single') {
      return [{
        id: Date.now().toString(),
        content: text.trim(),
        title: text.trim().substring(0, 50)
      }];
    }

    const blocks = text.split(/\n\s*\n/).filter(block => block.trim().length > 10);

    if (blocks.length > 1) {
      return blocks.map((block, index) => {
        const lines = block.trim().split('\n');
        const title = lines[0].trim().substring(0, 80);
        const content = block.trim();
        return {
          id: `${Date.now()}-${index}`,
          title,
          content
        };
      });
    }

    const sentences = text.split(/[。！？；]/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > 200 && currentChunk.length > 50) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence + '。';
      } else {
        currentChunk += sentence + '。';
      }
    }

    if (currentChunk.trim().length > 10) {
      chunks.push(currentChunk.trim());
    }

    if (chunks.length <= 1) {
      return [{
        id: Date.now().toString(),
        content: text.trim(),
        title: text.trim().substring(0, 50)
      }];
    }

    return chunks.map((chunk, index) => ({
      id: `${Date.now()}-${index}`,
      title: chunk.substring(0, 50),
      content: chunk
    }));
  };

  const handleAnalyze = () => {
    const newsList = parseNewsItems(inputText);
    if (newsList.length === 0) {
      message.warning('请输入有效的新闻文本');
      return;
    }
    onAnalyze(newsList);
  };

  const handleLoadSample = () => {
    const sampleText = sampleNews.map((n, i) => `【新闻${i + 1}】${n.title}\n${n.content}`).join('\n\n');
    setInputText(sampleText);
    setParseMode('batch');
    message.success('已加载示例数据');
  };

  const handleClear = () => {
    setInputText('');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      message.success('已粘贴剪贴板内容');
    } catch {
      message.warning('无法访问剪贴板，请手动粘贴');
    }
  };

  return (
    <div className="input-panel">
      <div className="panel-header">
        <h2>
          <FileTextOutlined />
          新闻输入
        </h2>
        <div className="mode-switcher">
          <Space size="small">
            <Tag.CheckableTag
              checked={parseMode === 'batch'}
              onChange={() => setParseMode('batch')}
            >
              <AppstoreOutlined /> 批量模式
            </Tag.CheckableTag>
            <Tag.CheckableTag
              checked={parseMode === 'single'}
              onChange={() => setParseMode('single')}
            >
              <FileAddOutlined /> 单篇模式
            </Tag.CheckableTag>
          </Space>
        </div>
      </div>

      <div className="input-tips">
        {parseMode === 'batch'
          ? '支持粘贴多条新闻，空行分隔或自动分段'
          : '将整段文本作为单篇新闻分析'}
      </div>

      <TextArea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={
          parseMode === 'batch'
            ? '在此粘贴多条财经新闻，用空行分隔每条新闻...\n\n支持批量粘贴，系统会自动识别分段。'
            : '在此粘贴财经新闻文本...'
        }
        autoSize={{ minRows: 15, maxRows: 25 }}
        className="news-textarea"
      />

      <Divider className="panel-divider" />

      <div className="panel-actions">
        <Space wrap>
          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={handleAnalyze}
            loading={isAnalyzing}
            disabled={!inputText.trim()}
            className="analyze-btn"
          >
            {isAnalyzing ? '分析中...' : `开始分析 (${parseNewsItems(inputText).length}条)`}
          </Button>
          <Button onClick={handlePaste} disabled={isAnalyzing}>
            粘贴文本
          </Button>
          <Button onClick={handleLoadSample} disabled={isAnalyzing}>
            加载示例
          </Button>
          <Button onClick={handleClear} icon={<ClearOutlined />} disabled={isAnalyzing}>
            清空
          </Button>
        </Space>
      </div>

      {newsCount > 0 && (
        <div className="news-count-info">
          当前已分析 <strong>{newsCount}</strong> 条新闻
        </div>
      )}
    </div>
  );
};

export default InputPanel;
