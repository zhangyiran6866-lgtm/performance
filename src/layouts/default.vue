<!--
 * @author Zyr
 * @date 2026-03-06 15:25:00
 * @description 修正布局框架，支持内滚动。
 * @lines ~10
-->
<script setup lang="ts">
import { computed } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';
import AppSidebar from '@/components/AppSidebar.vue';
import { RouterView, useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { LogOut, User } from 'lucide-vue-next';
import { ElMessageBox } from 'element-plus';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await userStore.loginOut();
    router.push('/login');
  }).catch(() => {});
};

const breadcrumbs = computed(() => {
  return route.matched.filter(item => item.meta && item.meta.title);
});
</script>

<template>
  <div class="common-layout h-screen w-full flex overflow-hidden">
    <!-- Decorative background pattern -->
    <div class="fixed inset-0 pointer-events-none z-0" :style="{
      backgroundImage: [
        'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.07), transparent)',
        'radial-gradient(circle, rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
      ].join(', '),
      backgroundSize: '100% 100%, 20px 20px',
    }" />

    <AppSidebar class="relative z-20" />

    <div class="flex-1 flex flex-col min-w-0 bg-slate-50/30 overflow-hidden relative z-10">
      <header
        class="flex h-14 shrink-0 items-center justify-between border-b bg-white/80 backdrop-blur-sm px-4 shadow-sm relative z-20">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item 
            v-for="(item, index) in breadcrumbs" 
            :key="index"
            :to="item.path"
          >
            {{ item.meta?.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>

        <!-- Right: User Profile & Logout -->
        <div class="flex items-center gap-4">
          <div
            class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
            <div
              class="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 overflow-hidden">
              <img v-if="userStore.getUser.avatar" :src="userStore.getUser.avatar" class="w-full h-full object-cover" />
              <User v-else class="w-4 h-4 text-indigo-500" />
            </div>
            <div class="hidden sm:flex flex-col items-start leading-tight">
              <span class="text-sm font-bold text-slate-700">{{ userStore.getUser.nickname || '未登录' }}</span>
              <span class="text-[10px] text-slate-400 font-medium">{{ userStore.getUser.deptName || '无部门' }}</span>
            </div>
          </div>

          <div class="w-px h-6 bg-slate-100"></div>

          <button @click="handleLogout"
            class="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100 group relative"
            title="退出登录">
            <LogOut class="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span
              class="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">退出登录</span>
          </button>
        </div>
      </header>

      <main
        class="flex-1 flex flex-col overflow-hidden px-5 md:px-10 py-8 w-full max-w-[1520px] mx-auto relative z-10 transition-all duration-300">
        <router-view v-slot="{ Component, route }">
          <keep-alive include="DailyReportIndex">
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
  .common-layout {
    background-color: #f8fafc;
  }

  :deep(.el-breadcrumb__inner) {
    font-size: 1rem;
  }

  :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
    color: #0f172a;
    font-weight: 600;
  }
</style>
