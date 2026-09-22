export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  role: Role;
}

export interface Category { id: string; name: string; }
export interface Sku { id: string; name: string; price: number; stock: number; attributes?: Record<string, string>; }
export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  coverUrl?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  badge?: string;
  skus: Sku[];
}
export interface PageData<T> { items: T[]; total: number; page: number; pageSize: number; }
export interface CartItem { id: string; product: Product; sku: Sku; quantity: number; }
export interface Cart { items: CartItem[]; subtotal: number; discount: number; total: number; }
export interface Coupon { id: string; name: string; description: string; discount: number; threshold: number; claimed: boolean; available: boolean; expiresAt?: string; }
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDING' | 'REFUNDED';
export interface Address { recipient: string; phone: string; province: string; city: string; district: string; detail: string; }
export interface OrderItem { id: string; productName: string; skuName: string; price: number; quantity: number; }
export interface Order {
  id: string;
  orderNo: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  discount: number;
  createdAt: string;
  address: Address;
  trackingNo?: string;
  carrier?: string;
}
export interface OrderPreview { items: CartItem[]; subtotal: number; discount: number; shippingFee: number; total: number; }
export interface TrackingEvent { id: string; time: string; title: string; description: string; completed: boolean; }
