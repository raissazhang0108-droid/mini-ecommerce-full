import { RightOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Space, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../api';
import { EmptyState, PageLoading, QueryError } from '../components/States';
import type { OrderStatus } from '../types';

export const statusMap: Record<OrderStatus, { text: string; color: string }> = {
  PENDING_PAYMENT: { text: '待支付', color: 'orange' }, PAID: { text: '待发货', color: 'blue' }, SHIPPED: { text: '运输中', color: 'cyan' }, DELIVERED: { text: '已送达', color: 'green' }, COMPLETED: { text: '已完成', color: 'green' }, CANCELLED: { text: '已取消', color: 'default' }, REFUNDING: { text: '退款中', color: 'purple' }, REFUNDED: { text: '已退款', color: 'default' },
};
export function OrdersPage() {
  const query = useQuery({ queryKey: ['orders'], queryFn: orderApi.list });
  const navigate = useNavigate();
  if (query.isLoading) return <main className="page-container"><PageLoading /></main>;
  if (query.isError) return <main className="page-container"><QueryError onRetry={() => query.refetch()} /></main>;
  return <main className="page-container"><div className="page-title"><span className="section-kicker">MY ORDERS</span><Typography.Title>我的订单</Typography.Title></div>{query.data?.length ? <div className="orders-list">{query.data.map((order) => <Card className="order-card" key={order.id} onClick={() => navigate(`/orders/${order.id}`)}><div className="order-meta"><span>订单 {order.orderNo}<small>{new Date(order.createdAt).toLocaleString('zh-CN')}</small></span><Tag color={statusMap[order.status].color}>{statusMap[order.status].text}</Tag></div><div className="order-products"><div>{order.items.slice(0, 3).map((item) => <span className="order-product-dot" key={item.id}>{item.productName.slice(0, 1)}</span>)}</div><Space><Typography.Text>{order.items.length} 件商品</Typography.Text><b>¥{order.total.toFixed(2)}</b><RightOutlined /></Space></div></Card>)}</div> : <EmptyState title="还没有订单" description="每件喜欢的东西，都值得认真挑选" action={<Button type="primary" href="/products">去逛逛</Button>} />}</main>;
}
