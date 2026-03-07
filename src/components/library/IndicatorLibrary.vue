<!--
 * @author Zyr
 * @date 2026-03-06 15:25:00
 * @description 优化指标库列表页高度适应逻辑及内滚。
 * @lines ~40
-->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import IndicatorCard, { type IndicatorData } from '@/components/library/IndicatorCard.vue';
import IndicatorWizard from '@/components/library/IndicatorWizard.vue';
import { getDictOptions } from '@/utils/dict';
import { getIndicatorPage, deleteIndicator } from '@/api/library';
import { ElMessageBox } from 'element-plus';
import { ElMessage } from 'element-plus';

const search = ref('');
const dimensionFilter = ref('all');
const indicators = ref<IndicatorData[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(12);
const loading = ref(false);

const isWizardOpen = ref(false);
const editingIndicator = ref<IndicatorData | null>(null);

/** 获取分页列表数据 */
const fetchIndicators = async () => {
  try {
    loading.value = true;
    const params = {
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      name: search.value || undefined,
      category: dimensionFilter.value === 'all' ? undefined : dimensionFilter.value,
    };
    const res: any = await getIndicatorPage(params);
    if (res.code === 0 && res.data) {
      indicators.value = res.data.list || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error('Fetch failed:', error);
    ElMessage.error('获取指标库数据失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchIndicators();
});

// 监听搜索和过滤
watch([search, dimensionFilter], () => {
  pageNo.value = 1;
  fetchIndicators();
});

const handleEdit = (indicator: IndicatorData) => {
  editingIndicator.value = indicator;
  isWizardOpen.value = true;
};

const handleAddNew = () => {
  editingIndicator.value = null;
  isWizardOpen.value = true;
};

const handleSave = () => {
  // 保存成功后刷新列表
  fetchIndicators();
  isWizardOpen.value = false;
};

const handleDelete = (indicator: IndicatorData) => {
  ElMessageBox.confirm(
    `确定要删除指标 "${indicator.name}" 吗？该操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(async () => {
    try {
      const res: any = await deleteIndicator(Number(indicator.id));
      if (res.code === 0) {
        ElMessage.success('指标删除成功');
        fetchIndicators();
      } else {
        ElMessage.error(res.msg || '删除失败，请重试');
      }
    } catch (error: any) {
      console.error('Delete indicator err:', error);
      if (error && error.message) {
        ElMessage.error(error.message);
      }
    }
  }).catch(() => {
    // catch cancel
  });
};
</script>

<template>
  <!-- 主容器：灵活高度撑满整个工作区并处理内部溢出 -->
  <div 
    class="flex-1 flex flex-col space-y-6 min-h-0"
  >
    <div class="flex flex-wrap items-center justify-between gap-6">
      <div class="min-w-[300px] flex-shrink-0">
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 border-l-4 border-blue-600 pl-3">
          企业指标元数据库
        </h2>
        <p class="text-sm text-slate-500 mt-1 pl-4">
          管理维护全公司所有业务及职能部门的考核考分元数据标准。
        </p>
      </div>
      <div class="flex flex-nowrap items-center gap-4 flex-shrink-0 overflow-x-auto">
        <el-input
          v-model="search"
          placeholder="搜索指标名称..."
          class="custom-input"
          style="width: 320px; flex-shrink: 0;"
          size="large"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="dimensionFilter"
          placeholder="全部分类"
          class="custom-select"
          style="width: 320px; flex-shrink: 0;"
          size="large"
        >
          <el-option
            label="全部分类"
            value="all"
          />
          <el-option
            v-for="dict in getDictOptions('classification_performance_indicators_type')"
            :key="dict.value"
            :label="dict.label"
            :value="dict.label"
          />
        </el-select>

        <el-button
          type="primary"
          class="custom-button px-6"
          @click="handleAddNew"
        >
          <el-icon class="mr-1.5">
            <Plus />
          </el-icon>
          <span class="text-base">新建指标</span>
        </el-button>
      </div>
    </div>

    <!-- 滚动区域：包含卡片网格，自适应剩余高度 -->
    <div 
      v-loading="loading"
      class="flex-1 overflow-y-auto pr-3 custom-scrollbar"
      style="min-height: 0;"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
        <IndicatorCard
          v-for="ind in indicators"
          :key="ind.id"
          :data="ind"
          @click="handleEdit(ind)"
          @delete="handleDelete"
        />
        
        <div
          v-if="!loading && indicators.length === 0"
          class="col-span-full flex flex-col items-center justify-center p-12 text-slate-500 border border-dashed rounded-lg bg-white"
        >
          <el-icon class="text-4xl mb-4 text-slate-300">
            <Document />
          </el-icon>
          <p>未找到符合条件的指标</p>
        </div>
      </div>
    </div>
    
    <div
      v-if="total > pageSize"
      class="flex justify-end mt-8"
    >
      <el-pagination
        v-model:current-page="pageNo"
        v-model:page-size="pageSize"
        :total="total"
        background
        layout="prev, pager, next"
        @current-change="fetchIndicators"
      />
    </div>

    <IndicatorWizard
      v-model:is-open="isWizardOpen"
      :initial-data="editingIndicator"
      @save="handleSave"
    />
  </div>
</template>

<style scoped>
.custom-input :deep(.el-input__wrapper) {
  background-color: white;
  height: 44px;
  border-radius: 0.75rem;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  font-size: 1rem;
}

.custom-select :deep(.el-input__wrapper) {
  height: 44px;
  border-radius: 0.75rem;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  font-size: 1rem;
}

.custom-button {
  height: 44px;
  border-radius: 0.75rem;
  font-weight: 700;
  background-color: #2563eb;
  border-color: #2563eb;
}

.custom-button:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}

/* 隐藏外层主容器的滚动条逻辑 */
:deep(.custom-scrollbar::-webkit-scrollbar) {
  width: 6px;
}

:deep(.custom-scrollbar::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.custom-scrollbar::-webkit-scrollbar-thumb) {
  background: #e2e8f0;
  border-radius: 3px;
}

:deep(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
  background: #cbd5e1;
}
</style>
