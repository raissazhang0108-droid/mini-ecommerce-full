import { LogoutOutlined, MenuOutlined, ShoppingOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Badge, Button, Drawer, Dropdown, Flex, Layout, Menu, Space, Typography } from 'antd';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../hooks/useCart';

const nav = [
  { key: '/products', label: <Link to="/products">精选好物</Link> },
  { key: '/orders', label: <Link to="/orders">我的订单</Link> },
];

export function StoreLayout() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const cart = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const count = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const accountItems = [
    ...(user?.role === 'ADMIN' ? [{ key: 'admin', label: '订单管理', onClick: () => navigate('/admin/orders') }] : []),
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: () => { logout(); navigate('/products'); } },
  ];
  return (
    <Layout className="store-layout">
      <header className="store-header">
        <Link className="brand" to="/products"><span className="brand-mark"><ShoppingOutlined /></span><span>栖物<small>ATELIER</small></span></Link>
        <Menu className="desktop-nav" mode="horizontal" selectedKeys={[location.pathname]} items={nav} />
        <Space size="middle">
          <Link to="/cart" aria-label="购物车"><Badge count={count} size="small"><Button shape="circle" icon={<ShoppingCartOutlined />} /></Badge></Link>
          {isAuthenticated ? (
            <Dropdown menu={{ items: accountItems }} placement="bottomRight"><Button className="account-button"><Avatar size={24} icon={<UserOutlined />} /> {user?.displayName}</Button></Dropdown>
          ) : <Button type="primary" onClick={() => navigate('/login')}>登录</Button>}
          <Button className="mobile-menu" shape="circle" icon={<MenuOutlined />} onClick={() => setOpen(true)} />
        </Space>
      </header>
      <Drawer title="栖物导航" open={open} onClose={() => setOpen(false)}><Menu selectedKeys={[location.pathname]} items={nav} onClick={() => setOpen(false)} /></Drawer>
      <Layout.Content><Outlet /></Layout.Content>
      <footer className="store-footer"><Flex justify="space-between" wrap gap={20}><div><Typography.Title level={4}>栖物 ATELIER</Typography.Title><Typography.Text>认真挑选每一件，陪你把日常过成喜欢的样子。</Typography.Text></div><Typography.Text>安心选购 · 品质保障 · 贴心售后</Typography.Text></Flex></footer>
    </Layout>
  );
}
