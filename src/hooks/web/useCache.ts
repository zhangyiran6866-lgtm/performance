import WebStorageCache from 'web-storage-cache';

type CacheType = 'localStorage' | 'sessionStorage';

export const CACHE_KEY = {
  // 用户相关
  ROLE_ROUTERS: 'roleRouters',
  USER: 'user',
  // 系统与数据字典
  DICT_CACHE: 'dictCache',
  // 登录表单
  LoginForm: 'loginForm',
  TenantId: 'tenantId',
};

export const useCache = (type: CacheType = 'localStorage') => {
  const wsCache: WebStorageCache = new WebStorageCache({
    storage: type,
  });

  return {
    wsCache,
  };
};

export const deleteUserCache = () => {
  const { wsCache } = useCache();
  wsCache.delete(CACHE_KEY.USER);
  wsCache.delete(CACHE_KEY.ROLE_ROUTERS);
};
