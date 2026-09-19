import { DeleteOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Button, Card, Divider, InputNumber, Popconfirm, Space, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { Price, ProductCover } from '../components/ProductCard';
import { EmptyState, PageLoading, QueryError } from '../components/States';
import { useCart, useCartActions } from '../hooks/useCart';

export function CartPage() {
  const cart = useCart();
  const actions = useCartActions();
  const navigate = useNavigate();
  if (cart.isLoading) return <main className="page-container"><PageLoading /></main>;
  if (cart.isError) return <main className="page-container"><QueryError onRetry={() => cart.refetch()} /></main>;
  if (!cart.data?.items.length) return <main className="page-container empty-page"><EmptyState title="购物车还是空的" description="去发现一些值得带回家的好物吧" action={<Button type="primary" href="/products" icon={<ShoppingOutlined />}>去逛逛</Button>} /></main>;
  return <main className="page-container"><div className="page-title"><span className="section-kicker">YOUR BAG</span><Typography.Title level={1}>购物车 <small>{cart.data.items.length} 件好物</small></Typography.Title></div><div className="checkout-grid"><section className="cart-list">{cart.data.items.map((item) => <Card key={item.id} className="cart-item"><div className="cart-thumb"><ProductCover product={item.product} /></div><div className="cart-copy"><Link to={`/products/${item.product.id}`}><Typography.Title level={4}>{item.product.name}</Typography.Title></Link><Typography.Text type="secondary">{item.sku.name}</Typography.Text><Price value={item.sku.price} /><InputNumber min={1} max={item.sku.stock} value={item.quantity} onChange={(quantity) => actions.update.mutate({ id: item.id, quantity: quantity ?? 1 })} /></div><Button danger type="text" aria-label="删除商品" icon={<DeleteOutlined />} onClick={() => actions.remove.mutate(item.id)} /></Card>)}</section><Card className="summary-card"><Typography.Title level={3}>订单小计</Typography.Title><SummaryRow label="商品金额" value={cart.data.subtotal} /><SummaryRow label="优惠" value={-cart.data.discount} /><SummaryRow label="配送" text="结算时计算" /><Divider /><SummaryRow label="合计" value={cart.data.total} strong /><Button block type="primary" size="large" onClick={() => navigate('/checkout')}>去结算</Button><Popconfirm title="确定清空购物车？" onConfirm={() => actions.clear.mutate()}><Button block type="text" danger>清空购物车</Button></Popconfirm></Card></div></main>;
}
export function SummaryRow({ label, value, text, strong }: { label: string; value?: number; text?: string; strong?: boolean }) { return <Space className={`summary-row ${strong ? 'strong' : ''}`}><span>{label}</span><span>{text ?? `${value && value < 0 ? '-' : ''}¥${Math.abs(value ?? 0).toFixed(2)}`}</span></Space>; }
