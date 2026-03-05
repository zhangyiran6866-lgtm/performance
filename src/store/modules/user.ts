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
      openidQw: ''
    }
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
    }
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
        const res = await getInfo();
        userInfo = res.data || res; // 兼容不同格式返回值
      }

      if (userInfo) {
        this.permissions = userInfo.permissions || [];
        this.roles = userInfo.roles || [];
        this.user = userInfo.user || {};
        this.isSetUser = true;
        wsCache.set(CACHE_KEY.USER, userInfo);
      }
    },

    async loginOut() {
      // 如果后端有 logout 接口可以加，这里仅做纯前端清除演示或使用你的
      removeToken();
      localStorage.removeItem('USER_INFO'); // 兼容旧逻辑
      deleteUserCache(); // 删除用户缓存
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
        openidQw: ''
      };
    }
  }
});

export const useUserStoreWithOut = () => {
  return useUserStore(store);
};
