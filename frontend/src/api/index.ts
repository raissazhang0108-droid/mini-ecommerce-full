import type { AxiosRequestConfig } from 'axios';
import { apiClient } from './client';
import type {
  Address,
  Cart,
  CartItem,
  Category,
  Coupon,
  Order,
  OrderPreview,
  OrderStatus,
  PageData,
  Product,
  Sku,
  TrackingEvent,
  User,
} from '../types';

interface Envelope<T> { code: number; message: string; data: T; }
interface RawUser { id: number; account: string; role: 'USER' | 'ADMIN'; }
interface RawAuthResult { token: string; tokenType: string; expiresIn: number; user: RawUser; }
interface RawCategory { id: number; name: string; slug: string; sortOrder: number; }
interface RawSku { id: number; skuCode: string; name: string; price: number; stock: number; status: string; }
interface RawProduct { id: number; categoryId: number; categoryName: string; name: string; subtitle?: string; description: string; coverUrl?: string; status: string; minPrice: number; skus: RawSku[]; }
interface RawCartItem { id: number; skuId: number; productId: number; productName: string; skuName: string; coverUrl?: string; unitPrice: number; quantity: number; stock: number; subtotal: number; }
interface RawCart { items: RawCartItem[]; totalAmount: number; totalQuantity: number; }
interface RawCoupon { id: number; name: string; discountAmount: number; minimumAmount: number; validFrom: string; validTo: string; status: string; }
interface RawPreviewItem { skuId: number; productName: string; skuName: string; unitPrice: number; quantity: number; subtotal: number; }
interface RawPreview { items: RawPreviewItem[]; goodsAmount: number; discountAmount: number; payableAmount: number; couponId?: number; }
interface RawOrderItem { skuId: number; productName: string; skuName: string; skuCode: string; unitPrice: number; quantity: number; subtotal: number; }
interface RawOrder { id: number; orderNo: string; status: OrderStatus; goodsAmount: number; discountAmount: number; payableAmount: number; shippingAddress: string; createdAt: string; items: RawOrderItem[]; }
interface RawPage<T> { items: T[]; total: number; page: number; pageSize: number; }
interface RawTrackingEvent { status: string; description: string; eventTime: string; }
interface RawTracking { shipmentId: number; orderNo: string; carrier: string; trackingNumber: string; status: string; shippedAt?: string; deliveredAt?: string; events: RawTrackingEvent[]; }

const unwrap = <T>(payload: T | Envelope<T>): T => (
  typeof payload === 'object' && payload !== null && 'data' in payload && 'code' in payload
    ? (payload as Envelope<T>).data : payload as T
);
const request = async <T>(config: AxiosRequestConfig) => unwrap((await apiClient.request<T | Envelope<T>>(config)).data);
const asId = (value: number | string) => String(value);

