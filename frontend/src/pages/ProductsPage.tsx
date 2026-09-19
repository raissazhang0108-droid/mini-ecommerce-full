import { ArrowRightOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Pagination, Segmented, Space, Typography } from 'antd';
import { useState } from 'react';
import { productApi } from '../api';
import { ProductCard } from '../components/ProductCard';
import { EmptyState, PageLoading, QueryError } from '../components/States';

export function ProductsPage() {
  const [categoryId, setCategoryId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const categories = useQuery({ queryKey: ['categories'], queryFn: productApi.categories });
  const products = useQuery({ queryKey: ['products', categoryId, search, page], queryFn: () => productApi.list({ categoryId: categoryId || undefined, keyword: search || undefined, page, pageSize: 12 }) });
  return <main>
    <section className="shop-hero"><div className="hero-copy"><span className="eyebrow">AUTUMN / 2026</span><Typography.Title>为日常留一处<br /><em>温柔的余白</em></Typography.Title><Typography.Paragraph>从晨间的一只杯子，到夜晚的一束光。精选材质与手艺，让生活慢下来。</Typography.Paragraph><Button type="primary" size="large" href="#collection">探索本季精选 <ArrowRightOutlined /></Button></div><div className="hero-art"><div className="sun" /><div className="vase">栖</div><div className="leaf leaf-one" /><div className="leaf leaf-two" /><span>QUIET OBJECTS<br />FOR DAILY LIFE</span></div></section>
    <section className="benefit-strip"><span>✦ 精选设计</span><span>○ 7 天安心退换</span><span>♧ 满 ¥299 包邮</span></section>
    <section id="collection" className="page-container collection"><div className="section-head"><div><span className="section-kicker">CURATED COLLECTION</span><Typography.Title level={2}>本季精选</Typography.Title></div><Input.Search allowClear size="large" placeholder="搜索心仪好物" prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} onSearch={(v) => { setSearch(v); setPage(1); }} /></div>
      <Segmented className="category-tabs" value={categoryId} onChange={(v) => { setCategoryId(v); setPage(1); }} options={[{ label: '全部', value: '' }, ...(categories.data ?? []).map((c) => ({ label: c.name, value: c.id }))]} />
      {products.isLoading ? <PageLoading cards /> : products.isError ? <QueryError onRetry={() => products.refetch()} /> : products.data?.items.length ? <><div className="product-grid">{products.data.items.map((p) => <ProductCard key={p.id} product={p} />)}</div><Space className="pagination"><Pagination current={page} pageSize={products.data.pageSize} total={products.data.total} showSizeChanger={false} onChange={setPage} /></Space></> : <EmptyState title="没有找到相关商品" description="换一个分类或关键词试试" />}
    </section>
  </main>;
}
