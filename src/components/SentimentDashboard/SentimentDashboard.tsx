import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card, Statistic, Row, Col, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { AggregatedStats } from '../../engine/types';

interface SentimentDashboardProps {
  stats: AggregatedStats | null;
}

const SentimentDashboard: React.FC<SentimentDashboardProps> = ({ stats }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!stats) return;

    if (!chartInstance.current && chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (!chartInstance.current) return;

    const positivePercent = stats.total > 0 ? (stats.positive / stats.total) * 100 : 0;
    const negativePercent = stats.total > 0 ? (stats.negative / stats.total) * 100 : 0;
    const neutralPercent = stats.total > 0 ? (stats.neutral / stats.total) * 100 : 0;

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}条 ({d}%)'
      },
      series: [
        {
          name: '情绪分布',
          type: 'pie',
          radius: ['55%', '80%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: 'rgba(15, 23, 42, 0.8)',
            borderWidth: 3
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 18,
              fontWeight: 'bold',
              color: '#fff'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: stats.positive, name: '利好', itemStyle: { color: '#10b981' } },
            { value: stats.neutral, name: '中性', itemStyle: { color: '#6b7280' } },
            { value: stats.negative, name: '利空', itemStyle: { color: '#ef4444' } }
          ]
        }
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '42%',
          style: {
            text: '情绪指数',
            fontSize: 12,
            fill: '#94a3b8',
            textAlign: 'center'
          }
        },
        {
          type: 'text',
          left: 'center',
          top: '52%',
          style: {
            text: ((stats.averageScore + 1) * 50).toFixed(1),
            fontSize: 28,
            fontWeight: 'bold',
            fill: stats.averageScore >= 0 ? '#10b981' : '#ef4444',
            textAlign: 'center'
          }
        }
      ]
    };

    chartInstance.current.setOption(option);
  }, [stats]);

  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!stats) {
    return (
      <Card className="dashboard-card" size="small">
        <div className="dashboard-empty">
          <MinusOutlined className="empty-icon" />
          <p>暂无数据，请先输入新闻并分析</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="dashboard-card" size="small" title="整体情绪概览">
      <Row gutter={16} align="middle">
        <Col span={10}>
          <div ref={chartRef} className="pie-chart" style={{ height: 180 }} />
        </Col>
        <Col span={14}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Statistic
              title="总新闻数"
              value={stats.total}
              valueStyle={{ fontSize: 20 }}
            />
            <Row gutter={8}>
              <Col span={8}>
                <div className="sentiment-stat positive">
                  <ArrowUpOutlined />
                  <span className="stat-count">{stats.positive}</span>
                  <span className="stat-label">利好</span>
                </div>
              </Col>
              <Col span={8}>
                <div className="sentiment-stat neutral">
                  <MinusOutlined />
                  <span className="stat-count">{stats.neutral}</span>
                  <span className="stat-label">中性</span>
                </div>
              </Col>
              <Col span={8}>
                <div className="sentiment-stat negative">
                  <ArrowDownOutlined />
                  <span className="stat-count">{stats.negative}</span>
                  <span className="stat-label">利空</span>
                </div>
              </Col>
            </Row>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default SentimentDashboard;
