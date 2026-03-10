<!--
 * @author Zyr
 * @date 2026-03-06 15:25:00
 * @description 优化指标卡片样式：压缩高度、单行标题 Tooltip、样式精细化。
 * @update 2026-03-10 增加根据指标类型动态变色逻辑。
-->
<script setup lang="ts">
import { computed } from 'vue';
import {
  Setting,
  TrendCharts,
  Goods,
  User,
  Operation,
  Histogram,
  Clock,
  Money,
  Delete,
} from '@element-plus/icons-vue';

export interface IndicatorData {
  id: string | number;
  name: string;
  category: string;
  ruleType?: string;
  ruleDesc?: string;
  ruleId?: number | string;
  expression?: string;
  mapField?: string;
  evaluationCycle?: string;
  indicatorRuleName?: string;
  indicatorRuleDescription?: string;
  nature?: number;
  unit?: string;
}

const props = defineProps<{
  data: IndicatorData
}>();

const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'delete', data: IndicatorData): void;
}>();

const getDimensionIcon = (category: string) => {
  switch (category?.trim()) {
  case '销售业绩': return TrendCharts;
  case '产品力': return Goods;
  case '市场指标': return Operation;
  case '渠道力': return Histogram;
  case '费用管理': return Money;
  case '组织力': return User;
  case '行动计划': return Clock;
  default: return Setting;
  }
};

/** 
 * 根据分类获取主题色
 * 使用 CSS 变量以确保 Tailwind 能够正确渲染（绕过动态类名扫描限制）
 */
const getCategoryColor = (category: string) => {
  switch (category?.trim()) {
  case '销售业绩': return '#f43f5e'; // rose-500
  case '产品力': return '#f97316';   // orange-500
  case '市场指标': return '#3b82f6'; // blue-500
  case '渠道力': return '#6366f1';   // indigo-500
  case '费用管理': return '#10b981'; // emerald-500
  case '组织力': return '#a855f7';   // purple-500
  case '行动计划': return '#06b6d4'; // cyan-500
  default: return '#64748b';        // slate-500
  }
};

const cardStyle = computed(() => {
  const color = getCategoryColor(props.data.category);
  return {
    '--theme-color': color,
    '--theme-color-light': `${color}15`, // 主题色的浅色背景（约 8% 透明度）
    '--theme-color-hover': `${color}4D`, // 悬浮时的边框色（约 30% 透明度）
  };
});
</script>

<template>
  <el-card
    class="custom-card group relative cursor-pointer transition-all duration-300 border-slate-100 hover:shadow-lg"
    :style="cardStyle"
    shadow="never"
    @click="emit('click')"
  >
    <!-- 左侧装饰条：默认淡灰，悬浮变为主体色 -->
    <div class="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-[var(--theme-color)] transition-all duration-300" />
    
    <!-- 右上角悬浮删除按钮 -->
    <el-button
      type="danger"
      circle
      class="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm z-10 hover:scale-110"
      plain
      @click.stop="emit('delete', data)"
    >
      <el-icon><Delete /></el-icon>
    </el-button>
    
    <div class="h-full flex flex-col pl-2">
      <!-- 头部：极简分类 Tag -->
      <div class="flex flex-col items-start gap-3 mb-2">
        <div
          class="flex items-center px-4 py-1 rounded-full font-bold text-[12px] transition-all shadow-sm bg-[var(--theme-color-light)] text-[var(--theme-color)]"
        >
          <el-icon class="mr-2 text-[14px]">
            <component :is="getDimensionIcon(data.category)" />
          </el-icon>
          <span>{{ data.category }}</span>
        </div>
        
        <el-tooltip
          effect="dark"
          :content="data.name"
          placement="top-start"
          :show-after="500"
        >
          <h3
            class="text-base font-bold text-slate-800 leading-tight group-hover:text-[var(--theme-color)] transition-colors truncate w-full"
          >
            {{ data.name }}
          </h3>
        </el-tooltip>
      </div>

      <!-- 中部：规则信息 -->
      <div class="flex-grow space-y-2 mt-1">
        <div class="flex items-start gap-2">
          <el-icon class="h-4 w-4 text-slate-400 mt-0.5 shrink-0">
            <Operation />
          </el-icon>
          <span class="text-xs font-semibold text-slate-600 truncate">
            {{ data.indicatorRuleName || data.ruleType || '未关联计分规则' }}
          </span>
        </div>
        
        <p
          class="text-xs text-slate-400 italic leading-relaxed line-clamp-2"
          :title="data.indicatorRuleDescription || data.ruleDesc"
        >
          {{ data.indicatorRuleDescription || data.ruleDesc || '暂无规则描述' }}
        </p>
      </div>

      <!-- 底部：单位 -->
      <div
        v-if="data.unit"
        class="mt-3 pt-3 border-t border-slate-50"
      >
        <div class="flex items-center gap-1.5">
          <span class="text-[9px] font-bold text-slate-300 uppercase tracking-widest">UNIT</span>
          <span class="text-xs font-bold text-slate-600">{{ data.unit }}</span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.custom-card {
  --el-card-padding: 16px 18px;
  border-radius: 1rem;
  height: 168px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
}

.custom-card:hover {
  transform: translateY(-2px);
  /* 使用 CSS 变量动态调整边框颜色 */
  border-color: var(--theme-color-hover) !important;
}

:deep(.el-card__body) {
  height: 100%;
  padding: var(--el-card-padding);
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}
</style>
