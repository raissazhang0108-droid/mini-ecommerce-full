import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { useState } from 'react';
import { adminApi } from '../api';
import { QueryError } from '../components/States';
import type { Order } from '../types';
import { statusMap } from './OrdersPage';

export function AdminOrdersPage() {
  const [status, setStatus] = useState<string>();
  const [shipping, setShipping] = useState<Order>();
  const [form] = Form.useForm();
  const client = useQueryClient();
  const { message } = App.useApp();
  const orders = useQuery({ queryKey: ['admin-orders', status], queryFn: () => adminApi.orders(status) });
  const refresh = () => client.invalidateQueries({ queryKey: ['admin-orders'] });
  const ship = useMutation({ mutationFn: (values: { carrier: string; trackingNo: string }) => adminApi.ship(shipping!.id, values), onSuccess: () => { message.success('已发货'); setShipping(undefined); form.resetFields(); refresh(); }, onError: () => message.error('发货失败') });
  const deliver = useMutation({ mutationFn: adminApi.deliver, onSuccess: () => { message.success('已确认送达'); refresh(); } });
  return <main className="page-container admin-page"><div className="page-title"><span className="section-kicker">ADMIN CONSOLE</span><Typography.Title>订单管理</Typography.Title><Typography.Paragraph>处理发货与履约状态</Typography.Paragraph></div><div className="admin-toolbar"><Select allowClear placeholder="全部状态" value={status} onChange={setStatus} options={Object.entries(statusMap).map(([value, x]) => ({ value, label: x.text }))} /></div>{orders.isError ? <QueryError onRetry={() => orders.refetch()} /> : <Table rowKey="id" loading={orders.isLoading} dataSource={orders.data} scroll={{ x: 900 }} columns={[{ title: '订单号', dataIndex: 'orderNo' }, { title: '用户/收货人', render: (_, o) => o.address.recipient }, { title: '下单时间', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleString('zh-CN') }, { title: '金额', dataIndex: 'total', render: (v) => `¥${v.toFixed(2)}` }, { title: '状态', dataIndex: 'status', render: (v) => <Tag color={statusMap[v as keyof typeof statusMap].color}>{statusMap[v as keyof typeof statusMap].text}</Tag> }, { title: '操作', fixed: 'right', render: (_, o) => <Space>{o.status === 'PAID' && <Button type="primary" size="small" onClick={() => setShipping(o)}>发货</Button>}{o.status === 'SHIPPED' && <Button size="small" onClick={() => deliver.mutate(o.id)}>标记送达</Button>}</Space> }]} />}<Modal title={`订单 ${shipping?.orderNo} 发货`} open={Boolean(shipping)} onOk={() => form.submit()} confirmLoading={ship.isPending} onCancel={() => setShipping(undefined)}><Form form={form} layout="vertical" onFinish={ship.mutate}><Form.Item name="carrier" label="物流公司" rules={[{ required: true }]}><Input placeholder="例如：顺丰速运" /></Form.Item><Form.Item name="trackingNo" label="物流单号" rules={[{ required: true }]}><Input /></Form.Item></Form></Modal></main>;
}
