import { useCache, CACHE_KEY } from '@/hooks/web/useCache';

const { wsCache } = useCache();

const AccessTokenKey = 'ACCESS_TOKEN';
const RefreshTokenKey = 'REFRESH_TOKEN';

// 获取token
export const getToken = () => {
  return wsCache.get(AccessTokenKey) ? wsCache.get(AccessTokenKey) : wsCache.get('Admin-Token');
};

export const getAccessToken = () => {
  return wsCache.get(AccessTokenKey) ? wsCache.get(AccessTokenKey) : wsCache.get('ACCESS_TOKEN');
};

// 刷新token
export const getRefreshToken = () => {
  return wsCache.get(RefreshTokenKey);
};

// 设置token
export const setToken = (token: any) => {
  if (typeof token === 'string') {
    wsCache.set(AccessTokenKey, token);
  } else {
    wsCache.set(RefreshTokenKey, token.refreshToken || token.refresh_token);
    wsCache.set(AccessTokenKey, token.accessToken || token.access_token);
  }
};

// 删除token
export const removeToken = () => {
  wsCache.delete(AccessTokenKey);
  wsCache.delete(RefreshTokenKey);
};

// ================== 租户相关 ==================

export const getTenantId = () => {
  return wsCache.get(CACHE_KEY.TenantId);
};

export const setTenantId = (id: string | number) => {
  wsCache.set(CACHE_KEY.TenantId, String(id));
};

export const removeTenantId = () => {
  wsCache.delete(CACHE_KEY.TenantId);
};

// ================== 登录表单相关 ==================

export type LoginFormType = {
  tenantName: string;
  username: string;
  password?: string;
  rememberMe: boolean;
};

export const getLoginForm = () => {
  const loginForm: LoginFormType = wsCache.get(CACHE_KEY.LoginForm);
  return loginForm;
};

export const setLoginForm = (loginForm: LoginFormType) => {
  wsCache.set(CACHE_KEY.LoginForm, loginForm, { exp: 30 * 24 * 60 * 60 });
};

export const removeLoginForm = () => {
  wsCache.delete(CACHE_KEY.LoginForm);
};
