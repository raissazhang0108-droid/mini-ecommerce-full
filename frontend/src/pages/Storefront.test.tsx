import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { productApi } from '../api';
import { TOKEN_KEY } from '../api/client';
import { ProtectedRoute } from '../components/States';
import { AuthProvider } from '../contexts/AuthContext';
import { ProductsPage } from './ProductsPage';

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api');
  return { ...actual, productApi: { categories: vi.fn(), list: vi.fn(), detail: vi.fn() }, authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn() } };
});

const product = { id: 'p1', name: '晨雾马克杯', subtitle: '温暖手作釉色', description: '日常器物', categoryId: 'c1', categoryName: '餐桌', price: 89, stock: 8, skus: [{ id: 's1', name: '米白', price: 89, stock: 8 }] };
const createClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('商城核心流程', () => {
  beforeEach(() => { vi.mocked(productApi.categories).mockResolvedValue([{ id: 'c1', name: '餐桌' }]); vi.mocked(productApi.list).mockResolvedValue({ items: [product], total: 1, page: 1, pageSize: 12 }); });
  afterEach(() => { localStorage.clear(); vi.clearAllMocks(); });

  it('展示消费级商品列表并支持关键词搜索', async () => {
    render(<ConfigProvider><QueryClientProvider client={createClient()}><MemoryRouter><ProductsPage /></MemoryRouter></QueryClientProvider></ConfigProvider>);
    expect(await screen.findByText('晨雾马克杯')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('搜索心仪好物'), { target: { value: '马克杯' } });
    fireEvent.click(screen.getByRole('button', { name: 'search' }));
    await waitFor(() => expect(productApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: '马克杯' })));
  });

  it('未登录访问受保护页面会跳转登录', async () => {
    render(<QueryClientProvider client={createClient()}><MemoryRouter initialEntries={['/orders']}><AuthProvider><Routes><Route path="/login" element={<div>请先登录</div>} /><Route path="/orders" element={<ProtectedRoute><div>我的订单</div></ProtectedRoute>} /></Routes></AuthProvider></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByText('请先登录')).toBeInTheDocument();
  });

  it('JWT 会持久化在约定的本地存储键', () => {
    localStorage.setItem(TOKEN_KEY, 'token-value');
    expect(localStorage.getItem('atelier_token')).toBe('token-value');
  });
});
