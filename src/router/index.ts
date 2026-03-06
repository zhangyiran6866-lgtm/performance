import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/layouts/default.vue';

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
      children: [
        {
          path: '',
          name: 'home',
          redirect: '/configuration',
        },
        {
          path: '/configuration',
          name: 'performance-configuration',
          component: () => import('@/views/PerformanceConfig.vue'),
        },
        {
          path: '/library',
          redirect: '/configuration',
        },
        {
          path: '/template',
          redirect: '/configuration',
        },
        {
          path: '/template/builder',
          name: 'template-builder',
          component: () => import('@/views/template/Builder.vue'),
        },
        {
          path: '/assessment/cycle',
          name: 'assessment-cycle',
          component: () => import('@/views/assessment/Cycle.vue'),
        },
        {
          path: '/assessment/hall',
          name: 'assessment-hall',
          component: () => import('@/views/assessment/PerformanceHall.vue'),
        },
        {
          path: '/assessment/team',
          redirect: '/assessment/hall',
        },
        {
          path: '/assessment/rating',
          redirect: '/assessment/hall',
        },
        {
          path: '/assessment/my',
          redirect: '/assessment/hall',
        },
        {
          path: '/assessment/cycle/:id/stats',
          name: 'assessment-cycle-stats',
          component: () => import('@/views/assessment/CycleDashboard.vue'),
        },
      ],
    },
  ],
});

import { getToken } from '@/utils/auth';

// 路由白名单，不需要登录即可访问的页面
const whiteList = ['/login', '/social-login'];

import { ElMessage } from 'element-plus';

router.beforeEach((to, _from, next) => {
  const hasToken = getToken();

  if (hasToken) {
    if (to.path === '/login') {
      // 如果已经登录，还在访问登录页，则重定向到主页（绩效配置中心）
      next({ path: '/configuration' });
    } else {
      // 在页面跳转前，检查并确认全局字典已经挂载缓存
      import('@/store/modules/dict').then(({ useDictStoreWithOut }) => {
        const dictStore = useDictStoreWithOut();
        if (!dictStore.getIsSetDict) {
          dictStore.setDictMap().finally(() => next());
        } else {
          next();
        }
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
