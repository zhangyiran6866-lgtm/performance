<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue';
import AppSidebar from '@/components/AppSidebar.vue';
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="common-layout h-screen w-full flex overflow-hidden">
    <!-- Decorative background pattern -->
    <div
      class="fixed inset-0 pointer-events-none z-0"
      :style="{
        backgroundImage: [
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.07), transparent)',
          'radial-gradient(circle, rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '100% 100%, 20px 20px',
      }"
    />

    <AppSidebar class="relative z-20" />

    <div class="flex-1 flex flex-col min-w-0 bg-slate-50/30 overflow-hidden relative z-10">
      <header class="flex h-14 shrink-0 items-center gap-2 border-b bg-white/80 backdrop-blur-sm px-4 shadow-sm relative z-20">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item to="/">
            工作台
          </el-breadcrumb-item>
          <el-breadcrumb-item>绩效总览</el-breadcrumb-item>
        </el-breadcrumb>
      </header>

      <main class="flex-1 overflow-y-auto px-5 md:px-10 py-8 pb-12 w-full max-w-[1520px] mx-auto relative z-10 transition-all duration-300">
        <RouterView />
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
