<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

import { getTenantByWebsite, socialLogin } from '@/api/login';
import { setTenantId, setToken } from '@/utils/auth';

defineOptions({ name: 'SocialLogin' });

const route = useRoute();
const router = useRouter();

const getUrlValue = (key: string) => {
  const url = new URL(decodeURIComponent(window.location.href));
  return url.searchParams.get(key) ?? '';
};

const handleSocialLogin = async () => {
  const type = getUrlValue('type');
  const redirect = getUrlValue('redirect') || '/daily-report';
  const code = String(route.query.code || '');
  const state = String(route.query.state || '');

  if (!type || !code || !state) {
    ElMessage.error('企业微信登录回调参数缺失');
    router.replace('/login');
    return;
  }

  try {
    const tenantRes: any = await getTenantByWebsite(window.location.host);
    const tenant = tenantRes?.data ?? tenantRes;
    if (tenant?.id) {
      setTenantId(tenant.id);
    }

    const loginRes: any = await socialLogin(type, code, state);
    setToken(loginRes?.data ?? loginRes);

    const { useUserStoreWithOut } = await import('@/store/modules/user');
    const userStore = useUserStoreWithOut();
    await userStore.setUserInfoAction();

    router.replace(redirect);
  } catch (error: any) {
    ElMessage.error(error?.message || '企业微信登录失败');
    router.replace('/login');
  }
};

onMounted(() => {
  handleSocialLogin();
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
    正在处理企业微信登录...
  </div>
</template>
