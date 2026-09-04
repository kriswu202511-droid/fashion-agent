import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Tabs, message, Spin, Select, Divider } from 'antd';
import { ShopOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { settingsApi } from '@/services/agent';
import { useAuthStore } from '@/stores/authStore';
import type { TenantSettings } from '@/types';

const { TextArea } = Input;

const platformOptions = [
  { value: 'taobao', label: '淘宝/天猫' },
  { value: 'jd', label: '京东' },
  { value: 'douyin', label: '抖音电商' },
  { value: 'pinduoduo', label: '拼多多' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'wechat', label: '微信小程序' },
  { value: 'other', label: '其他' },
];

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm] = Form.useForm();
  const [settingsForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data } = await settingsApi.getProfile();
      if (data.user) {
        profileForm.setFieldsValue({
          display_name: data.user.display_name,
          email: data.user.email,
        });
      }
      if (data.settings) {
        settingsForm.setFieldsValue(data.settings);
      }
    } catch {
      message.error('加载设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (values: { display_name?: string; email?: string }) => {
    setSaving(true);
    try {
      await settingsApi.updateProfile(values);
      message.success('个人信息已更新');
    } catch {
      message.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (values: Partial<TenantSettings>) => {
    setSaving(true);
    try {
      const { data } = await settingsApi.update(values);
      settingsForm.setFieldsValue(data);
      message.success('店铺设置已更新');
    } catch {
      message.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>设置</h2>

      <Tabs
        items={[
          {
            key: 'profile',
            label: (
              <span>
                <UserOutlined /> 个人信息
              </span>
            ),
            children: (
              <Card>
                <Form form={profileForm} layout="vertical" onFinish={handleSaveProfile}>
                  <Form.Item label="用户名">
                    <Input value={user?.username} disabled />
                  </Form.Item>
                  <Form.Item name="display_name" label="显示名称">
                    <Input placeholder="您的昵称" />
                  </Form.Item>
                  <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
                    <Input placeholder="邮箱地址" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={saving}>
                      保存
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'store',
            label: (
              <span>
                <ShopOutlined /> 店铺设置
              </span>
            ),
            children: (
              <Card>
                <Form form={settingsForm} layout="vertical" onFinish={handleSaveSettings}>
                  <Divider orientation="left">基本信息</Divider>
                  <Form.Item name="store_name" label="店铺名称">
                    <Input prefix={<ShopOutlined />} placeholder="您的店铺名称" />
                  </Form.Item>
                  <Form.Item name="store_platform" label="经营平台">
                    <Select options={platformOptions} placeholder="选择主要经营平台" allowClear />
                  </Form.Item>
                  <Form.Item name="store_category" label="经营品类">
                    <Input placeholder="如：女装、男装、童装" />
                  </Form.Item>
                  <Form.Item name="brand_style" label="品牌风格">
                    <Input placeholder="如：简约、复古、街头潮流" />
                  </Form.Item>
                  <Form.Item name="target_audience" label="目标人群">
                    <Input placeholder="如：18-30岁女性、职场白领" />
                  </Form.Item>
                  <Form.Item name="price_range" label="价格区间">
                    <Input placeholder="如：100-500元" />
                  </Form.Item>

                  <Divider orientation="left">联系方式</Divider>
                  <Form.Item name="contact_phone" label="联系电话">
                    <Input placeholder="客服电话" />
                  </Form.Item>
                  <Form.Item name="contact_wechat" label="微信号">
                    <Input placeholder="客服微信号" />
                  </Form.Item>

                  <Divider orientation="left">客服策略</Divider>
                  <Form.Item name="return_policy" label="退换货政策">
                    <TextArea rows={3} placeholder="描述您的退换货政策，AI 客服将参考此信息回复客户" />
                  </Form.Item>
                  <Form.Item name="shipping_policy" label="发货政策">
                    <TextArea rows={3} placeholder="描述发货时间、快递方式等信息" />
                  </Form.Item>
                  <Form.Item name="faq_extra" label="补充 FAQ">
                    <TextArea rows={3} placeholder="其他常见问题和回答，每行一个问答对（问题：回答）" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={saving}>
                      保存设置
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'policies',
            label: (
              <span>
                <FileTextOutlined /> 关于
              </span>
            ),
            children: (
              <Card>
                <h3>服装电商 AI 运营平台</h3>
                <p style={{ color: '#666', marginTop: 8 }}>
                  为服装电商卖家提供一站式 AI 数字运营解决方案。
                </p>
                <Divider />
                <p><strong>账号信息</strong></p>
                <p>用户 ID：{user?.id}</p>
                <p>角色：{user?.role === 'admin' ? '管理员' : '普通用户'}</p>
                <p>注册时间：{user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}</p>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
