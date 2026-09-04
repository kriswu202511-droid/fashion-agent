import { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/agent';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await authApi.login(values.username, values.password);
      setAuth(data.user, data.access_token);
      message.success('登录成功');
      navigate('/');
    } catch {
      message.error('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { username: string; email: string; password: string }) => {
    setLoading(true);
    try {
      await authApi.register(values);
      message.success('注册成功，请登录');
    } catch {
      message.error('注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 400, borderRadius: 12 }} bordered={false}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>服装电商 AI 运营平台</h2>

        <Tabs
          centered
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form onFinish={handleLogin} layout="vertical">
                  <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large">
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form onFinish={handleRegister} layout="vertical">
                  <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
                  </Form.Item>
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
                    <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
                  </Form.Item>
                  <Form.Item name="store_name">
                    <Input prefix={<ShopOutlined />} placeholder="店铺名称（选填）" size="large" />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block size="large">
                      注册
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
