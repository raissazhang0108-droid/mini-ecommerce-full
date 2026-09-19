import { Alert, Button, Empty, Result, Skeleton } from 'antd';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function PageLoading({ cards = false }: { cards?: boolean }) {
  return <div className={cards ? 'product-grid' : 'page-state'}>{Array.from({ length: cards ? 4 : 1 }, (_, i) => <Skeleton key={i} active />)}</div>;
}
export function QueryError({ onRetry }: { onRetry: () => void }) {
  return <Alert className="state-alert" showIcon type="warning" message="暂时没有连上商店" description="请检查网络后重试，我们正在努力恢复。" action={<Button onClick={onRetry}>重新加载</Button>} />;
}
export function EmptyState({ title = '这里还是空的', description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<><strong>{title}</strong>{description && <p>{description}</p>}</>}>{action}</Empty>;
}
export function ProtectedRoute({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.isLoading) return <PageLoading />;
  if (!auth.isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && auth.user?.role !== 'ADMIN') return <Result status="403" title="无权访问" subTitle="此页面仅向管理员开放" />;
  return children;
}
