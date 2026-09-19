import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { cartApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

export function useCart() {
  const { isAuthenticated } = useAuth();
  return useQuery({ queryKey: ['cart'], queryFn: cartApi.get, enabled: isAuthenticated });
}

export function useCartActions() {
  const client = useQueryClient();
  const { message } = App.useApp();
  const refresh = () => client.invalidateQueries({ queryKey: ['cart'] });
  const options = { onSuccess: () => refresh(), onError: () => message.error('购物车更新失败，请稍后重试') };
  return {
    add: useMutation({ mutationFn: cartApi.add, ...options, onSuccess: () => { refresh(); message.success('已加入购物车'); } }),
    update: useMutation({ mutationFn: ({ id, quantity }: { id: string; quantity: number }) => cartApi.update(id, quantity), ...options }),
    remove: useMutation({ mutationFn: cartApi.remove, ...options }),
    clear: useMutation({ mutationFn: cartApi.clear, ...options }),
  };
}
