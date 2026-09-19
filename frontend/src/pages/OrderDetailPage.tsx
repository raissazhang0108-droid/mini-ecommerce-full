import { EnvironmentOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Descriptions, Divider, Input, Modal, Popconfirm, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../api';
import { PageLoading, QueryError } from '../components/States';
import { SummaryRow } from './CartPage';
import { statusMap } from './OrdersPage';

export function OrderDetailPage() {
  const { orderId = '' } = useParams();
  const [refundOpen, setRefundOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { message } = App.useApp();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['order', orderId], queryFn: () => orderApi.detail(orderId) });
  const mutationOptions = { onSuccess: () => { client.invalidateQueries({ queryKey: ['order', orderId] }); client.invalidateQueries({ queryKey: ['orders'] }); message.success('订单状态已更新'); }, onError: () => message.error('操作失败，请稍后重试') };
  const pay = useMutation({ mutationFn: () => orderApi.pay(orderId), ...mutationOptions });
  const cancel = useMutation({ mutationFn: () => orderApi.cancel(orderId), ...mutationOptions });
  const complete = useMutation({ mutationFn: () => orderApi.complete(orderId), ...mutationOptions });
  const refund = useMutation({ mutationFn: () => orderApi.refund(orderId, reason), ...mutationOptions, onSuccess: () => { mutationOptions.onSuccess(); setRefundOpen(false); } });
  if (query.isLoading) return <main className="page-container"><PageLoading /></main>;
  if (query.isError || !query.data) return <main className="page-container"><QueryError onRetry={() => query.refetch()} /></main>;
  const order = query.data; const status = statusMap[order.status];
  return <main className="page-container"><Card className="order-status-panel"><span className="section-kicker">ORDER {order.orderNo}</span><div><Typography.Title>{status.text}</Typography.Title><Tag color={status.color}>{status.text}</Tag></div><Typography.Text>{order.status === 'PENDING_PAYMENT' ? '请尽快完成支付，为你保留心仪好物' : order.status === 'SHIPPED' ? '包裹正在向你奔来，请保持电话畅通' : '感谢你选择栖物，每个订单都被认真对待'}</Typography.Text><Space wrap>{order.status === 'PENDING_PAYMENT' && <><Button type="primary" loading={pay.isPending} onClick={() => pay.mutate()}>模拟支付</Button><Popconfirm title="确认取消这个订单？" onConfirm={() => cancel.mutate()}><Button>取消订单</Button></Popconfirm></>}{['PAID', 'SHIPPED'].includes(order.status) && <Button onClick={() => setRefundOpen(true)}>申请退款</Button>}{order.status === 'DELIVERED' && <Button type="primary" loading={complete.isPending} onClick={() => complete.mutate()}>确认收货</Button>}{['SHIPPED', 'DELIVERED'].includes(order.status) && <Link to={`/orders/${order.id}/tracking`}><Button type="primary">查看物流</Button></Link>}</Space></Card><div className="order-detail-grid"><section><Card className="checkout-card"><Typography.Title level={3}>商品信息</Typography.Title>{order.items.map((item) => <div className="line-item" key={item.id}><span className="order-product-dot">{item.productName.slice(0, 1)}</span><span><b>{item.productName}</b><small>{item.skuName} × {item.quantity}</small></span><strong>¥{(item.price * item.quantity).toFixed(2)}</strong></div>)}</Card><Card className="checkout-card"><Typography.Title level={3}><EnvironmentOutlined /> 收货信息</Typography.Title><Descriptions column={1} items={[{ key: 'name', label: '收货人', children: `${order.address.recipient} ${order.address.phone}` }, { key: 'address', label: '地址', children: `${order.address.province}${order.address.city}${order.address.district}${order.address.detail}` }]} /></Card></section><Card className="summary-card"><Typography.Title level={3}>订单信息</Typography.Title><p>下单时间<br /><b>{new Date(order.createdAt).toLocaleString('zh-CN')}</b></p>{order.trackingNo && <p>物流单号<br /><b>{order.carrier} · {order.trackingNo}</b></p>}<Divider /><SummaryRow label="优惠" value={-order.discount} /><SummaryRow label="实付" value={order.total} strong /></Card></div><Modal title="申请退款" open={refundOpen} confirmLoading={refund.isPending} okButtonProps={{ disabled: !reason.trim() }} onOk={() => refund.mutate()} onCancel={() => setRefundOpen(false)}><Input.TextArea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="请简单说明退款原因" /></Modal></main>;
}
