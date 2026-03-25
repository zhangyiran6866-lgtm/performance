<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, Loading } from '@element-plus/icons-vue';
import { getTenantIdByName, getTenantByWebsite, socialAuthRedirect, loginByPassword } from '@/api/login';
import { setToken, setTenantId, getTenantId } from '@/utils/auth';

defineOptions({ name: 'Login' });

const router = useRouter();
const route = useRoute();

const isQrLogin = ref(true);
const iframeUrl = ref('');
const loading = ref(false);

const loginForm = reactive({
  tenantName: '卓希平台',
  username: '',
  password: '',
  client_id: 'taojin-sso-demo-by-password',
  client_secret: 'test',
  grant_type: 'password',
  rememberMe: true,
});

// 根据域名自动获取租户信息
const resolveTenantByWebsite = async () => {
  try {
    const website = window.location.host;
    const res: any = await getTenantByWebsite(website);
    if (res && (res.data || res.id)) {
      const data = res.data || res;
      loginForm.tenantName = data.name || loginForm.tenantName;
      setTenantId(data.id);
      return data.id;
    }
  } catch (error) {
    console.warn('Failed to get tenant by website, falling back to name lookup.');
  }
  return null;
};

// 获取租户 ID (按名称)
const resolveTenantByForm = async () => {
  try {
    const tenantRes: any = await getTenantIdByName(loginForm.tenantName);
    const tenantId = tenantRes?.data ?? tenantRes;
    if (tenantId) {
      setTenantId(tenantId);
      return tenantId;
    }
  } catch (error) {
    console.error('Failed to get tenant ID by name:', error);
  }
  return null;
};

// 综合租户解析
const ensureTenantId = async () => {
  let id = getTenantId();
  if (id) return id;

  id = await resolveTenantByWebsite();
  if (id) return id;

  return await resolveTenantByForm();
};

// 加载二维码链接
const loadSocialLogin = async () => {
  try {
    // 1. 确保租户 ID 已设置
    await ensureTenantId();

    // 2. 复刻 c-center 线上回调地址逻辑
    const redirect = route.query.redirect as string || '/daily-report';
    const encodedParams = encodeURIComponent(`type=30&redirect=${redirect}`);
    const redirectUri = 'https://www.zhuoxi.group/social-login?' + encodedParams;
    
    // 3. 发起带租户信息的社交授权请求
    const res: any = await socialAuthRedirect(30, encodeURIComponent(redirectUri));
    
    // 4. 返回真实的跳转URL给 iframe
    const url = res?.data ?? res;
    if (url && typeof url === 'string') {
      iframeUrl.value = url;
    }
  } catch (error) {
    console.error('Failed to load QR code login:', error);
  }
};

onMounted(async () => {
  // 读取记住的账号密码
  import('@/utils/auth').then((authUtil) => {
    const cachedForm = authUtil.getLoginForm();
    if (cachedForm) {
      loginForm.tenantName = cachedForm.tenantName || loginForm.tenantName;
      loginForm.username = cachedForm.username || loginForm.username;
      loginForm.password = cachedForm.password || loginForm.password;
      loginForm.rememberMe = cachedForm.rememberMe ?? loginForm.rememberMe;
    }
  });

  // 挂载时即尝试初始化租户并获取二维码
  await loadSocialLogin();
});

const handlePasswordLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入账号和密码');
    return;
  }

  loading.value = true;
  try {
    // 1. 确保租户 ID 已设置
    await ensureTenantId();

    // 2. 发起登录请求
    const res: any = await loginByPassword(loginForm);
    const tokenData = res?.data ?? res;

    if (tokenData && (tokenData.access_token || tokenData.accessToken)) {
      setToken(tokenData);
      
      // 保存表单信息（记住密码）
      import('@/utils/auth').then((authUtil) => {
        if (loginForm.rememberMe) {
          authUtil.setLoginForm(loginForm);
        } else {
          authUtil.removeLoginForm();
        }
      });

      // 3. 复刻 c-center：获取个人信息并交由 store 接管存储
      const { useUserStoreWithOut } = await import('@/store/modules/user');
      const userStore = useUserStoreWithOut();
      await userStore.setUserInfoAction();

      ElMessage.success('登录成功');
      
      const redirectPath = route.query.redirect as string || '/daily-report';
      router.push({ path: redirectPath });
    } else {
      ElMessage.error(res?.msg || '登录失败，请检查账号密码');
    }
  } catch (error: any) {
    console.error('Login failed:', error);
    ElMessage.error(error.message || '登录失败');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center login-bg">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-blue-900 tracking-tight">
        卓希绩效考核系统
      </h2>
      <p class="mt-2 text-center text-sm text-slate-600">
        欢迎回来，请登录您的工作账号
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
      <div class="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100 relative overflow-hidden">
        <!-- Toggle Tabs -->
        <div class="flex border-b border-slate-200 mb-6">
          <button 
            :class="isQrLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
            class="w-1/2 py-4 px-1 text-center border-b-2 font-medium text-16px transition-colors duration-200"
            @click="isQrLogin = true"
          >
            企业微信扫码
          </button>
          <button 
            :class="!isQrLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
            class="w-1/2 py-4 px-1 text-center border-b-2 font-medium text-16px transition-colors duration-200"
            @click="isQrLogin = false"
          >
            账号密码登录
          </button>
        </div>

        <!-- QR Code Login -->
        <div
          v-if="isQrLogin"
          class="flex flex-col items-center justify-center min-h-[450px]"
        >
          <iframe
            v-if="iframeUrl"
            :src="iframeUrl"
            class="w-[450px] h-[450px]"
            frameborder="0"
            scrolling="no"
          />
          <div
            v-else
            class="text-slate-400 flex flex-col items-center"
          >
            <el-icon class="text-4xl animate-spin mb-4">
              <Loading />
            </el-icon>
            加载二维码中...
          </div>
        </div>

        <!-- Password Login -->
        <div
          v-else
          class="space-y-5 animate-fade-in min-h-[300px]"
        >
          <!-- <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">租户名称</label>
            <el-input 
              v-model="loginForm.tenantName" 
              placeholder="请输入租户名称" 
              size="large"
              class="custom-login-input text-base"
            />
          </div> -->

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">账号/手机号</label>
            <el-input 
              v-model="loginForm.username" 
              placeholder="请输入您的登录账号" 
              size="large"
              class="custom-login-input text-base"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">登录密码</label>
            <el-input 
              v-model="loginForm.password" 
              type="password"
              placeholder="请输入您的密码" 
              size="large"
              show-password
              class="custom-login-input text-base"
              @keyup.enter="handlePasswordLogin"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </div>
          <div class="pt-4">
            <el-button 
              type="primary" 
              class="w-full h-12 text-base font-semibold tracking-wide shadow-md shadow-blue-500/20" 
              :loading="loading"
              @click="handlePasswordLogin"
            >
              立即登录
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-bg {
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
}

.custom-login-input :deep(.el-input__wrapper) {
  padding-left: 12px;
  height: 48px;
  border-radius: 0.5rem;
  box-shadow: 0 0 0 1px #cbd5e1 inset;
}

.custom-login-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #2563eb inset !important;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
</style>
