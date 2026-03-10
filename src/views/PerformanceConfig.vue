<!--
<!--
 * @author Zyr
 * @date 2026-03-06 15:25:00
 * @description 修复绩效配置中心 Tab 切换显示问题及弹性高度方案。
 * @lines ~30
-->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Briefcase } from 'lucide-vue-next';
import IndicatorLibrary from '@/components/library/IndicatorLibrary.vue';
import TemplateList from '@/components/template/TemplateList.vue';

const route = useRoute();
const activeTab = ref('library');

onMounted(() => {
  if (route.query.tab === 'template') {
    activeTab.value = 'template';
  }
});

watch(() => route.query.tab, (newTab) => {
  if (newTab === 'template') {
    activeTab.value = 'template';
  } else if (newTab === 'library') {
    activeTab.value = 'library';
  }
});
</script>

<template>
  <div class="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
    <div class="flex items-center justify-between shrink-0">
      <div class="flex items-center gap-4">
        <div class="bg-indigo-50 p-3 rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-center">
          <Briefcase class="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight text-slate-900">
            绩效配置中心
          </h1>
          <p class="text-base text-slate-500">
            统一管理企业考核指标元数据与绩效评价模板
          </p>
        </div>
      </div>
    </div>

    <div class="custom-tabs-container flex-1 min-h-0 flex flex-col">
      <el-tabs
        v-model="activeTab"
        class="custom-tabs flex-1 flex flex-col min-h-0"
      >
        <el-tab-pane
          name="library"
          class="h-full"
        >
          <template #label>
            <div class="flex items-center py-2 px-1">
              <el-icon class="mr-2 text-blue-600">
                <Document />
              </el-icon>
              <span>指标元数据库</span>
            </div>
          </template>
          <div class="h-full pt-4 flex flex-col overflow-hidden">
            <IndicatorLibrary />
          </div>
        </el-tab-pane>
        
        <el-tab-pane
          name="template"
          class="h-full"
        >
          <template #label>
            <div class="flex items-center py-2 px-1">
              <el-icon class="mr-2 text-purple-600">
                <Memo />
              </el-icon>
              <span>考核模板管理</span>
            </div>
          </template>
          <div class="h-full pt-4 flex flex-col overflow-hidden">
            <TemplateList />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Custom styling to match previous look */
:deep(.custom-tabs .el-tabs__header) {
  margin-bottom: 0;
  border-bottom: none;
}

:deep(.custom-tabs .el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.custom-tabs .el-tabs__nav) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  background-color: rgb(241 245 249 / 0.5);
  padding: 0.375rem;
  border-radius: 1rem;
  box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
  border: 1px solid rgb(226 232 240 / 0.6);
  backdrop-filter: blur(4px);
}

:deep(.custom-tabs .el-tabs__item) {
  height: auto;
  padding: 0;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.3s;
  color: #64748b;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.custom-tabs .el-tabs__item.is-active) {
  background-color: white;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  color: #0f172a;
}

:deep(.custom-tabs .el-tabs__active-bar) {
  display: none;
}

:deep(.custom-tabs) {
  display: flex !important;
  flex-direction: column !important;
}

:deep(.custom-tabs .el-tabs__content) {
  flex: 1 !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
}

:deep(.custom-tabs .el-tab-pane) {
  height: 100%;
}

/* 仅对当前可见的 Pane 启用弹性布局，以保留原生隐藏逻辑 */
:deep(.custom-tabs .el-tab-pane:not([style*="display: none"])) {
  display: flex !important;
  flex-direction: column;
}
</style>
