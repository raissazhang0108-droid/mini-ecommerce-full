import {
  CustomerServiceOutlined,
  DownOutlined,
  LogoutOutlined,
  MenuOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Drawer, Dropdown, Flex, Input, Layout, Menu, Space, Typography } from 'antd';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../hooks/useCart';

const nav = [
  { key: '/products', label: <Link to="/products">首页</Link> },
  { key: '/digital', label: <Link to="/products?category=1">数码配件</Link> },
  { key: '/home', label: <Link to="/products?category=2">家居生活</Link> },
  { key: '/sports', label: <Link to="/products?category=3">户外运动</Link> },
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
    { key: 'orders', label: '我的订单', onClick: () => navigate('/orders') },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: () => { logout(); navigate('/products'); } },
  ];

  const submitSearch = (value: string) => navigate(`/products${value ? `?keyword=${encodeURIComponent(value)}` : ''}`);

  return (
    <Layout className="store-layout">
      <div className="utility-bar">
        <div className="header-inner">
          <span>欢迎来到好物 Mall</span>
          <Space split={<span className="utility-divider" />}>
            <span><CustomerServiceOutlined /> 客户服务</span>
            <span>品质保障</span>
            <span>帮助中心</span>
          </Space>
        </div>
      </div>
      <header className="store-header">
        <div className="header-inner main-header">
          <Link className="brand" to="/products"><span className="brand-mark">好</span><span>好物<strong>Mall</strong><small>GOOD THINGS, BETTER LIFE</small></span></Link>
          <Input.Search
            className="global-search"
            size="large"
            enterButton={<><SearchOutlined /> 搜索</>}
            placeholder="搜索商品、品牌或品类"
            onSearch={submitSearch}
          />
          <Space className="header-actions" size="middle">
            <Link className="cart-entry" to="/cart"><Badge count={count} size="small"><ShoppingCartOutlined /></Badge><span>购物车</span></Link>
            {isAuthenticated ? (
              <Dropdown menu={{ items: accountItems }} placement="bottomRight"><Button className="account-button"><Avatar size={24} icon={<UserOutlined />} /> {user?.displayName}<DownOutlined /></Button></Dropdown>
            ) : <Button type="primary" onClick={() => navigate('/login')}>登录 / 注册</Button>}
            <Button className="mobile-menu" icon={<MenuOutlined />} onClick={() => setOpen(true)} />
          </Space>
        </div>
        <div className="category-nav-wrap">
          <div className="header-inner category-nav">
            <div className="all-categories"><MenuOutlined /> 全部商品分类</div>
            <Menu className="desktop-nav" mode="horizontal" selectedKeys={[location.pathname]} items={nav} />
          </div>
        </div>
      </header>
      <Drawer title="好物 Mall" open={open} onClose={() => setOpen(false)}><Menu selectedKeys={[location.pathname]} items={nav} onClick={() => setOpen(false)} /></Drawer>
      <Layout.Content><Outlet /></Layout.Content>
      <footer className="store-footer"><div className="footer-inner"><Flex justify="space-between" wrap gap={24}><div><Typography.Title level={4}>好物 Mall</Typography.Title><Typography.Text>精选好物，认真对待每一次选择。</Typography.Text></div><div className="footer-benefits"><span>正品保障</span><span>7 天无忧退换</span><span>极速发货</span><span>贴心售后</span></div></Flex><div className="footer-bottom">© 2026 好物 Mall · 让好东西更容易被发现</div></div></footer>
    </Layout>
  );
}
