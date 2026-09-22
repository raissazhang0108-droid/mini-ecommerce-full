import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  GiftOutlined,
  HomeOutlined,
  LaptopOutlined,
  SafetyCertificateOutlined,
  ThunderboltFilled,
  TrophyOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Pagination, Segmented, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../api';
import { Price, ProductCard, ProductCover } from '../components/ProductCard';
import { EmptyState, PageLoading, QueryError } from '../components/States';

const quickEntries = [
  { icon: <LaptopOutlined />, label: '数码配件' },
  { icon: <HomeOutlined />, label: '家居生活' },
  { icon: <TrophyOutlined />, label: '户外运动' },
  { icon: <GiftOutlined />, label: '礼物精选' },
  { icon: <SafetyCertificateOutlined />, label: '品质保障' },
  { icon: <CustomerServiceOutlined />, label: '售后无忧' },
];

export function ProductsPage() {
  const [params] = useSearchParams();
  const [categoryId, setCategoryId] = useState(params.get('category') ?? '');
  const [keyword, setKeyword] = useState(params.get('keyword') ?? '');
  const [search, setSearch] = useState(params.get('keyword') ?? '');
  const [page, setPage] = useState(1);
  const categories = useQuery({ queryKey: ['categories'], queryFn: productApi.categories });
  const products = useQuery({ queryKey: ['products', categoryId, search, page], queryFn: () => productApi.list({ categoryId: categoryId || undefined, keyword: search || undefined, page, pageSize: 10 }) });
  const allProducts = useQuery({ queryKey: ['products', 'featured'], queryFn: () => productApi.list({ page: 1, pageSize: 10 }) });
  const featured = allProducts.data?.items ?? [];
  const heroProduct = featured[0];
  const flashProducts = useMemo(() => featured.slice(0, 4), [featured]);

  return <main className="mall-home">
    <section className="hero-grid page-width">
      <div className="mall-hero">
        <div className="hero-copy"><span className="hero-label">秋季新品 · 限时首发</span><Typography.Title>让每一件好物<br />都有被发现的理由</Typography.Title><Typography.Paragraph>精选设计、可靠品质和恰到好处的价格，把喜欢的日常带回家。</Typography.Paragraph><Button type="primary" size="large" href="#recommendation">立即选购 <ArrowRightOutlined /></Button><div className="hero-dots"><i className="active" /><i /><i /></div></div>
        <div className="hero-product-art">{heroProduct ? <ProductCover product={heroProduct} large /> : <div className="hero-placeholder" />}</div>
      </div>
      <aside className="hero-side">
        <div className="side-promo new-member"><span>NEW MEMBER</span><h3>新人专享礼</h3><p>注册即领 ¥15 优惠券</p><Button size="small">立即领取</Button></div>
        <div className="side-promo daily"><span>DAILY PICKS</span><h3>每日签到</h3><p>连续签到，兑换精选好礼</p><Button size="small" type="text">去签到 →</Button></div>
      </aside>
    </section>

    <section className="quick-entry page-width">{quickEntries.map((item) => <div key={item.label}><span>{item.icon}</span><b>{item.label}</b></div>)}</section>

    <section className="flash-section page-width">
      <div className="section-heading"><div><span className="section-icon"><ThunderboltFilled /></span><Typography.Title level={2}>限时秒杀</Typography.Title><span className="countdown-label"><ClockCircleOutlined /> 距结束</span><div className="countdown"><b>02</b><i>:</i><b>36</b><i>:</i><b>18</b></div></div><Button type="link">查看全部 <ArrowRightOutlined /></Button></div>
      {allProducts.isLoading ? <PageLoading cards /> : <div className="flash-grid">{flashProducts.map((product, index) => <article className="flash-card" key={product.id}><ProductCover product={product} /><div className="flash-info"><Typography.Title level={4}>{`限时 · ${product.name}`}</Typography.Title><div><Price value={product.price} original={product.price * 1.18} /><span>限量 {30 + index * 12} 件</span></div><div className="stock-bar"><i style={{ width: `${45 + index * 10}%` }} /></div></div></article>)}</div>}
    </section>

    <section id="recommendation" className="recommend-section page-width">
      <div className="section-head"><div><span className="section-kicker">GOOD THINGS FOR YOU</span><Typography.Title level={2}>为你推荐</Typography.Title></div><Input.Search allowClear placeholder="搜索心仪好物" value={keyword} onChange={(event) => setKeyword(event.target.value)} onSearch={(value) => { setSearch(value); setPage(1); }} /></div>
      <Segmented className="category-tabs" value={categoryId} onChange={(value) => { setCategoryId(String(value)); setPage(1); }} options={[{ label: '全部', value: '' }, ...(categories.data ?? []).map((category) => ({ label: category.name, value: category.id }))]} />
      {products.isLoading ? <PageLoading cards /> : products.isError ? <QueryError onRetry={() => products.refetch()} /> : products.data?.items.length ? <><div className="product-grid">{products.data.items.map((product) => <ProductCard key={product.id} product={product} />)}</div><Space className="pagination"><Pagination current={page} pageSize={products.data.pageSize} total={products.data.total} showSizeChanger={false} onChange={setPage} /></Space></> : <EmptyState title="没有找到相关商品" description="换一个分类或关键词试试" />}
    </section>
  </main>;
}