const mapUser = (user: RawUser): User => {
  const email = user.account.includes('@') ? user.account : undefined;
  const phone = email ? undefined : user.account;
  return { id: asId(user.id), displayName: user.account.split('@')[0], email, phone, role: user.role };
};
const mapSku = (sku: RawSku): Sku => ({ id: asId(sku.id), name: sku.name, price: Number(sku.price), stock: sku.stock });
const mapProduct = (product: RawProduct): Product => {
  const skus = (product.skus ?? []).filter((sku) => sku.status === 'ACTIVE').map(mapSku);
  return {
    id: asId(product.id),
    name: product.name,
    subtitle: product.subtitle,
    description: product.description,
    categoryId: asId(product.categoryId),
    categoryName: product.categoryName,
    price: Number(product.minPrice),
    stock: skus.reduce((total, sku) => total + sku.stock, 0),
    badge: '本季精选',
    skus,
  };
};
const mapCartItem = (item: RawCartItem): CartItem => {
  const sku: Sku = { id: asId(item.skuId), name: item.skuName, price: Number(item.unitPrice), stock: item.stock };
  const product: Product = {
    id: asId(item.productId), name: item.productName, description: '', categoryId: '',
    price: Number(item.unitPrice), stock: item.stock, skus: [sku],
  };
  return { id: asId(item.id), product, sku, quantity: item.quantity };
};
const mapCart = (cart: RawCart): Cart => ({
  items: cart.items.map(mapCartItem), subtotal: Number(cart.totalAmount), discount: 0, total: Number(cart.totalAmount),
});
const mapCoupon = (coupon: RawCoupon, claimed: boolean): Coupon => {
  const now = Date.now();
  const available = coupon.status !== 'USED' && new Date(coupon.validFrom).getTime() <= now && new Date(coupon.validTo).getTime() >= now;
  return {
    id: asId(coupon.id), name: coupon.name,
    description: `满 ¥${Number(coupon.minimumAmount).toFixed(0)} 可用`,
    discount: Number(coupon.discountAmount), threshold: Number(coupon.minimumAmount), claimed, available,
    expiresAt: coupon.validTo,
  };
};
const parseAddress = (value: string): Address => {
  try { return JSON.parse(value) as Address; } catch {
    return { recipient: '收货人', phone: '', province: '', city: '', district: '', detail: value };
  }
};
const mapOrder = (order: RawOrder): Order => ({
  id: asId(order.id), orderNo: order.orderNo, status: order.status,
  items: order.items.map((item) => ({
    id: asId(item.skuId), productName: item.productName, skuName: item.skuName,
    price: Number(item.unitPrice), quantity: item.quantity,
  })),
  total: Number(order.payableAmount), discount: Number(order.discountAmount), createdAt: order.createdAt,
  address: parseAddress(order.shippingAddress),
});
const mapPreview = (preview: RawPreview): OrderPreview => ({
  items: preview.items.map((item) => ({
    id: asId(item.skuId), quantity: item.quantity,
    product: { id: asId(item.skuId), name: item.productName, description: '', categoryId: '', price: Number(item.unitPrice), stock: item.quantity, skus: [] },
    sku: { id: asId(item.skuId), name: item.skuName, price: Number(item.unitPrice), stock: item.quantity },
  })),
  subtotal: Number(preview.goodsAmount), discount: Number(preview.discountAmount), shippingFee: 0, total: Number(preview.payableAmount),
});

export interface LoginInput { account: string; password: string; }
export interface RegisterInput { email?: string; phone?: string; password: string; displayName: string; }
export interface AuthResult { token: string; user: User; }

export const authApi = {
  login: async (data: LoginInput): Promise<AuthResult> => {
    const result = await request<RawAuthResult>({ method: 'POST', url: '/api/v1/auth/login', data });
    return { token: result.token, user: mapUser(result.user) };
  },
  register: async (data: RegisterInput): Promise<AuthResult> => {
    const result = await request<RawAuthResult>({ method: 'POST', url: '/api/v1/auth/register', data: { account: data.email || data.phone, password: data.password } });
    return { token: result.token, user: mapUser(result.user) };
  },
  me: async () => mapUser(await request<RawUser>({ url: '/api/v1/users/me' })),
  logout: () => request<void>({ method: 'POST', url: '/api/v1/auth/logout' }),
};

export const productApi = {
  categories: async (): Promise<Category[]> => (await request<RawCategory[]>({ url: '/api/v1/categories' })).map((category) => ({ id: asId(category.id), name: category.name })),
  list: async (params: { categoryId?: string; keyword?: string; page?: number; pageSize?: number }): Promise<PageData<Product>> => {
    const all = (await request<RawProduct[]>({ url: '/api/v1/products', params: { categoryId: params.categoryId, keyword: params.keyword } })).map(mapProduct);
    const page = params.page ?? 1; const pageSize = params.pageSize ?? 12; const offset = (page - 1) * pageSize;
    return { items: all.slice(offset, offset + pageSize), total: all.length, page, pageSize };
  },
  detail: async (id: string) => mapProduct(await request<RawProduct>({ url: `/api/v1/products/${id}` })),
};

