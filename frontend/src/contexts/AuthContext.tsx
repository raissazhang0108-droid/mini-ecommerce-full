import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { authApi, type LoginInput, type RegisterInput } from '../api';
import { TOKEN_KEY } from '../api/client';
import type { User } from '../types';

interface AuthValue {
  user?: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
}
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const token = localStorage.getItem(TOKEN_KEY);
  const me = useQuery({ queryKey: ['me'], queryFn: authApi.me, enabled: Boolean(token), retry: false });

  const persist = async (action: Promise<{ token: string; user: User }>) => {
    const result = await action;
    localStorage.setItem(TOKEN_KEY, result.token);
    client.setQueryData(['me'], result.user);
    return result.user;
  };
  const logout = () => {
    if (localStorage.getItem(TOKEN_KEY)) void authApi.logout().catch(() => undefined);
    localStorage.removeItem(TOKEN_KEY);
    client.removeQueries({ queryKey: ['me'] });
    client.removeQueries({ queryKey: ['cart'] });
  };
  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  });

  const value = useMemo<AuthValue>(() => ({
    user: me.data,
    isAuthenticated: Boolean(token && me.data),
    isLoading: me.isLoading,
    login: (input) => persist(authApi.login(input)),
    register: (input) => persist(authApi.register(input)),
    logout,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [me.data, me.isLoading, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
