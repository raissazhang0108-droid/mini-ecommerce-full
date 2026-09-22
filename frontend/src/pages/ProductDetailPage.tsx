import {
  CheckCircleFilled,
  HeartOutlined,
  MinusOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  ShareAltOutlined,
  ShoppingCartOutlined,
  StarFilled,
  TruckOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb, Button, InputNumber, Radio, Space, Tabs, Tag, Typography } from 'antd';
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
  const [gallery, setGallery] = useState(0);
  if (query.isLoading) return <main className="page-container"><PageLoading /></main>;
  if (query.isError || !query.data) return <main className="page-container"><QueryError onRetry={() => query.refetch()} /></main>;
  const product = query.data;
  const selected = product.skus.find((sku) => sku.id === skuId) ?? product.skus.find((sku) => sku.stock > 0);
  const add = async (buyNow = false) => {
    if (!isAuthenticated) { navigate('/login', { state: { from: location.pathname } }); return; }
    if (!selected) return;
    await actions.add.mutateAsync({ productId: product.id, skuId: selected.id, quantity });
    if (buyNow) navigate('/cart');
  };
  const detailTab = <div className="detail-description"><div className="description-banner"><span>GOOD DESIGN · GOOD LIFE</span><h2>{product.name}</h2><p>{product.description}</p></div><div className="detail-features"><div><b>01</b><h3>严选品质</h3><p>从材质到细节，以更高标准挑选每一件商品。</p></div><div><b>02</b><h3>贴近日常</h3><p>好设计不喧哗，却能让日常使用更加顺手。</p></div><div><b>03</b><h3>售后无忧</h3><p>提供清晰透明的服务规则与及时的售后支持。</p></div></div></div>;

  return <main className="page-container detail-page">
    <Breadcrumb items={[{ title: <Link to="/products">首页</Link> }, { title: product.categoryName }, { title: product.name }]} />
    <div className="detail-grid">
      <section className="product-gallery">
        <div className={`gallery-main gallery-${gallery}`}><ProductCover product={product} large /><div className="gallery-actions"><Button shape="circle" icon={<HeartOutlined />} /><Button shape="circle" icon={<ShareAltOutlined />} /></div></div>
        <div className="gallery-thumbs">{[0, 1, 2, 3].map((item) => <button key={item} className={gallery === item ? 'active' : ''} onClick={() => setGallery(item)}><ProductCover product={product} /></button>)}</div>
      </section>
      <section className="product-info">
        <div className="detail-tags">{product.badge && <Tag color="red">{product.badge}</Tag>}<Tag>官方直营</Tag><Tag color="green">新品</Tag></div>
        <Typography.Title>{product.name}</Typography.Title>
        <Typography.Paragraph className="subtitle">{product.subtitle}</Typography.Paragraph>
        <div className="rating-row"><span><StarFilled /> 4.9</span><i /> <span>2,136 条评价</span><i /><span>已售 8,700+</span></div>
        <div className="price-panel"><span className="price-label">商城价</span><Price value={selected?.price ?? product.price} original={product.originalPrice ?? product.price * 1.18} /><p>登录会员享更多专属优惠</p></div>
        <div className="promotion-row"><b>优惠</b><Tag color="red">满减</Tag><span>满 299 元减 20 元</span><a>更多优惠 ›</a></div>
        <div className="delivery-row"><b>配送</b><span><TruckOutlined /> 现货，预计 24 小时内发出</span></div>
        <div className="option-row"><b>选择规格</b><Radio.Group className="sku-options" value={selected?.id} onChange={(event) => { setSkuId(event.target.value); setQuantity(1); }}>{product.skus.map((sku) => <Radio.Button key={sku.id} value={sku.id} disabled={!sku.stock}>{sku.name}<small>{sku.stock ? `库存 ${sku.stock}` : '已售罄'}</small></Radio.Button>)}</Radio.Group></div>
        <div className="option-row"><b>数量</b><Space.Compact className="quantity"><Button icon={<MinusOutlined />} onClick={() => setQuantity(Math.max(1, quantity - 1))} /><InputNumber controls={false} min={1} max={selected?.stock ?? product.stock} value={quantity} onChange={(value) => setQuantity(value ?? 1)} /><Button icon={<PlusOutlined />} onClick={() => setQuantity(Math.min(selected?.stock ?? product.stock, quantity + 1))} /></Space.Compact><span className="stock-hint">库存 {selected?.stock ?? product.stock} 件</span></div>
        <div className="buy-actions"><Button className="buy-now" size="large" disabled={!selected} loading={actions.add.isPending} onClick={() => add(true)}>立即购买</Button><Button size="large" type="primary" icon={<ShoppingCartOutlined />} disabled={!selected} loading={actions.add.isPending} onClick={() => add()}>加入购物车</Button></div>
        <div className="detail-benefits"><span><CheckCircleFilled /> 正品保障</span><span><SafetyCertificateOutlined /> 7 天无忧退换</span><span><TruckOutlined /> 满 ¥299 包邮</span></div>
      </section>
    </div>
    <section className="product-detail-tabs"><Tabs defaultActiveKey="detail" centered items={[{ key: 'detail', label: '商品详情', children: detailTab }, { key: 'spec', label: '规格参数', children: <div className="spec-table"><span>商品名称</span><b>{product.name}</b><span>商品分类</span><b>{product.categoryName}</b><span>可选规格</span><b>{product.skus.map((sku) => sku.name).join(' / ')}</b><span>库存</span><b>{product.stock} 件</b></div> }, { key: 'review', label: '用户评价 (2136)', children: <div className="review-empty"><StarFilled /> 4.9 分 · 98% 用户推荐这件好物</div> }]} /></section>
  </main>;
}
