import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Space,
  Tag,
  message,
  Popconfirm,
  Input,
  Tooltip,
  Empty
} from 'antd';
import {
  HistoryOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  StarOutlined,
  DashboardOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { HistoryRecord, AggregatedStats } from '../../engine/types';

interface Props {
  open: boolean;
  onClose: () => void;
  historyList?: HistoryRecord[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onClearAll: () => void;
}

const sentimentLabels: Record<string, { label: string; color: string }> = {
  strongly_positive: { label: '强烈利好', color: '#059669' },
  positive: { label: '利好', color: '#10b981' },
  neutral: { label: '中性', color: '#6b7280' },
  negative: { label: '利空', color: '#ef4444' },
  strongly_negative: { label: '强烈利空', color: '#991b1b' }
};

const HistoryModal: React.FC<Props> = ({
  open,
  onClose,
  historyList,
  onLoad,
  onDelete,
  onRename,
  onClearAll
}) => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    if (historyList) {
      setRecords(historyList);
    }
  }, [historyList, open]);

  const handleDelete = (id: string) => {
    onDelete(id);
    message.success('已删除');
  };

  const handleClear = () => {
    onClearAll();
    message.success('已清空全部历史记录');
  };

  const handleStartRename = (record: HistoryRecord) => {
    setEditingId(record.id);
    setEditingName(record.name);
  };

  const handleConfirmRename = () => {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
      message.success('已重命名');
    }
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const renderStatsBadges = (stats: AggregatedStats) => {
    const items = [];
    if (stats.strongly_positive > 0) items.push(
      <Tag key="sp" color={sentimentLabels.strongly_positive.color}>
        强烈利好 {stats.strongly_positive}
      </Tag>
    );
    if (stats.positive > 0) items.push(
      <Tag key="p" color={sentimentLabels.positive.color}>
        利好 {stats.positive}
      </Tag>
    );
    if (stats.neutral > 0) items.push(
      <Tag key="n" color={sentimentLabels.neutral.color}>
        中性 {stats.neutral}
      </Tag>
    );
    if (stats.negative > 0) items.push(
      <Tag key="ng" color={sentimentLabels.negative.color}>
        利空 {stats.negative}
      </Tag>
    );
    if (stats.strongly_negative > 0) items.push(
      <Tag key="sn" color={sentimentLabels.strongly_negative.color}>
        强烈利空 {stats.strongly_negative}
      </Tag>
    );
    return items;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.3) return '#059669';
    if (score >= 0.1) return '#10b981';
    if (score > -0.1) return '#6b7280';
    if (score > -0.3) return '#ef4444';
    return '#991b1b';
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 260,
      render: (v: string, record: HistoryRecord) => {
        if (editingId === record.id) {
          return (
            <Space.Compact size="small">
              <Input
                size="small"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onPressEnter={handleConfirmRename}
                autoFocus
                style={{ width: 160 }}
              />
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={handleConfirmRename} />
              <Button size="small" icon={<CloseOutlined />} onClick={handleCancelRename} />
            </Space.Compact>
          );
        }
        return (
          <Tooltip title={v}>
            <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{v}</span>
          </Tooltip>
        );
      }
    },
    {
      title: '新闻数',
      dataIndex: 'newsCount',
      key: 'newsCount',
      width: 80,
      align: 'center' as const,
      render: (v: number) => <Tag color="blue">{v}</Tag>
    },
    {
      title: '平均得分',
      dataIndex: ['stats', 'averageScore'],
      key: 'avgScore',
      width: 100,
      align: 'center' as const,
      render: (v: number) => (
        <span style={{
          fontWeight: 600,
          fontFamily: 'monospace',
          color: getScoreColor(v)
        }}>
          {v > 0 ? '+' : ''}{v.toFixed(2)}
        </span>
      )
    },
    {
      title: '情绪分布',
      key: 'distribution',
      render: (_: any, record: HistoryRecord) => (
        <Space size={4} wrap>
          {renderStatsBadges(record.stats)}
        </Space>
      )
    },
    {
      title: '分析时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: number) => new Date(v).toLocaleString('zh-CN', { hour12: false })
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: HistoryRecord) => (
        <Space size="small">
          <Tooltip title="载入此分析">
            <Button
              size="small"
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => onLoad(record.id)}
            >
              载入
            </Button>
          </Tooltip>
          {editingId !== record.id && (
            <Tooltip title="重命名">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleStartRename(record)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="确定删除此记录？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Modal
      title={
        <span>
          <HistoryOutlined /> 分析历史记录
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={980}
      destroyOnClose
      className="history-modal"
    >
      <div className="history-modal-content">
        <div className="history-toolbar" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="small">
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              共 <strong style={{ color: '#f1f5f9' }}>{records.length}</strong> 条历史记录
              <span style={{ marginLeft: 8 }}>
                <DashboardOutlined style={{ color: '#60a5fa' }} />
              </span>
            </span>
          </Space>
          <Popconfirm
            title="确定清空全部历史记录？此操作不可撤销。"
            onConfirm={handleClear}
            okText="清空"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            disabled={records.length === 0}
          >
            <Button size="small" danger disabled={records.length === 0}>
              清空全部
            </Button>
          </Popconfirm>
        </div>

        {records.length === 0 ? (
          <Empty
            description={
              <span style={{ color: '#64748b' }}>
                暂无历史记录
                <br />
                <span style={{ fontSize: 12 }}>分析新闻后结果会自动保存到此处</span>
              </span>
            }
            style={{ padding: '60px 0' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={records}
            rowKey="id"
            size="small"
            scroll={{ y: 420, x: 900 }}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        )}

        <div className="history-tips" style={{
          marginTop: 16,
          padding: 12,
          background: 'rgba(139, 92, 246, 0.06)',
          borderRadius: 6,
          fontSize: 12,
          color: '#94a3b8',
          lineHeight: 1.8
        }}>
          <p style={{ margin: '0 0 4px', color: '#a78bfa', fontWeight: 500 }}>
            <StarOutlined /> 功能说明
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>每次分析的结果会自动保存，最多保留 50 条记录</li>
            <li>点击"载入"按钮可恢复之前的分析结果到主界面继续查看</li>
            <li>使用"导出备份"功能可将全部历史记录保存到本地文件</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default HistoryModal;
