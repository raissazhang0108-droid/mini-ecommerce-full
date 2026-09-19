import { CheckCircleFilled, GiftOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Divider, Form, Input, Radio, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { couponApi, orderApi } from '../api';
import { getErrorMessage } from '../api/client';
import { PageLoading, QueryError } from '../components/States';
import type { Address } from '../types';
import { SummaryRow } from './CartPage';

export function CheckoutPage() {
  const [couponId, setCouponId] = useState<string>();
  const [error, setError] = useState('');
  const { message } = App.useApp();
  const navigate = useNavigate();
  const client = useQueryClient();
  const coupons = useQuery({ queryKey: ['coupons'], queryFn: couponApi.list });
  const preview = useQuery({ queryKey: ['order-preview', couponId], queryFn: () => orderApi.preview(couponId) });
  const claim = useMutation({ mutationFn: couponApi.claim, onSuccess: () => { client.invalidateQueries({ queryKey: ['coupons'] }); message.success('优惠券已领取'); } });
  const create = useMutation({ mutationFn: (address: Address) => orderApi.create({ address, couponId }), onSuccess: (order) => { client.invalidateQueries({ queryKey: ['cart'] }); navigate(`/orders/${order.id}`); }, onError: (e) => setError(getErrorMessage(e)) });
  if (preview.isLoading) return <main className="page-container"><PageLoading /></main>;
  if (preview.isError || !preview.data) return <main className="page-container"><QueryError onRetry={() => preview.refetch()} /></main>;
  return <main className="page-container"><div className="page-title"><span className="section-kicker">CHECKOUT</span><Typography.Title>确认订单</Typography.Title></div>{error && <Alert showIcon type="error" message={error} />}<div className="checkout-grid"><section><Card className="checkout-card"><Typography.Title level={3}>收货信息</Typography.Title><Form id="checkout-form" layout="vertical" onFinish={create.mutate} requiredMark={false}><div className="form-row"><Form.Item name="recipient" label="收货人" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="phone" label="联系电话" rules={[{ required: true }]}><Input /></Form.Item></div><div className="form-row three"><Form.Item name="province" label="省" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="city" label="市" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="district" label="区" rules={[{ required: true }]}><Input /></Form.Item></div><Form.Item name="detail" label="详细地址" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item></Form></Card><Card className="checkout-card coupon-section"><Typography.Title level={3}><GiftOutlined /> 优惠券</Typography.Title><Radio.Group value={couponId} onChange={(e) => setCouponId(e.target.value)}><Radio value={undefined}>不使用优惠券</Radio>{coupons.data?.map((c) => <div className="coupon" key={c.id}><Radio value={c.id} disabled={!c.available || !c.claimed}><b>¥{c.discount}</b><span><strong>{c.name}</strong><small>{c.description}</small></span></Radio>{c.claimed ? <CheckCircleFilled className="claimed" /> : <Button size="small" onClick={() => claim.mutate(c.id)}>领取</Button>}</div>)}</Radio.Group></Card></section><Card className="summary-card"><Typography.Title level={3}>结算明细</Typography.Title>{preview.data.items.map((item) => <div className="preview-item" key={item.id}><span>{item.product.name} × {item.quantity}</span><span>¥{(item.sku.price * item.quantity).toFixed(2)}</span></div>)}<Divider /><SummaryRow label="商品金额" value={preview.data.subtotal} /><SummaryRow label="优惠" value={-preview.data.discount} /><SummaryRow label="运费" value={preview.data.shippingFee} /><Divider /><SummaryRow label="应付合计" value={preview.data.total} strong /><Button form="checkout-form" htmlType="submit" block type="primary" size="large" loading={create.isPending}>提交订单</Button><Typography.Paragraph className="safe-note">提交即表示同意商城交易规则，支付环境安全加密。</Typography.Paragraph></Card></div></main>;
}
