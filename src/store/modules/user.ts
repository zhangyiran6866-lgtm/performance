import { getInfo } from '@/api/login';
import { CACHE_KEY, deleteUserCache, useCache } from '@/hooks/web/useCache';
import { store } from '@/store';
import { getToken, removeToken } from '@/utils/auth';
import { defineStore } from 'pinia';

const { wsCache } = useCache();

interface UserVO {
  id: number;
  avatar: string;
  nickname: string;
  username: string;
  deptId: number;
  deptName: string;
  openidQw: string;
}

interface UserInfoVO {
  permissions: string[];
  roles: string[];
  isSetUser: boolean;
  user: UserVO;
}

export const useUserStore = defineStore('admin-user', {
  state: (): UserInfoVO => ({
    permissions: [],
    roles: [],
    isSetUser: false,
    user: {
      id: 0,
      avatar: '',
      nickname: '',
      username: '',
      deptId: 0,
      deptName: '',
      openidQw: '',
    },
  }),
  getters: {
    getPermissions(): string[] {
      return this.permissions;
    },
    getRoles(): string[] {
      return this.roles;
    },
    getIsSetUser(): boolean {
      return this.isSetUser;
    },
    getUser(): UserVO {
      return this.user;
    },
  },
  actions: {
    async setUserInfoAction() {
      if (!getToken()) {
        this.resetState();
        return null;
      }
      
      let userInfo = wsCache.get(CACHE_KEY.USER);
      if (!userInfo) {
        // 请求后台获取个人权限和信息
        const res: any = await getInfo();
        userInfo = res.data || res; // 兼容不同格式返回值
      }

      if (userInfo) {
        this.permissions = userInfo.permissions || [];
        this.roles = userInfo.roles || [];
        
        // 关键逻辑：兼容嵌套 user 对象或平铺结构
        const userData = userInfo.user || userInfo;
        this.user = {
          ...this.user,
          ...userData,
          // 强制适配部门ID的多种可能名称，并确保类型一致
          deptId: Number(userData.deptId || userData.dept_id || 0)
        };
        
        this.isSetUser = true;
        wsCache.set(CACHE_KEY.USER, userInfo);
      }
    },

    async loginOut() {
      removeToken();
      deleteUserCache();
      localStorage.removeItem('user'); // 额外清理，确保彻底
      localStorage.removeItem('USER_INFO'); // 兼容部分旧系统的习惯
      this.resetState();
    },
    
    resetState() {
      this.permissions = [];
      this.roles = [];
      this.isSetUser = false;
      this.user = {
        id: 0,
        avatar: '',
        nickname: '',
        deptId: 0,
        deptName: '',
        username: '',
        openidQw: '',
      };
    },
  },
});

export const useUserStoreWithOut = () => {
  return useUserStore(store);
};
