import { useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Upload,
  message,
  Popconfirm,
  Tag,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { inventoryApi, type Product } from '@/services/inventory';
import ProductForm from './ProductForm';

const { Title } = Typography;

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const { data } = await inventoryApi.listProducts({
        page: p,
        page_size: 20,
        keyword: keyword || undefined,
        category,
      });
      setProducts(data.items);
      setTotal(data.total);
      setPage(p);
    } catch {
      message.error('加载商品列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, keyword, category]);

  const handleDelete = async (id: string) => {
    try {
      await inventoryApi.deleteProduct(id);
      message.success('已删除');
      fetchProducts();
    } catch {
      message.error('删除失败');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const { data } = await inventoryApi.importExcel(file);
      message.success(data.message);
      fetchProducts();
    } catch {
      message.error('导入失败，请检查文件格式');
    }
    return false;
  };

  const handleExport = async () => {
    try {
      const response = await inventoryApi.exportExcel();
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('导出失败');
    }
  };

  const columns: ColumnsType<Product> = [
    { title: 'SKU', dataIndex: 'sku', width: 120 },
    { title: '名称', dataIndex: 'name', width: 180, ellipsis: true },
    { title: '品类', dataIndex: 'category', width: 100 },
    { title: '售价', dataIndex: 'price', width: 90, render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '成本', dataIndex: 'cost', width: 90, render: (v: number) => `¥${v.toFixed(2)}` },
    {
      title: '利润率',
      width: 90,
      render: (_, r) => {
        if (!r.price || !r.cost) return '-';
        return `${(((r.price - r.cost) / r.price) * 100).toFixed(1)}%`;
      },
    },
    { title: '供应商', dataIndex: 'supplier', width: 120, ellipsis: true },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 160,
      render: (v: string) =>
        v ? v.split(',').map((t) => <Tag key={t}>{t.trim()}</Tag>) : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: string) => (
        <Tag color={v === 'active' ? 'green' : 'default'}>
          {v === 'active' ? '在售' : '停售'}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingProduct(record);
              setFormOpen(true);
            }}
          />
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Title level={3}>库存管理</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索 SKU / 名称"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => fetchProducts(1)}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="品类筛选"
            value={category}
            onChange={(v) => {
              setCategory(v);
              fetchProducts(1);
            }}
            allowClear
            style={{ width: 140 }}
            options={[
              { value: '女装', label: '女装' },
              { value: '男装', label: '男装' },
              { value: '童装', label: '童装' },
              { value: '运动装', label: '运动装' },
              { value: '配饰', label: '配饰' },
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchProducts(1)}>
            搜索
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => { setEditingProduct(null); setFormOpen(true); }}>
            新增商品
          </Button>
          <Upload accept=".xlsx,.xls" beforeUpload={handleImport} showUploadList={false}>
            <Button icon={<UploadOutlined />}>导入 Excel</Button>
          </Upload>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出 Excel
          </Button>
        </Space>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={products}
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: fetchProducts,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />

      <ProductForm
        open={formOpen}
        product={editingProduct}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          fetchProducts();
        }}
      />
    </div>
  );
}
