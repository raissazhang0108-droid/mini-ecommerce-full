import { PlusOutlined, StarFilled } from '@ant-design/icons';
import { Button, Card, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';

const palettes = [
  ['#e8edf2', '#c6d4df'], ['#efe8df', '#dbc7af'], ['#e5ece7', '#bdd0c4'], ['#ece7e3', '#d5c4b9'],
];

export function ProductCover({ product, large = false }: { product: Product; large?: boolean }) {
  const colors = palettes[product.name.length % palettes.length];
  if (product.coverUrl) return <div className={`product-cover with-image ${large ? 'large' : ''}`}><img src={product.coverUrl} alt={product.name} loading={large ? 'eager' : 'lazy'} /><span>{product.categoryName ?? 'GOOD THINGS'}</span></div>;
  return <div className={`product-cover ${large ? 'large' : ''}`} style={{ background: `linear-gradient(145deg, ${colors[0]}, ${colors[1]})` }}><span>{product.categoryName ?? 'GOOD THINGS'}</span><div className="cover-object"><strong>{product.name.slice(0, 2)}</strong><i /></div><small>GOOD THINGS · DAILY LIFE</small></div>;
}

export function Price({ value, original }: { value: number; original?: number }) {
  return <span className="price"><small>¥</small>{value.toFixed(2)}{original && <del>¥{original.toFixed(2)}</del>}</span>;
}

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const navigate = useNavigate();
  return <Card className={`product-card ${compact ? 'compact' : ''}`} hoverable cover={<ProductCover product={product} />} onClick={() => navigate(`/products/${product.id}`)}>
    <div className="card-badges">{product.badge && <Tag color="red">{product.badge}</Tag>}<Tag>官方直营</Tag></div>
    <Typography.Title level={4}>{product.name}</Typography.Title>
    <Typography.Paragraph ellipsis={{ rows: 2 }}>{product.subtitle || product.description}</Typography.Paragraph>
    <div className="card-foot"><div><Price value={product.price} original={product.originalPrice} /><small className="sales"><StarFilled /> 4.9 · 已售 1.2k+</small></div><Button aria-label="查看商品" className="quick-add" shape="circle" icon={<PlusOutlined />} /></div>
  </Card>;
}
