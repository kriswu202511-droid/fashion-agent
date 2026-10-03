import { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Upload, message } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { inventoryApi, type Product } from '@/services/inventory';

interface Props {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductForm({ open, product, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const isEdit = !!product;
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      if (product) {
        form.setFieldsValue(product);
        setImageUrl(product.image_url || '');
      } else {
        form.resetFields();
        setImageUrl('');
      }
    }
  }, [open, product, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const data = { ...values, image_url: imageUrl };
      if (isEdit) {
        await inventoryApi.updateProduct(product!.id, data);
        message.success('已更新');
      } else {
        await inventoryApi.createProduct(data);
        message.success('已创建');
      }
      onSuccess();
    } catch {
      // validation or API error
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑商品' : '新增商品'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
      width={600}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="sku" label="SKU" rules={[{ required: true, message: '请输入 SKU' }]}>
          <Input disabled={isEdit} placeholder="如：SKU-001" />
        </Form.Item>
        <Form.Item name="name" label="商品名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="如：碎花连衣裙" />
        </Form.Item>
        <Form.Item label="商品图片">
          <Upload
            accept=".jpg,.jpeg,.png,.webp"
            showUploadList={false}
            customRequest={async ({ file, onSuccess: onSuc, onError }) => {
              setUploading(true);
              try {
                const res = await inventoryApi.uploadImage(file as File);
                setImageUrl(res.data.url);
                onSuc?.(res.data);
              } catch (e) {
                onError?.(e as Error);
                message.error('上传失败');
              } finally {
                setUploading(false);
              }
            }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="商品图片" style={{ width: 102, height: 102, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div>
                {uploading ? <UploadOutlined /> : <PlusOutlined />}
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            )}
          </Upload>
        </Form.Item>
        <Form.Item name="category" label="品类">
          <Select
            placeholder="选择品类"
            allowClear
            options={[
              { value: '女装', label: '女装' },
              { value: '男装', label: '男装' },
              { value: '童装', label: '童装' },
              { value: '运动装', label: '运动装' },
              { value: '配饰', label: '配饰' },
            ]}
          />
        </Form.Item>
        <Form.Item name="sub_category" label="子品类">
          <Input placeholder="如：连衣裙、T恤" />
        </Form.Item>
        <Form.Item name="price" label="售价（元）">
          <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
        </Form.Item>
        <Form.Item name="cost" label="成本（元）">
          <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
        </Form.Item>
        <Form.Item name="supplier" label="供应商">
          <Input placeholder="供应商名称" />
        </Form.Item>
        <Form.Item name="tags" label="标签">
          <Input placeholder="多个标签用逗号分隔，如：碎花,夏季,甜美" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} placeholder="商品描述" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
