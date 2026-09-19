import { ShoppingCartOutlined } from '@ant-design/icons';
import { Button, Card, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';

const palettes = [
  ['#d97745', '#f1c8a8'], ['#315e4d', '#a9c9b7'], ['#b78356', '#ead3b8'], ['#465b76', '#b8c9da'],
];
export function ProductCover({ product, large = false }: { product: Product; large?: boolean }) {
  const colors = palettes[product.name.length % palettes.length];
  return <div className={`product-cover ${large ? 'large' : ''}`} style={{ background: `linear-gradient(145deg, ${colors[0]}, ${colors[1]})` }}><span>{product.categoryName ?? 'LIFE GOODS'}</span><strong>{product.name.slice(0, 2)}</strong><i /></div>;
}
export function Price({ value, original }: { value: number; original?: number }) {
  return <span className="price"><small>¥</small>{value.toFixed(2)}{original && <del>¥{original.toFixed(2)}</del>}</span>;
}
export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  return <Card className="product-card" hoverable cover={<ProductCover product={product} />} onClick={() => navigate(`/products/${product.id}`)}>
    {product.badge && <Tag color="orange">{product.badge}</Tag>}
    <Typography.Title level={4}>{product.name}</Typography.Title>
    <Typography.Paragraph ellipsis={{ rows: 1 }}>{product.subtitle || product.description}</Typography.Paragraph>
    <div className="card-foot"><Price value={product.price} original={product.originalPrice} /><Button aria-label="查看商品" type="text" shape="circle" icon={<ShoppingCartOutlined />} /></div>
  </Card>;
}
