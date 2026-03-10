<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, Loading } from '@element-plus/icons-vue';
import { getTenantIdByName, socialAuthRedirect, loginByPassword } from '@/api/login';
import { setToken, setTenantId, getTenantId } from '@/utils/auth';

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

// 加载二维码链接
const loadSocialLogin = async () => {
  try {
    // 关键修复：c-center在拉取二维码前必须先获取并设置一次租户 ID！
    if (!getTenantId()) {
      const tenantRes = await getTenantIdByName(loginForm.tenantName || '卓希平台');
      if (tenantRes && tenantRes.data !== undefined) {
        setTenantId(tenantRes.data);
      } else if (tenantRes !== undefined) {
        setTenantId(tenantRes as any);
      }
    }

    // 复刻 c-center 线上回调地址
    const encodedParams = encodeURIComponent('type=30&redirect=/configuration');
    const redirectUri = 'https://www.zhuoxi.group/social-login?' + encodedParams;
    
    // 发起带租户信息的社交授权请求
    const res = await socialAuthRedirect(30, encodeURIComponent(redirectUri));
    // 返回真实的跳转URL给 iframe
    if (res && res.data) {
      iframeUrl.value = res.data;
    } else if (typeof res === 'string') {
      iframeUrl.value = res;
    }
  } catch (error) {
    console.error('Failed to load QR code login:', error);
  }
};

onMounted(() => {
  // 读取记住的账号密码
  import('@/utils/auth').then((authUtil) => {
    const cachedForm = authUtil.getLoginForm();
    if (cachedForm) {
      loginForm.username = cachedForm.username || loginForm.username;
      loginForm.password = cachedForm.password || loginForm.password;
      loginForm.rememberMe = cachedForm.rememberMe ?? loginForm.rememberMe;
      // 注意：由于未引入加密中间件，我们在设置 storage 的时候存为明文或简单对象
    }
  });

  // onMounted 阶段即自动执行获取并挂载扫码 iframe
  loadSocialLogin();
});

const handlePasswordLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入账号和密码');
    return;
  }

  loading.value = true;
  try {
    // 1. 先尝试获取并设置租户 ID
    if (!getTenantId()) {
      const tenantRes = await getTenantIdByName(loginForm.tenantName);
      if (tenantRes && tenantRes.data !== undefined) {
        setTenantId(tenantRes.data);
      } else if (tenantRes !== undefined) {
        setTenantId(tenantRes as any);
      }
    }

    // 2. 发起登录请求（c-center 底层采用 axios 的 params 处理参数，因此直接对象即可）
    const res = await loginByPassword(loginForm);

    if (res && (res.access_token || res.data?.access_token || typeof res === 'string')) {
      // 传递完整的 res，auth.ts 能够解析提取 access_token 和 refresh_token
      setToken(res.data || res);
      
      // 保存表单信息（记住密码）
      if (loginForm.rememberMe) {
        import('@/utils/auth').then((authUtil) => {
          authUtil.setLoginForm(loginForm);
        });
      } else {
        import('@/utils/auth').then((authUtil) => {
          authUtil.removeLoginForm();
        });
      }

      // 3. 复刻 c-center：获取个人信息并交由 store 接管存储
      const { useUserStoreWithOut } = await import('@/store/modules/user');
      const userStore = useUserStoreWithOut();
      await userStore.setUserInfoAction();

      ElMessage.success('登录成功');
      
      const redirectPath = route.query.redirect as string || '/configuration';
      router.push({ path: redirectPath });
    } else {
      ElMessage.error(res?.msg || '获取不到登录权限凭证，请重试');
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
        绩效考核原型系统
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
  /* 可以替换成更优质的渐变或浅色纹理 */
  /* background-image: linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%); */
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
