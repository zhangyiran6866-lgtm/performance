<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import logoImg from '@/assets/img/logo.png';

const route = useRoute();
const userStore = useUserStore();

/**
 * 递归扁平化菜单树，只提取叶子节点 (即没有子节点或子节点为空的菜单项)
 * 修正：确保返回的 path 始终以 / 开头，并剥离可能存在的微应用前缀或 /index 后缀
 * 进阶：增加图标继承逻辑，如果子节点没配图标，自动使用父节点图标
 */
const flattenedMenuItems = computed(() => {
  const leaves: any[] = [];
  const traverse = (items: any[], parentIcon: string = '') => {
    for (const item of items) {
      // 提取图标：优先用自己的，没配则继承父级的
      const currentIcon = item.icon || parentIcon;
      
      if (!item.children || item.children.length === 0) {
        // 1. 获取原始路径
        let path = (item.path || item.component || '').trim();
        
        // 2. 移除冗余前缀
        path = path.replace(/^(performance-new|performance)\//, '');
        path = path.replace(/^\/(performance-new|performance)\//, '');
        
        // 3. 移除 /index 后缀
        path = path.replace(/\/index$/, '');
        
        // 4. 格式化为绝对路径
        if (path && !path.startsWith('/') && !path.startsWith('http')) {
          path = '/' + path;
        }
        if (path === '') path = '/';

        leaves.push({
          ...item,
          path,
          icon: currentIcon // 注入继承后的图标
        });
      } else {
        // 递归传递图标供后代继承
        traverse(item.children, currentIcon);
      }
    }
  };
  traverse(userStore.getMenus || []);
  return leaves;
});

/**
 * 格式化图标名称，并提供全局兜底
 * 1. 剥离 ep: 前缀 (针对后端带命名空间的图标格式)
 * 2. 这里的转换逻辑将 kebab-case (如 document-copy) 转换为 PascalCase (如 DocumentCopy)
 * 3. 确保首字母大写，适配 Element Plus 组件命名规范
 */
const getMenuIcon = (iconName?: string) => {
  if (!iconName) return 'Menu';
  
  // 剥离可能存在的命名空间前缀 (如 ep:)
  let name = iconName.startsWith('ep:') ? iconName.slice(3) : iconName;
  
  // 如果包含了短横线，则进行驼峰化处理
  if (name.includes('-')) {
    return name
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
  
  // 兜底处理：确保首字母大写
  return name.charAt(0).toUpperCase() + name.slice(1);
};
</script>

<template>
  <div class="custom-sidebar h-full flex flex-col bg-white border-r">
    <!-- Logo 区域 -->
    <div class="p-4 py-6 flex items-center justify-center">
      <img :src="logoImg" alt="logo" class="h-8 max-w-full object-contain" />
    </div>
    
    <!-- 动态扁平菜单 -->
    <el-menu
      :default-active="route.path"
      class="border-none flex-1 overflow-y-auto custom-scrollbar px-2"
      router
    >
      <el-menu-item
        v-for="menu in flattenedMenuItems"
        :key="menu.id"
        :index="menu.path"
        class="custom-menu-item"
      >
        <el-icon v-if="menu.icon">
          <component :is="getMenuIcon(menu.icon)" />
        </el-icon>
        <template #title>
          <span>{{ menu.name }}</span>
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

/* 隐藏滚动条但保留滚动功能 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #f1f5f9;
  border-radius: 4px;
}

:deep(.el-menu-item), :deep(.el-sub-menu__title) {
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

:deep(.el-menu-item:hover), :deep(.el-sub-menu__title:hover) {
  background-color: #f8fafc;
}

:deep(.el-icon) {
  font-size: 18px;
  margin-right: 12px;
}
</style>