export const cartApi = {
  get: async () => mapCart(await request<RawCart>({ url: '/api/v1/cart' })),
  add: async (data: { productId: string; skuId: string; quantity: number }) => mapCart(await request<RawCart>({ method: 'POST', url: '/api/v1/cart/items', data: { skuId: Number(data.skuId), quantity: data.quantity } })),
  update: async (id: string, quantity: number) => mapCart(await request<RawCart>({ method: 'PUT', url: `/api/v1/cart/items/${id}`, data: { quantity } })),
  remove: (id: string) => request<void>({ method: 'DELETE', url: `/api/v1/cart/items/${id}` }),
  clear: () => request<void>({ method: 'DELETE', url: '/api/v1/cart' }),
};

export const couponApi = {
  list: async (): Promise<Coupon[]> => {
    const [all, mine] = await Promise.all([
      request<RawCoupon[]>({ url: '/api/v1/coupons' }),
      request<RawCoupon[]>({ url: '/api/v1/user/coupons' }),
    ]);
    const claimed = new Set(mine.map((coupon) => coupon.id));
    return all.map((coupon) => mapCoupon(mine.find((owned) => owned.id === coupon.id) ?? coupon, claimed.has(coupon.id)));
  },
  claim: async (id: string) => mapCoupon(await request<RawCoupon>({ method: 'POST', url: `/api/v1/coupons/${id}/claim` }), true),
};

export const orderApi = {
  preview: async (couponId?: string) => mapPreview(await request<RawPreview>({ method: 'POST', url: '/api/v1/orders/preview', data: { couponId: couponId ? Number(couponId) : null, shippingAddress: '结算预览' } })),
  create: async (data: { address: Address; couponId?: string }) => mapOrder(await request<RawOrder>({ method: 'POST', url: '/api/v1/orders', data: { couponId: data.couponId ? Number(data.couponId) : null, shippingAddress: JSON.stringify(data.address) } })),
  list: async () => (await request<RawPage<RawOrder>>({ url: '/api/v1/orders' })).items.map(mapOrder),
  detail: async (id: string) => mapOrder(await request<RawOrder>({ url: `/api/v1/orders/${id}` })),
  cancel: async (id: string) => mapOrder(await request<RawOrder>({ method: 'POST', url: `/api/v1/orders/${id}/cancel` })),
  refund: async (id: string, reason: string) => mapOrder(await request<RawOrder>({ method: 'POST', url: `/api/v1/orders/${id}/refund`, data: { reason } })),
  pay: async (id: string) => {
    await request<unknown>({ method: 'POST', url: `/api/v1/orders/${id}/pay` });
    return mapOrder(await request<RawOrder>({ url: `/api/v1/orders/${id}` }));
  },
  complete: async (id: string) => mapOrder(await request<RawOrder>({ method: 'POST', url: `/api/v1/orders/${id}/complete` })),
  tracking: async (id: string): Promise<TrackingEvent[]> => {
    const tracking = await request<RawTracking>({ url: `/api/v1/orders/${id}/tracking` });
    return tracking.events.map((event, index) => ({ id: `${tracking.shipmentId}-${index}`, time: event.eventTime, title: event.status, description: event.description, completed: true }));
  },
};

export const adminApi = {
  orders: async (status?: string) => (await request<RawPage<RawOrder>>({ url: '/api/v1/admin/orders', params: { status } })).items.map(mapOrder),
  ship: (id: string, data: { carrier: string; trackingNo: string }) => request<RawTracking>({ method: 'POST', url: `/api/v1/admin/orders/${id}/ship`, data: { carrier: data.carrier, trackingNumber: data.trackingNo } }),
  deliver: (id: string) => request<RawTracking>({ method: 'POST', url: `/api/v1/admin/orders/${id}/deliver` }),
};
