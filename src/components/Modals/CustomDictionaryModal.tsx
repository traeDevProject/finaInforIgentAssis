import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Input, Select, Form, Space, message, Popconfirm, Tag, InputNumber, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { CustomDictEntry } from '../../engine/types';
import {
  getCustomDict,
  addDictEntry,
  removeDictEntry,
  clearDict,
  exportDict,
  importDict
} from '../../store/dictionaryStore';

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

const TYPE_OPTIONS = [
  { label: '正面词', value: 'positive', color: '#10b981' },
  { label: '负面词', value: 'negative', color: '#ef4444' },
  { label: '否定词', value: 'negation', color: '#6b7280' },
  { label: '程度副词', value: 'degree', color: '#3b82f6' }
];

const CustomDictionaryModal: React.FC<Props> = ({ open, onClose, onUpdated }) => {
  const [entries, setEntries] = useState<CustomDictEntry[]>([]);
  const [form] = Form.useForm();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const loadEntries = () => {
    setEntries(getCustomDict().sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open]);

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      const weight = values.type === 'negative' ? -Math.abs(values.weight || 1) : (values.weight || 1);
      addDictEntry({
        word: values.word.trim(),
        type: values.type,
        weight,
        category: values.category
      });
      message.success('已添加');
      form.resetFields(['word', 'weight', 'category']);
      loadEntries();
      onUpdated?.();
    } catch {}
  };

  const handleDelete = (word: string, type: string) => {
    removeDictEntry(word, type);
    message.success('已删除');
    loadEntries();
    onUpdated?.();
  };

  const handleClear = () => {
    clearDict();
    message.success('已清空所有自定义词汇');
    loadEntries();
    onUpdated?.();
  };

  const handleExport = () => {
    const dict = exportDict();
    const json = JSON.stringify(dict, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-dictionary-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('词典已导出');
  };

  const handleImportClick = () => {
    fileRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        message.error('文件格式不正确');
        return;
      }
      const added = importDict(data);
      message.success(`已导入 ${added} 条词汇`);
      loadEntries();
      onUpdated?.();
    } catch {
      message.error('导入失败');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const columns = [
    {
      title: '词汇',
      dataIndex: 'word',
      key: 'word',
      width: 160,
      render: (v: string) => <Tag color="blue" style={{ fontSize: 13 }}>{v}</Tag>
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (v: string) => {
        const opt = TYPE_OPTIONS.find(o => o.value === v);
        return opt ? <Tag color={opt.color}>{opt.label}</Tag> : v;
      }
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      render: (v: number) => (
        <span style={{
          fontFamily: 'monospace',
          color: v > 0 ? '#10b981' : v < 0 ? '#ef4444' : '#94a3b8'
        }}>
          {v > 0 ? '+' : ''}{v}
        </span>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (v?: string) => v || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: CustomDictEntry) => (
        <Popconfirm
          title="确定删除该词汇？"
          onConfirm={() => handleDelete(record.word, record.type)}
          okText="删除"
          cancelText="取消"
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  return (
    <Modal
      title="自定义情感词典"
      open={open}
      onCancel={onClose}
      footer={null}
      width={760}
      destroyOnClose
      className="dict-modal"
    >
      <div className="dict-modal-content">
        <div className="dict-add-section">
          <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item
              name="word"
              rules={[{ required: true, message: '请输入词汇' }]}
              style={{ minWidth: 160 }}
            >
              <Input placeholder="词汇" maxLength={20} allowClear />
            </Form.Item>
            <Form.Item
              name="type"
              rules={[{ required: true, message: '请选择类型' }]}
              initialValue="positive"
              style={{ minWidth: 130 }}
            >
              <Select
                options={TYPE_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
              />
            </Form.Item>
            <Tooltip title="正面/否定/程度：1~3；负面：-1~-3">
              <Form.Item
                name="weight"
                initialValue={1}
                style={{ minWidth: 100 }}
              >
                <InputNumber min={-3} max={3} step={0.1} placeholder="权重" style={{ width: '100%' }} />
              </Form.Item>
            </Tooltip>
            <Form.Item name="category" style={{ minWidth: 110 }}>
              <Input placeholder="分类（可选）" maxLength={15} allowClear />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="dict-toolbar" style={{ marginBottom: 12 }}>
          <Space size="small" wrap>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              共 <strong style={{ color: '#f1f5f9' }}>{entries.length}</strong> 条自定义词汇
            </span>
            <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button size="small" icon={<UploadOutlined />} onClick={handleImportClick}>
              导入
            </Button>
            <Popconfirm
              title="确定清空所有自定义词汇？"
              onConfirm={handleClear}
              okText="清空"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              disabled={entries.length === 0}
            >
              <Button size="small" danger disabled={entries.length === 0}>
                清空
              </Button>
            </Popconfirm>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={entries}
          rowKey={(r) => `${r.word}_${r.type}`}
          size="small"
          scroll={{ y: 380 }}
          pagination={{
            pageSize: 12,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`
          }}
          locale={{ emptyText: '暂无自定义词汇，请在上方添加' }}
        />

        <div className="dict-tips" style={{
          marginTop: 16,
          padding: 12,
          background: 'rgba(59, 130, 246, 0.06)',
          borderRadius: 6,
          fontSize: 12,
          color: '#94a3b8',
          lineHeight: 1.8
        }}>
          <p style={{ margin: '0 0 4px', color: '#60a5fa', fontWeight: 500 }}>使用说明：</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li><strong>正面词</strong>：默认权重 1~3，值越大情感越正面</li>
            <li><strong>负面词</strong>：默认权重 -1~-3，值越小情感越负面</li>
            <li><strong>否定词</strong>：用于反转情感（如"不"、"没有"等），建议权重 0.5~1</li>
            <li><strong>程度副词</strong>：用于修饰情感强度（如"非常"、"轻微"等），建议 1~3 表增强、0.3~0.9 表减弱</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default CustomDictionaryModal;
