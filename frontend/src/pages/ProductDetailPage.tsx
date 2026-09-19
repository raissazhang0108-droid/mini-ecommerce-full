import { MinusOutlined, PlusOutlined, SafetyCertificateOutlined, ShoppingCartOutlined, TruckOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb, Button, Divider, InputNumber, Radio, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { productApi } from '../api';
import { Price, ProductCover } from '../components/ProductCard';
import { PageLoading, QueryError } from '../components/States';
import { useAuth } from '../contexts/AuthContext';
import { useCartActions } from '../hooks/useCart';

export function ProductDetailPage() {
  const { productId = '' } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const actions = useCartActions();
  const query = useQuery({ queryKey: ['product', productId], queryFn: () => productApi.detail(productId) });
  const [skuId, setSkuId] = useState('');
  const [quantity, setQuantity] = useState(1);
  if (query.isLoading) return <main className="page-container"><PageLoading /></main>;
  if (query.isError || !query.data) return <main className="page-container"><QueryError onRetry={() => query.refetch()} /></main>;
  const product = query.data;
  const selected = product.skus.find((s) => s.id === skuId) ?? product.skus.find((s) => s.stock > 0);
  const add = () => {
    if (!isAuthenticated) { navigate('/login', { state: { from: location.pathname } }); return; }
    if (!selected) return;
    actions.add.mutate({ productId: product.id, skuId: selected.id, quantity });
  };
  return <main className="page-container detail-page"><Breadcrumb items={[{ title: <Link to="/products">精选好物</Link> }, { title: product.categoryName }, { title: product.name }]} />
    <div className="detail-grid"><ProductCover product={product} large /><section className="product-info">{product.badge && <Tag color="orange">{product.badge}</Tag>}<Typography.Title>{product.name}</Typography.Title><Typography.Paragraph className="subtitle">{product.subtitle}</Typography.Paragraph><Price value={selected?.price ?? product.price} original={product.originalPrice} /><Divider /><Typography.Text strong>选择规格</Typography.Text><Radio.Group className="sku-options" value={selected?.id} onChange={(e) => setSkuId(e.target.value)}>{product.skus.map((sku) => <Radio.Button key={sku.id} value={sku.id} disabled={!sku.stock}>{sku.name} · 库存 {sku.stock}</Radio.Button>)}</Radio.Group><Typography.Text strong>数量</Typography.Text><Space.Compact className="quantity"><Button icon={<MinusOutlined />} onClick={() => setQuantity(Math.max(1, quantity - 1))} /><InputNumber controls={false} min={1} max={selected?.stock ?? product.stock} value={quantity} onChange={(v) => setQuantity(v ?? 1)} /><Button icon={<PlusOutlined />} onClick={() => setQuantity(quantity + 1)} /></Space.Compact><Button className="add-button" size="large" type="primary" icon={<ShoppingCartOutlined />} disabled={!selected} loading={actions.add.isPending} onClick={add}>加入购物车</Button><div className="detail-benefits"><span><TruckOutlined /> 满 ¥299 包邮</span><span><SafetyCertificateOutlined /> 正品保障</span></div></section></div>
    <section className="product-story"><span className="section-kicker">THE STORY</span><Typography.Title level={2}>关于这件好物</Typography.Title><Typography.Paragraph>{product.description}</Typography.Paragraph></section>
  </main>;
}
