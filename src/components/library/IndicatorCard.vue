<!--
 * @author Zyr
 * @date 2026-03-06 15:25:00
 * @description 优化指标卡片样式：压缩高度、单行标题 Tooltip、样式精细化。
 * @update 2026-03-10 增加根据指标类型动态变色逻辑。
-->
<script setup lang="ts">
import { computed } from 'vue';
import {
  TrendingUp,
  Package,
  Target,
  BarChart3,
  Wallet,
  Users,
  Timer,
  Settings,
  Calculator,
  Trash2,
} from 'lucide-vue-next';

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

const getDimensionStyles = (category: string) => {
  const d = category?.trim();
  if (d === '销售业绩') return { color: '#f43f5e', icon: TrendingUp };
  if (d === '产品力') return { color: '#f97316', icon: Package };
  if (d === '市场指标') return { color: '#3b82f6', icon: Target };
  if (d === '渠道力') return { color: '#6366f1', icon: BarChart3 };
  if (d === '费用管理') return { color: '#10b981', icon: Wallet };
  if (d === '组织力') return { color: '#a855f7', icon: Users };
  if (d === '行动计划') return { color: '#06b6d4', icon: Timer };
  return { color: '#64748b', icon: Settings };
};

const cardStyle = computed(() => {
  const { color } = getDimensionStyles(props.data.category);
  return {
    '--theme-color': color,
    '--theme-color-light': `${color}15`,
    '--theme-color-hover': `${color}4D`,
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
      <el-icon><Trash2 /></el-icon>
    </el-button>
    
    <div class="h-full flex flex-col pl-2">
      <!-- 头部：极简分类 Tag -->
      <div class="flex flex-col items-start gap-3 mb-2">
        <div
          class="flex items-center px-4 py-1 rounded-full font-bold text-[12px] transition-all shadow-sm bg-[var(--theme-color-light)] text-[var(--theme-color)]"
        >
          <component :is="getDimensionStyles(data.category).icon" class="mr-2 h-3.5 w-3.5" />
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
          <Calculator class="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
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
