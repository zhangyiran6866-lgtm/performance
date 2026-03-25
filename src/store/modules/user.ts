import { getToken, removeToken } from '@/utils/auth';
import { defineStore } from 'pinia';
import { getMenuTree, type MenuVO } from '@/api/system/menu/menu';
import { CACHE_KEY, deleteUserCache, useCache } from '@/hooks/web/useCache';
import { store } from '@/store';

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
  menus: MenuVO[];
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
    menus: [],
  }),
  persist: true, // 持久化用户信息
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
    getMenus(): MenuVO[] {
      return this.menus;
    },
  },
  actions: {
    async setUserInfoAction() {
      if (!getToken()) {
        this.resetState();
        return null;
      }
      
      let userInfo = wsCache.get(CACHE_KEY.USER);
      if (!userInfo || !userInfo.menus) {
        // 请求后台获取个人权限、信息和菜单树 (针对当前微应用 performance)
        const res: any = await getMenuTree('performance-new');
        userInfo = res.data || res; // 兼容不同格式返回值
      }

      if (userInfo) {
        this.permissions = userInfo.permissions || [];
        this.roles = userInfo.roles || [];
        this.menus = userInfo.menus || [];
        
        // 兼容嵌套 user 对象或平铺结构
        const userData = userInfo.user || userInfo;
        this.user = {
          ...this.user,
          ...userData,
          deptId: Number(userData.deptId || userData.dept_id || 0)
        };
        
        this.isSetUser = true;
        wsCache.set(CACHE_KEY.USER, userInfo);
      }
    },

    async loginOut() {
      removeToken();
      deleteUserCache();
      localStorage.removeItem('user');
      localStorage.removeItem('USER_INFO');
      this.resetState();
    },
    
    resetState() {
      this.permissions = [];
      this.roles = [];
      this.isSetUser = false;
      this.menus = [];
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
