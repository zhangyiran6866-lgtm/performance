<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { IndicatorData } from './IndicatorCard.vue';
import { getDictOptions } from '@/utils/dict';
import { getScoreRuleList } from '@/api/library';

/**
 * @author Zyr
 * @date 2026-03-05 14:04:00
 * @description 引入字典获取维度配置数据
 * @lines 10
 */

const props = defineProps<{
  isOpen: boolean
  initialData: IndicatorData | null
}>();

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: IndicatorData): void
  (e: 'update:isOpen', value: boolean): void
}>();

const step = ref(1);

/** 后端返回的规则项类型 */
interface RuleItem {
  id: number;
  name: string;
  type: string;
  expression: string;
  description: string;
  createTime: number;
}

/** 解析后的 expression 缓存 */
interface ParsedExpression {
  fullScore?: number;
  baseline?: number;
  type?: string;
  [key: string]: any;
}

/** 从 API 获取的规则列表 */
const ruleOptions = ref<RuleItem[]>([]);
const ruleLoading = ref(false);

const formData = ref({
  name: '',
  dimension: '销售业绩',
  mapField: '',
  period: 'month',
  ruleCode: 0 as number,
});

const previewValue = ref(85);
const deductValue = ref(0);

// 获取维度分类字典项
const dimensionOptions = computed(() => getDictOptions('classification_performance_indicators_type'));

/** 当前选中规则的完整数据 */
const currentRule = computed(() => {
  return ruleOptions.value.find((r) => r.id === formData.value.ruleCode) || null;
});

/** 解析当前选中规则的 expression */
const parsedExpression = computed<ParsedExpression>(() => {
  if (!currentRule.value?.expression) return {};
  try {
    // 后端有些 expression 含有 JS 注释，需要清理
    const cleaned = currentRule.value.expression.replace(/\/\/[^\n]*/g, '');
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
});

/** 判断当前规则是否为阶梯制（通过 expression 中的 type === 'step' 判断） */
const isStepRule = computed(() => parsedExpression.value.type === 'step');

/** 判断当前规则是否为预算控制（扣分型） */
const isBudgetRule = computed(() => {
  if (!currentRule.value) return false;
  return currentRule.value.type === 'DIRECT_RATIO';
});

/** 判断当前规则是否为任务节点（二元型） */
const isTaskRule = computed(() => {
  if (!currentRule.value) return false;
  return currentRule.value.type === 'RANGE_SCORE';
});

/** 判断当前规则是否为定性分级 */
const isQualitativeGrade = computed(() => {
  if (!currentRule.value) return false;
  return currentRule.value.type === 'QUALITATIVE_GRADE';
});

/** 加载规则列表 */
const fetchRules = async () => {
  ruleLoading.value = true;
  try {
    const res: any = await getScoreRuleList();
    if (res.code === 0 && Array.isArray(res.data)) {
      ruleOptions.value = res.data;
      // 如果当前没有选中规则，默认选第一个
      if (!formData.value.ruleCode && ruleOptions.value.length > 0) {
        formData.value.ruleCode = ruleOptions.value[0].id;
      }
    }
  } catch (e) {
    console.error('获取计分规则列表失败', e);
  } finally {
    ruleLoading.value = false;
  }
};



const internalOpen = computed({
  get: () => props.isOpen,
  set: (val) => {
    emit('update:isOpen', val);
    if (!val) emit('close');
  },
});

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      if (props.initialData) {
        formData.value = {
          name: props.initialData.name || '',
          dimension: props.initialData.dimension || '销售业绩',
          mapField: props.initialData.mapField || '',
          period: props.initialData.period || 'month',
          ruleCode: (props.initialData.ruleCode as number) || (ruleOptions.value[0]?.id ?? 0),
        };
      } else {
        formData.value = {
          name: '',
          dimension: '销售业绩',
          mapField: '',
          period: 'month',
          ruleCode: ruleOptions.value[0]?.id ?? 0,
        };
      }
      step.value = 1;
    }
  },
);

const handleNext = async () => {
  await fetchRules();
  step.value = 2;
};

const handleBack = () => {
  step.value = 1;
};

const handleSave = () => {
  const rule = currentRule.value;
  const ruleType = rule?.name || '';
  const ruleDesc = rule?.description || '';

  const resultData: IndicatorData = {
    id: props.initialData?.id || Date.now().toString(),
    ...formData.value,
    ruleType,
    ruleDesc,
    expression: rule?.expression || '',
  };

  emit('save', resultData);
};

