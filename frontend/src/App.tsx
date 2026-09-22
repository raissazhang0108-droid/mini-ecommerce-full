import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreLayout } from './components/StoreLayout';
import { ProtectedRoute } from './components/States';
import { AuthProvider } from './contexts/AuthContext';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { TrackingPage } from './pages/TrackingPage';

export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } } });
const theme = { token: { colorPrimary: '#e0332b', colorInfo: '#e0332b', colorSuccess: '#2e7d4f', colorText: '#22221f', colorBgLayout: '#fafaf8', borderRadius: 6, fontFamily: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif' }, components: { Button: { controlHeightLG: 46, fontWeight: 600 }, Card: { borderRadiusLG: 8 }, Input: { activeBorderColor: '#e0332b', hoverBorderColor: '#e0332b' } } };

export function App() {
  return <ConfigProvider locale={zhCN} theme={theme}><AntApp><QueryClientProvider client={queryClient}><BrowserRouter><AuthProvider><Routes>
    <Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} />
    <Route element={<StoreLayout />}>
      <Route index element={<Navigate to="/products" replace />} />
      <Route path="/products" element={<ProductsPage />} /><Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
      <Route path="/orders/:orderId/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute admin><AdminOrdersPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Route>
  </Routes></AuthProvider></BrowserRouter></QueryClientProvider></AntApp></ConfigProvider>;
}
