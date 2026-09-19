import { ArrowLeftOutlined, LockOutlined, MailOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Segmented, Typography } from 'antd';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (auth.isAuthenticated) return <Navigate to="/products" replace />;
  const submit = async (values: { account: string; password: string }) => {
    setLoading(true); setError('');
    try { await auth.login(values); navigate((location.state as { from?: string })?.from || '/products', { replace: true }); }
    catch (e) { setError(getErrorMessage(e)); } finally { setLoading(false); }
  };
  return <AuthFrame title="欢迎回来" subtitle="登录后继续你的美好生活清单">
    {error && <Alert type="error" showIcon message={error} />}
    <Form layout="vertical" size="large" onFinish={submit} requiredMark={false}>
      <Form.Item name="account" label="邮箱或手机号" rules={[{ required: true, message: '请输入邮箱或手机号' }]}><Input prefix={<MailOutlined />} placeholder="name@example.com" /></Form.Item>
      <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}><Input.Password prefix={<LockOutlined />} placeholder="请输入密码" /></Form.Item>
      <Button block type="primary" htmlType="submit" loading={loading}>登录</Button>
    </Form>
    <p className="auth-switch">还没有账号？<Link to="/register">立即注册</Link></p>
  </AuthFrame>;
}

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (auth.isAuthenticated) return <Navigate to="/products" replace />;
  const submit = async (values: { account: string; displayName: string; password: string }) => {
    setLoading(true); setError('');
    try { await auth.register({ [mode]: values.account, displayName: values.displayName, password: values.password }); navigate('/products'); }
    catch (e) { setError(getErrorMessage(e)); } finally { setLoading(false); }
  };
  return <AuthFrame title="加入栖物" subtitle="从今天开始，收藏值得的日常">
    <Segmented block value={mode} onChange={setMode} options={[{ label: '邮箱注册', value: 'email' }, { label: '手机号注册', value: 'phone' }]} />
    {error && <Alert type="error" showIcon message={error} />}
    <Form layout="vertical" size="large" onFinish={submit} requiredMark={false}>
      <Form.Item name="account" label={mode === 'email' ? '邮箱' : '手机号'} rules={[{ required: true }, mode === 'email' ? { type: 'email', message: '邮箱格式不正确' } : { pattern: /^1\d{10}$/, message: '手机号格式不正确' }]}><Input prefix={mode === 'email' ? <MailOutlined /> : <MobileOutlined />} /></Form.Item>
      <Form.Item name="displayName" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}><Input prefix={<UserOutlined />} /></Form.Item>
      <Form.Item name="password" label="密码" rules={[{ required: true }, { min: 8, message: '至少 8 位字符' }]}><Input.Password prefix={<LockOutlined />} /></Form.Item>
      <Button block type="primary" htmlType="submit" loading={loading}>创建账号</Button>
    </Form>
    <p className="auth-switch">已有账号？<Link to="/login">去登录</Link></p>
  </AuthFrame>;
}

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="auth-page"><section className="auth-story"><Link to="/products"><ArrowLeftOutlined /> 返回商店</Link><div><span className="eyebrow">QI WU ATELIER</span><Typography.Title>让每一次选择，<br />都更接近理想生活。</Typography.Title><Typography.Paragraph>克制的设计、温暖的材质，和经得起时间的日常器物。</Typography.Paragraph></div></section><Card className="auth-card"><div className="brand auth-brand">栖物<small>ATELIER</small></div><Typography.Title level={2}>{title}</Typography.Title><Typography.Paragraph type="secondary">{subtitle}</Typography.Paragraph>{children}</Card></main>;
}
