import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Card, Statistic, Row, Col, Space } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { AggregatedStats } from '../../engine/types';

interface SentimentDashboardProps {
  stats: AggregatedStats | null;
}

const PIE_COLORS = {
  strongly_positive: '#059669',
  positive: '#10b981',
  neutral: '#6b7280',
  negative: '#ef4444',
  strongly_negative: '#991b1b'
};

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

    const pieData = [
      {
        value: stats.strongly_positive,
        name: '强烈利好',
        itemStyle: { color: PIE_COLORS.strongly_positive }
      },
      {
        value: stats.positive,
        name: '利好',
        itemStyle: { color: PIE_COLORS.positive }
      },
      {
        value: stats.neutral,
        name: '中性',
        itemStyle: { color: PIE_COLORS.neutral }
      },
      {
        value: stats.negative,
        name: '利空',
        itemStyle: { color: PIE_COLORS.negative }
      },
      {
        value: stats.strongly_negative,
        name: '强烈利空',
        itemStyle: { color: PIE_COLORS.strongly_negative }
      }
    ].filter(d => d.value > 0);

    const bullishTotal = stats.strongly_positive + stats.positive;
    const bearishTotal = stats.strongly_negative + stats.negative;
    const bullishRatio = stats.total > 0 ? (bullishTotal / stats.total) * 100 : 0;
    const bearishRatio = stats.total > 0 ? (bearishTotal / stats.total) * 100 : 0;
    const neutralRatio = stats.total > 0 ? (stats.neutral / stats.total) * 100 : 0;

    let emotionIdxColor = PIE_COLORS.neutral;
    if (stats.averageScore >= 0.4) emotionIdxColor = PIE_COLORS.strongly_positive;
    else if (stats.averageScore >= 0.1) emotionIdxColor = PIE_COLORS.positive;
    else if (stats.averageScore <= -0.4) emotionIdxColor = PIE_COLORS.strongly_negative;
    else if (stats.averageScore <= -0.1) emotionIdxColor = PIE_COLORS.negative;

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}条 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'center',
        textStyle: {
          color: '#94a3b8',
          fontSize: 11
        },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 6
      },
      series: [
        {
          name: '情绪分布',
          type: 'pie',
          radius: ['55%', '78%'],
          center: ['32%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: 'rgba(15, 23, 42, 0.9)',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: false
            }
          },
          labelLine: {
            show: false
          },
          data: pieData
        }
      ],
      graphic: [
        {
          type: 'text',
          left: '15%',
          top: '38%',
          style: {
            text: '情绪指数',
            fontSize: 11,
            fill: '#64748b',
            textAlign: 'center'
          }
        },
        {
          type: 'text',
          left: '15%',
          top: '50%',
          style: {
            text: ((stats.averageScore + 1) * 50).toFixed(1),
            fontSize: 24,
            fontWeight: 'bold',
            fill: emotionIdxColor,
            textAlign: 'center'
          }
        },
        {
          type: 'text',
          left: '15%',
          top: '68%',
          style: {
            text: `看多 ${bullishRatio.toFixed(0)}% / 看空 ${bearishRatio.toFixed(0)}%`,
            fontSize: 10,
            fill: '#475569',
            textAlign: 'center'
          }
        }
      ]
    };

    chartInstance.current.setOption(option, true);
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

  const bullishTotal = stats.strongly_positive + stats.positive;
  const bearishTotal = stats.strongly_negative + stats.negative;

  return (
    <Card className="dashboard-card" size="small" title="整体情绪概览">
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} sm={12}>
          <div ref={chartRef} className="pie-chart" style={{ height: 180 }} />
        </Col>
        <Col xs={24} sm={12}>
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Statistic
              title="总新闻数"
              value={stats.total}
              valueStyle={{ fontSize: 20, color: '#f1f5f9' }}
              styles={{ content: { color: '#94a3b8' } }}
            />
            <Row gutter={[6, 6]}>
              <Col span={12}>
                <div style={{
                  padding: '8px 10px',
                  background: 'rgba(5, 150, 105, 0.1)',
                  border: '1px solid rgba(5, 150, 105, 0.25)',
                  borderRadius: 6,
                  textAlign: 'center'
                }}>
                  <RiseOutlined style={{ color: PIE_COLORS.strongly_positive }} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: PIE_COLORS.strongly_positive }}>
                    {stats.strongly_positive}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>强烈利好</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{
                  padding: '8px 10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 6,
                  textAlign: 'center'
                }}>
                  <ArrowUpOutlined style={{ color: PIE_COLORS.positive }} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: PIE_COLORS.positive }}>
                    {stats.positive}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>利好</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{
                  padding: '8px 10px',
                  background: 'rgba(107, 114, 128, 0.1)',
                  border: '1px solid rgba(107, 114, 128, 0.25)',
                  borderRadius: 6,
                  textAlign: 'center'
                }}>
                  <MinusOutlined style={{ color: PIE_COLORS.neutral }} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: PIE_COLORS.neutral }}>
                    {stats.neutral}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>中性</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{
                  padding: '8px 10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 6,
                  textAlign: 'center'
                }}>
                  <ArrowDownOutlined style={{ color: PIE_COLORS.negative }} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: PIE_COLORS.negative }}>
                    {stats.negative}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>利空</div>
                </div>
              </Col>
              <Col span={12} offset={6}>
                <div style={{
                  padding: '8px 10px',
                  background: 'rgba(153, 27, 27, 0.1)',
                  border: '1px solid rgba(153, 27, 27, 0.25)',
                  borderRadius: 6,
                  textAlign: 'center'
                }}>
                  <FallOutlined style={{ color: PIE_COLORS.strongly_negative }} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: PIE_COLORS.strongly_negative }}>
                    {stats.strongly_negative}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>强烈利空</div>
                </div>
              </Col>
            </Row>
            <Row gutter={8} style={{ marginTop: 4 }}>
              <Col span={12}>
                <div style={{
                  fontSize: 11,
                  color: '#10b981',
                  textAlign: 'center',
                  padding: '4px 8px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  borderRadius: 4
                }}>
                  看多合计: <strong>{bullishTotal}</strong>
                </div>
              </Col>
              <Col span={12}>
                <div style={{
                  fontSize: 11,
                  color: '#ef4444',
                  textAlign: 'center',
                  padding: '4px 8px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  borderRadius: 4
                }}>
                  看空合计: <strong>{bearishTotal}</strong>
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
