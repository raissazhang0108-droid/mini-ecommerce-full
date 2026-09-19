import { CheckCircleFilled, EnvironmentOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Card, Timeline, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../api';
import { PageLoading, QueryError } from '../components/States';

export function TrackingPage() {
  const { orderId = '' } = useParams();
  const order = useQuery({ queryKey: ['order', orderId], queryFn: () => orderApi.detail(orderId) });
  const tracking = useQuery({ queryKey: ['tracking', orderId], queryFn: () => orderApi.tracking(orderId) });
  if (order.isLoading || tracking.isLoading) return <main className="page-container"><PageLoading /></main>;
  if (order.isError || tracking.isError) return <main className="page-container"><QueryError onRetry={() => { order.refetch(); tracking.refetch(); }} /></main>;
  return <main className="page-container narrow-page"><Link to={`/orders/${orderId}`}>← 返回订单</Link><div className="page-title"><span className="section-kicker">PACKAGE JOURNEY</span><Typography.Title>物流追踪</Typography.Title></div><Card className="tracking-summary"><EnvironmentOutlined /><div><Typography.Title level={3}>{order.data?.carrier ?? '等待承运商揽收'}</Typography.Title><Typography.Text copyable={Boolean(order.data?.trackingNo)}>{order.data?.trackingNo ?? '暂无物流单号'}</Typography.Text></div></Card><Card className="timeline-card"><Timeline items={(tracking.data ?? []).map((event, index) => ({ color: event.completed ? '#315e4d' : 'gray', dot: index === 0 ? <CheckCircleFilled /> : undefined, children: <div className="tracking-event"><b>{event.title}</b><p>{event.description}</p><small>{new Date(event.time).toLocaleString('zh-CN')}</small></div> }))} /></Card></main>;
}
