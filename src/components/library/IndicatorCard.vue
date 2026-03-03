<script setup lang="ts">
import {
  Setting,
  TrendCharts,
  Goods,
  User,
  Operation,
  Histogram,
  Clock,
  Money,
} from '@element-plus/icons-vue'

export interface IndicatorData {
  id: string
  name: string
  dimension: string
  ruleType: string
  ruleDesc: string
  ruleCode?: string
  mapField?: string
  period?: string
}

const props = defineProps<{
  data: IndicatorData
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const getDimensionIcon = (dimension: string) => {
  switch (dimension) {
    case '销售业绩':
      return TrendCharts
    case '产品力':
      return Goods
    case '市场指标':
      return Operation
    case '渠道力':
      return Histogram
    case '费用管理':
      return Money
    case '组织力':
      return User
    case '行动计划':
      return Clock
    default:
      return Setting
  }
}

const getDimensionColor = (dimension: string) => {
  switch (dimension) {
    case '销售业绩':
      return 'bg-red-50 text-red-600 border-red-100'
    case '产品力':
      return 'bg-orange-50 text-orange-600 border-orange-100'
    case '市场指标':
      return 'bg-blue-50 text-blue-600 border-blue-100'
    case '渠道力':
      return 'bg-indigo-50 text-indigo-600 border-indigo-100'
    case '费用管理':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    case '组织力':
      return 'bg-purple-50 text-purple-600 border-purple-100'
    case '行动计划':
      return 'bg-cyan-50 text-cyan-600 border-cyan-100'
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100'
  }
}
</script>

<template>
  <el-card
    class="custom-card group relative cursor-pointer transition-all duration-300 border-slate-200 hover:border-blue-300"
    shadow="never"
    @click="emit('click')"
  >
    <div class="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-blue-500 transition-colors duration-300"></div>
    <div class="pb-1 px-1 pt-0 flex flex-col items-start gap-1.5">
      <el-tag
        effect="plain"
        size="default"
        :class="['font-bold px-3 py-1 text-xs border !h-6', getDimensionColor(data.dimension)]"
      >
        <div class="flex items-center">
          <el-icon class="w-3.5 h-3.5 mr-1.5"><component :is="getDimensionIcon(data.dimension)" /></el-icon>
          {{ data.dimension }}
        </div>
      </el-tag>
      <h3
        class="text-base font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mt-2"
        :title="data.name"
      >
        {{ data.name }}
      </h3>
    </div>
    <div class="px-2 pb-0 pt-2">
      <div class="flex items-center gap-1.5 mb-1.5">
        <el-icon class="h-4 w-4 text-slate-400 shrink-0"><Setting /></el-icon>
        <span class="text-sm font-medium text-slate-600 truncate">{{ data.ruleType }}</span>
      </div>
      <p
        class="text-xs text-slate-500 italic leading-relaxed line-clamp-2"
        :title="data.ruleDesc"
      >
        {{ data.ruleDesc }}
      </p>
    </div>
  </el-card>
</template>

<style scoped>
.custom-card {
  --el-card-padding: 16px;
  border-radius: 1rem;
}

.custom-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

:deep(.el-tag) {
  border-radius: 0.5rem;
}
</style>