/** 阶梯制得分：根据 expression 中的 fullScore（满分线）和 baseline（底线）动态计算 */
const stepScore = computed(() => {
  const expr = parsedExpression.value;
  const min = expr.baseline ?? 70;
  const max = expr.fullScore ?? 90;

  const val = previewValue.value;
  if (val < min) return 0;
  if (val >= max) return 100;
  return Math.round(((val - min) / (max - min)) * 100);
});

const budgetScore = computed(() => {
  return Math.max(0, 100 - deductValue.value);
});

const onRuleChange = (v: number) => {
  formData.value.ruleCode = v;
  previewValue.value = 85;
  deductValue.value = 0;
};
</script>

<template>
  <el-dialog
    v-model="internalOpen"
    :title="initialData ? '编辑指标配置元数据' : '新增指标配置元数据'"
    width="700px"
    class="custom-wizard-dialog"
    destroy-on-close
  >
    <template #header>
      <div class="px-2">
        <h3 class="text-xl font-bold text-slate-800">
          {{ initialData ? '编辑指标配置元数据' : '新增指标配置元数据' }}
        </h3>
        <p class="mt-1.5 text-slate-500 text-sm font-normal leading-relaxed">
          采用向导模式配置指标元数据，配置完成后，可配置成考核目标分发汇入各个各业务或职能部门的月底绩效报表中。
        </p>
      </div>
    </template>

    <div class="px-2 py-2">
      <div
        v-if="step === 1"
        class="space-y-5 animate-in fade-in"
      >
        <div class="space-y-2">
          <label class="text-slate-700 font-semibold text-sm">指标名称</label>
          <el-input
            v-model="formData.name"
            placeholder="例如: 月度大单品销售达成率"
            class="custom-input-h10"
          />
        </div>

        <div class="grid grid-cols-2 gap-5">
          <div class="space-y-2">
            <label class="text-slate-700 font-semibold text-sm">所属维度分类</label>
            <el-select
              v-model="formData.dimension"
              placeholder="选择所属维度"
              class="w-full custom-select-h10"
            >
              <el-option
                v-for="dict in dimensionOptions"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </div>
          <div class="space-y-2">
            <label class="text-slate-700 font-semibold text-sm">考核周期</label>
            <el-select
              v-model="formData.period"
              placeholder="选择考核周期"
              class="w-full custom-select-h10"
            >
              <el-option
                label="月度"
                value="month"
              />
              <el-option
                label="季度"
                value="quarter"
              />
              <el-option
                label="年度"
                value="year"
              />
            </el-select>
          </div>
        </div>
      </div>

      <div
        v-else
        class="space-y-5 animate-in fade-in"
      >
        <div class="space-y-2">
          <label class="text-slate-700 font-semibold text-sm">考核记分规则</label>
          <el-select
            v-model="formData.ruleCode"
            placeholder="选择预设的记分逻辑"
            class="w-full custom-rule-select"
            :loading="ruleLoading"
            @change="onRuleChange"
          >
            <el-option
              v-for="rule in ruleOptions"
              :key="rule.id"
              :label="rule.name"
              :value="rule.id"
            />
          </el-select>
          <p class="text-xs text-slate-500 ml-1 mt-1.5 leading-relaxed">
            {{ currentRule?.description || '该规则决定了该指标在月末是如何将"实际业务数值"自动转化成"绩效考分"的。' }}
          </p>
        </div>

        <!-- Step rules preview (阶梯制) -->
        <div
          v-if="isStepRule"
          class="space-y-6 mt-4 p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-semibold text-slate-700">完成率模拟: {{ previewValue }}%</span>
            <el-tag
              effect="dark"
              :type="stepScore >= 100 ? 'success' : stepScore === 0 ? 'danger' : ''"
              class="px-3 shadow-sm border-none font-bold"
            >
              预计考核得分: {{ stepScore }} 分
            </el-tag>
          </div>
          <el-slider
            v-model="previewValue"
            :max="120"
            :step="1"
            class="custom-slider"
          />
          <div class="relative w-full h-8 mt-2">
            <span class="absolute left-0 text-xs text-slate-400 font-medium -translate-x-1/2">0%</span>
            <span
              class="absolute text-xs text-slate-500 font-bold -translate-x-full flex flex-col items-end"
              :style="{ left: `${((parsedExpression.baseline ?? 70) / 120) * 100}%` }"
            >
              <span class="h-2 w-px bg-slate-400 mb-1" />
              {{ parsedExpression.baseline ?? 70 }}% (零分线)
            </span>
            <span
              class="absolute text-xs text-blue-600 font-bold flex flex-col items-start"
              :style="{
                left: `${((parsedExpression.fullScore ?? 90) / 120) * 100}%`,
              }"
            >
              <span class="h-2 w-px bg-blue-300 mb-1" />
              {{ parsedExpression.fullScore ?? 90 }}% (满分线)
            </span>
            <span class="absolute right-0 text-xs text-slate-400 font-medium translate-x-1/2">120%</span>
          </div>
        </div>

        <!-- Budget rule preview (预算控制扣分型) -->
        <div
          v-else-if="isBudgetRule"
          class="space-y-6 mt-4 p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-semibold text-slate-700">超出预算模拟: {{ deductValue }}%</span>
            <el-tag
              effect="dark"
              :type="budgetScore >= 100 ? 'success' : budgetScore === 0 ? 'danger' : 'warning'"
              class="px-3 shadow-sm border-none font-bold"
            >
              预计考核得分: {{ budgetScore }} 分
            </el-tag>
          </div>
          <el-slider
            v-model="deductValue"
            :max="120"
            :step="1"
            class="custom-slider orange"
          />
          <div class="relative w-full h-8 mt-2">
            <span class="absolute left-0 text-xs text-emerald-600 font-bold flex flex-col items-start">
              <span class="h-2 w-px bg-emerald-300 mb-1" />
              ≤0% (满分线)
            </span>
            <span
              class="absolute text-xs text-red-500 font-bold -translate-x-1/2 flex flex-col items-center"
              :style="{ left: '83.33%' }"
            >
              <span class="h-2 w-px bg-red-300 mb-1" />
              100% (扣完线)
            </span>
            <span class="absolute right-0 text-xs text-slate-400 font-medium translate-x-1/2">120%</span>
          </div>
        </div>

        <!-- Qualitative grade preview (定性分级) -->
        <div
          v-else-if="isQualitativeGrade"
          class="mt-4 p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm"
        >
          <p class="text-sm font-semibold text-slate-700 mb-3">
            定性分级预设
          </p>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="grade in (parsedExpression.grades || [])"
              :key="grade.name"
              class="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-100"
            >
              <span class="text-sm font-medium text-slate-700">{{ grade.name }}</span>
              <el-tag
                size="small"
                effect="plain"
                class="font-bold"
              >
                {{ grade.score }} 分
              </el-tag>
            </div>
          </div>
        </div>

        <!-- Task node preview (任务节点二元型) -->
        <div
          v-else-if="isTaskRule"
          class="mt-4 p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-sm text-slate-500 min-h-[100px] shadow-sm"
        >
          按期完成得满分 ({{ parsedExpression.fullScore ?? 100 }} 分)，逾期或未完成得 0 分。
        </div>

        <!-- Generic fallback -->
        <div
          v-else
          class="mt-4 p-5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-sm text-slate-500 min-h-[100px] shadow-sm"
        >
          通用打分预设，直接由考核人在月底输入 0-100 的数值。
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full px-2">
        <div>
          <el-button
            v-if="step === 2"
            @click="handleBack"
          >
            上一步
          </el-button>
        </div>
        <div class="flex gap-2">
          <el-button @click="internalOpen = false">
            取消
          </el-button>
          <el-button
            v-if="step === 1"
            type="primary"
            :disabled="!formData.name || !formData.dimension"
            @click="handleNext"
          >
            下一步，配置记分规则
          </el-button>
          <el-button
            v-else
            type="primary"
            class="px-6"
            @click="handleSave"
          >
            完成配置并保存
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.custom-wizard-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid #e2e8f0;
  padding: 1.25rem 1.5rem;
}

.custom-wizard-dialog :deep(.el-dialog__body) {
  padding: 1.5rem;
  background-color: rgb(248 250 252 / 0.3);
}

.custom-wizard-dialog :deep(.el-dialog__footer) {
  border-top: 1px solid #e2e8f0;
  padding: 1rem 1.5rem;
  background-color: #f8fafc;
  border-bottom-left-radius: 0.75rem;
  border-bottom-right-radius: 0.75rem;
}

.custom-input-h10 :deep(.el-input__wrapper) {
  height: 40px;
  border-radius: 0.5rem;
}

.custom-select-h10 :deep(.el-input__wrapper) {
  height: 40px;
  border-radius: 0.5rem;
}

.custom-rule-select :deep(.el-input__wrapper) {
  height: 48px;
  border-radius: 0.5rem;
  background-color: #eff6ff;
  box-shadow: 0 0 0 1px #bfdbfe inset;
}

.custom-slider {
  --el-slider-main-bg-color: #2563eb;
  padding: 0 10px;
}

.custom-slider.orange {
  --el-slider-main-bg-color: #f97316;
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
