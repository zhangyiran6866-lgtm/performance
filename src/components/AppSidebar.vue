<script setup lang="ts">
import {
  Setting,
  Aim,
  Calendar,
} from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const items = [
  {
    title: '绩效配置中心',
    url: '/configuration',
    icon: Setting,
  },
  {
    title: '绩效工作台',
    url: '/assessment/hall',
    icon: Aim,
  },
  {
    title: '考核周期与发起',
    url: '/assessment/cycle',
    icon: Calendar,
  },
];
</script>

<template>
  <div class="custom-sidebar h-full flex flex-col bg-white border-r">
    <div class="p-4 py-6">
      <h2 class="text-sm font-bold text-blue-600 truncate">
        卓希集团绩效管理
      </h2>
    </div>
    
    <el-menu
      :default-active="route.path"
      class="border-none flex-1"
      router
    >
      <el-menu-item
        v-for="item in items"
        :key="item.url"
        :index="item.url"
        class="custom-menu-item"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <template #title>
          <span>{{ item.title }}</span>
        </template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style scoped>
.custom-sidebar {
  width: 256px;
  transition: width 0.3s;
}

:deep(.el-menu-item) {
  margin: 4px 8px;
  border-radius: 8px;
  height: 44px;
  line-height: 44px;
}

:deep(.el-menu-item.is-active) {
  background-color: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

:deep(.el-menu-item:hover) {
  background-color: #f8fafc;
}
</style>
