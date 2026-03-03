<script setup lang="ts">
import { ref } from 'vue';
import IndicatorLibrary from '@/components/library/IndicatorLibrary.vue';
import TemplateList from '@/components/template/TemplateList.vue';

const activeTab = ref('library');
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center">
          <el-icon class="text-xl text-white">
            <Setting />
          </el-icon>
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

    <div class="custom-tabs-container">
      <el-tabs
        v-model="activeTab"
        class="custom-tabs"
      >
        <el-tab-pane name="library">
          <template #label>
            <div class="flex items-center py-2 px-1">
              <el-icon class="mr-2 text-blue-600">
                <Document />
              </el-icon>
              <span>指标元数据库</span>
            </div>
          </template>
          <div class="mt-8">
            <IndicatorLibrary />
          </div>
        </el-tab-pane>
        
        <el-tab-pane name="template">
          <template #label>
            <div class="flex items-center py-2 px-1">
              <el-icon class="mr-2 text-purple-600">
                <Memo />
              </el-icon>
              <span>考核模板管理</span>
            </div>
          </template>
          <div class="mt-8">
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
</style>
