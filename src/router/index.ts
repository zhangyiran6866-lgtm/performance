import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/layouts/default.vue';
import { getToken } from '@/utils/auth';
import { ElMessage } from 'element-plus';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
    },
    {
      path: '/',
      component: DefaultLayout,
      redirect: '/daily-report',
      meta: { title: '工作台' },
      children: [
        {
          path: 'daily-report',
          name: 'daily-report',
          component: () => import('@/views/daily-report/index.vue'),
          meta: { title: '工作日报' },
        },
        {
          path: 'daily-report/create',
          name: 'daily-report-create',
          component: () => import('@/views/daily-report/Create.vue'),
          meta: { title: '填写工作日报' },
        },
        {
          path: 'configuration',
          name: 'performance-configuration',
          component: () => import('@/views/PerformanceConfig.vue'),
          meta: { title: '绩效配置中心' },
        },
        {
          path: 'template/builder',
          name: 'template-builder',
          component: () => import('@/views/template/Builder.vue'),
          meta: { title: '考核模板配置' },
        },
        {
          path: 'assessment/cycle',
          name: 'assessment-cycle',
          component: () => import('@/views/assessment/Cycle.vue'),
          meta: { title: '考核周期管理' },
        },
        {
          path: 'assessment/hall',
          name: 'assessment-hall',
          component: () => import('@/views/assessment/PerformanceHall.vue'),
          meta: { title: '绩效工作台' },
        },
        {
          path: 'assessment/cycle/:id/stats',
          name: 'assessment-cycle-stats',
          component: () => import('@/views/assessment/CycleDashboard.vue'),
          meta: { title: '统计看板' },
        },
      ],
    },
  ],
});

// 路由白名单，不需要登录即可访问的页面
const whiteList = ['/login'];

router.beforeEach((to, _from, next) => {
  // 提取 URL 中的 token 信息（用于外部系统跳转）
  if (to.query.token || to.query.accessToken) {
    const accessToken = (to.query.accessToken || to.query.token) as string;
    const refreshToken = (to.query.refreshToken) as string;
    
    // 关键：首先强制清除本地所有的旧 Token (包括可能的 RefreshToken)，防止拦截器误用旧令牌刷新导致报错
    import('@/utils/auth').then(({ removeToken, setToken }) => {
      removeToken();
      // 再存入新令牌，建立干净的认证空间
      if (refreshToken) {
        setToken({ accessToken, refreshToken });
      } else {
        setToken(accessToken);
      }
    });
    
    // 关键：清理可能存在的旧系统缓存，强制触发重新获取用户信息和动态菜单
    import('@/hooks/web/useCache').then(({ useCache, CACHE_KEY }) => {
      const { wsCache } = useCache();
      wsCache.delete(CACHE_KEY.USER);
    });
    import('@/store/modules/user').then(({ useUserStoreWithOut }) => {
      const userStore = useUserStoreWithOut();
      userStore.resetState();
    });
    
    // 移除 URL 中的 token 信息，并跳转
    const query = { ...to.query };
    delete query.token;
    delete query.accessToken;
    delete query.refreshToken;
    return next({ path: '/daily-report', query, replace: true });
  }

  const hasToken = getToken();

  if (hasToken) {
    if (to.path === '/login') {
      // 如果已经登录，还在访问登录页，则重定向到主页（工作日报）
      next({ path: '/daily-report' });
    } else {
      // 在页面跳转前，检查并确认全局字典和用户信息已经挂载缓存
      Promise.all([
        import('@/store/modules/dict').then(({ useDictStoreWithOut }) => {
          const dictStore = useDictStoreWithOut();
          if (!dictStore.getIsSetDict) {
            return dictStore.setDictMap();
          }
        }),
        import('@/store/modules/user').then(({ useUserStoreWithOut }) => {
          const userStore = useUserStoreWithOut();
          if (!userStore.getIsSetUser) {
            return userStore.setUserInfoAction();
          }
        })
      ]).finally(() => {
        next();
      });
    }
  } else {
    // 如果没有 token
    if (whiteList.includes(to.path)) {
      // 在白名单中直接放行
      next();
    } else {
      // 否则提示用户，并重定向到登录页
      ElMessage.warning('您当前未登录或身份已失效，请先登录系统');
      next(`/login?redirect=${to.path}`);
    }
  }
});

export default router;
