<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Search,
  CircleCheck as CheckCircle2,
  Loading as CircleDashed,
  Warning as AlertCircle,
  Operation as Calculator,
  FolderChecked as Save,
  ArrowRight as ChevronRight,
  Right as ArrowRight,
  User,
  ChatDotRound as MessageSquare,
  TrendCharts as TrendingUp,
  Cloudy as History,
  InfoFilled as Info,
} from '@element-plus/icons-vue';

// Define Props
interface Props {
  isLocked?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  isLocked: false,
});

// Mock Data
const employees = [
  { id: 'emp-001', name: '李小明', role: '初级销售', avatar: 'XM', status: 'pending_rate' },
  { id: 'emp-002', name: '王大利', role: '资深销售', avatar: 'DL', status: 'pending_rate' },
  { id: 'emp-003', name: '张美美', role: '初级销售', avatar: 'MM', status: 'rated' },
  { id: 'emp-004', name: '赵铁柱', role: '店长助理', avatar: 'TZ', status: 'rated' },
  { id: 'emp-005', name: '孙小圣', role: '初级销售', avatar: 'XS', status: 'pending_rate' },
];

const resultIndicators = [
  {
    id: 'r-001',
    name: '季均客单价达标率',
    nature: '定量计算',
    weight: 20,
    targetValue: '150',
    actualValue: '135',
    unit: '元',
    systemScore: 85,
    finalScore: 85,
    ruleType: '90/70阶梯制(标准型)',
    supervisorComment: null,
  },
  {
    id: 'r-002',
    name: '新品上架计划达成率',
    nature: '定量计算',
    weight: 10,
    targetValue: '12',
    actualValue: '11',
    unit: '个SKU',
    systemScore: 92,
    finalScore: 92,
    ruleType: '100/70阶梯制(严格型)',
    supervisorComment: null,
  },
  {
    id: 'r-003',
    name: '主推大单品销售目标达成率',
    nature: '定量计算',
    weight: 15,
    targetValue: '80,000',
    actualValue: '57,600',
    unit: '元',
    systemScore: 71,
    finalScore: 71,
    ruleType: '90/70阶梯制(标准型)',
    supervisorComment: null,
  },
  {
    id: 'r-005',
    name: '价值观考核',
    nature: '定性评分',
    weight: 15,
    targetValue: null,
    actualValue: null,
    unit: null,
    systemScore: null,
    finalScore: null,
    ruleType: '定性测定(直接打分)',
    supervisorComment: '',
  },
  {
    id: 'r-006',
    name: '工作态度与主动性',
    nature: '定性评分',
    weight: 15,
    targetValue: null,
    actualValue: null,
    unit: null,
    systemScore: null,
    finalScore: null,
    ruleType: '定性测定(直接打分)',
    supervisorComment: '',
  },
  {
    id: 'r-007',
    name: '客户投诉处理满意度',
    nature: '定性评分',
    weight: 10,
    targetValue: null,
    actualValue: null,
    unit: null,
    systemScore: null,
    finalScore: null,
    ruleType: '定性测定(直接打分)',
    supervisorComment: '',
  },
];

const searchQuery = ref('');
const selectedEmpId = ref('emp-001');
const activeIndicatorTab = ref('all'); // all, quantitative, qualitative

const qualitativeScores = ref<Record<string, number>>({});
const qualitativeComments = ref<Record<string, string>>({});

const selectedEmp = computed(() => employees.find((e) => e.id === selectedEmpId.value));

const filteredEmployees = computed(() =>
  employees.filter((e) => e.name.includes(searchQuery.value)),
);

const filteredIndicators = computed(() => {
  if (activeIndicatorTab.value === 'quantitative') {
    return resultIndicators.filter((i) => i.nature === '定量计算');
  } else if (activeIndicatorTab.value === 'qualitative') {
    return resultIndicators.filter((i) => i.nature === '定性评分');
  }
  return resultIndicators;
});




const getScoreGrade = (score: number) => {
  if (score >= 90) return { label: 'A', class: 'bg-emerald-100 text-emerald-700' };
  if (score >= 80) return { label: 'B', class: 'bg-blue-100 text-blue-700' };
  if (score >= 70) return { label: 'C', class: 'bg-amber-100 text-amber-700' };
  return { label: 'D', class: 'bg-red-100 text-red-700' };
};
</script>

<template>
  <div class="min-h-full flex flex-col bg-slate-50/10">
    <!-- Workspace Grid -->
    <div class="flex-1 p-4 grid grid-cols-12 gap-6 items-start">
      <!-- Left: Navigation Sidebar -->
      <div
        class="col-span-3 flex flex-col gap-6 sticky top-4"
        style="height: calc(100vh - 220px);"
      >
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div class="p-5 border-b border-slate-100 bg-slate-50/30">
            <el-input 
              v-model="searchQuery" 
              placeholder="搜索考核对象..." 
              class="custom-search-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <div class="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            <div
              v-for="emp in filteredEmployees"
              :key="emp.id"
              :class="[
                'group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-300 border-2',
                selectedEmpId === emp.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'border-transparent hover:bg-slate-50 hover:border-slate-100'
              ]"
              @click="selectedEmpId = emp.id"
            >
              <div class="flex items-center gap-3 min-w-0">
                <el-avatar 
                  :size="40" 
                  :class="[
                    'shadow-sm border-2 border-white shrink-0',
                    selectedEmpId === emp.id ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-slate-100 text-slate-500 font-medium'
                  ]"
                >
                  {{ emp.avatar }}
                </el-avatar>
                <div class="min-w-0">
                  <div class="font-bold text-slate-800 truncate">
                    {{ emp.name }}
                  </div>
                  <div class="text-[10px] text-slate-400 font-medium mt-0.5">
                    {{ emp.role }}
                  </div>
                </div>
              </div>
              <el-icon
                :class="[
                  'h-5 w-5 transition-colors',
                  emp.status === 'rated' ? 'text-emerald-500' : 'text-slate-200'
                ]"
              >
                <component :is="emp.status === 'rated' ? CheckCircle2 : CircleDashed" />
              </el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Main Form Body -->
      <div class="col-span-9 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col">
        <template v-if="selectedEmp">
          <!-- Detail Header -->
          <div class="px-8 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-5">
              <div class="relative">
                <el-avatar 
                  :size="64" 
                  class="shadow-md border-4 border-white bg-indigo-100 text-indigo-700 text-xl font-black"
                >
                  {{ selectedEmp.avatar }}
                </el-avatar>
                <div class="absolute -right-1 -bottom-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow-sm flex items-center justify-center">
                  <el-icon :size="10">
                    <CheckCircle2 />
                  </el-icon>
                </div>
              </div>
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <h4 class="text-2xl font-black text-slate-900 tracking-tight">
                    {{ selectedEmp.name }}
                  </h4>
                  <el-tag
                    effect="plain"
                    type="info"
                    class="font-bold border-slate-200 text-slate-500"
                  >
                    工号 00{{ selectedEmp.id.split('-')[1] }}
                  </el-tag>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm font-medium text-slate-500">归属部门: 华中销售一区</span>
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span class="text-sm font-medium text-slate-500">当前模板: C1类销售岗位基础考评</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex items-center gap-3 px-4 py-2 bg-slate-100/80 rounded-xl border border-slate-200/50 mr-2">
                <span class="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">当前合计预估分</span>
                <span class="text-xl font-black text-indigo-700 tracking-tighter tabular-nums leading-none">84.2</span>
              </div>
              <el-button
                :disabled="props.isLocked"
                @click=""
              >
                <el-icon class="mr-2">
                  <History />
                </el-icon>
                查看历史评价
              </el-button>
              <el-button
                type="primary"
                :disabled="props.isLocked"
              >
                <el-icon class="mr-2">
                  <Save />
                </el-icon>
                暂存打分
              </el-button>
            </div>
          </div>

          <!-- Forms Container - Expanding content -->
          <div class="flex-1 px-8 py-8 space-y-10 bg-slate-50/20">
            <div
              v-if="props.isLocked"
              class="mb-4"
            >
              <div class="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl flex items-center gap-3 text-sm">
                <AlertCircle class="h-5 w-5 text-amber-500 shrink-0" />
                <p class="font-medium">
                  当前不处于考考评阶段，系统已处于只读浏览模式。
                </p>
              </div>
            </div>
            <!-- Indicator List -->
            <div class="grid gap-8">
              <el-card 
                v-for="(ind, index) in filteredIndicators" 
                :key="ind.id"
                shadow="hover"
                class="border-slate-200 custom-indicator-card"
              >
                <div class="p-4 md:p-5">
                  <div class="flex flex-col md:flex-row gap-5 items-start">
                    <!-- Left: Basic Info -->
                    <div class="flex-1 space-y-3">
                      <div class="flex items-center gap-3">
                        <span class="h-6 w-6 bg-slate-900 text-white text-[10px] font-black flex items-center justify-center rounded-lg shadow-sm">{{ index + 1 }}</span>
                        <h5 class="text-lg font-black text-slate-900">
                          {{ ind.name }}
                        </h5>
                        <el-tag
                          size="small"
                          effect="light"
                          type="primary"
                          class="font-bold border-none"
                        >
                          {{ ind.nature }}
                        </el-tag>
                      </div>
                       
                      <div class="flex flex-wrap gap-3">
                        <div class="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                          <el-icon><Calculator /></el-icon>
                          计分规则: <span class="text-slate-700">{{ ind.ruleType }}</span>
                        </div>
                        <div class="w-px h-3 bg-slate-200" />
                        <div class="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                          <el-icon><TrendingUp /></el-icon>
                          权重占比: <span class="text-slate-700 font-black">{{ ind.weight }}%</span>
                        </div>
                      </div>

                      <div
                        v-if="ind.nature === '定量计算'"
                        class="grid grid-cols-2 lg:grid-cols-3 gap-3"
                      >
                        <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div class="text-[10px] text-slate-400 font-black uppercase mb-0.5">
                            目标额
                          </div>
                          <div class="font-black text-slate-800">
                            {{ ind.targetValue }} <span class="text-[10px] font-medium">{{ ind.unit }}</span>
                          </div>
                        </div>
                        <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div class="text-[10px] text-slate-400 font-black uppercase mb-0.5">
                            完成量
                          </div>
                          <div class="font-black text-slate-800">
                            {{ ind.actualValue }} <span class="text-[10px] font-medium">{{ ind.unit }}</span>
                          </div>
                        </div>
                        <div class="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 hidden lg:block">
                          <div class="text-[10px] text-emerald-600 font-black uppercase mb-0.5 text-center">
                            系统公式初算
                          </div>
                          <div class="font-black text-emerald-700 text-lg text-center leading-none">
                            {{ ind.systemScore }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Right: Input Control -->
                    <div class="w-full md:w-[320px] lg:w-[360px] shrink-0 space-y-3">
                      <template v-if="ind.nature === '定量计算'">
                        <div class="bg-slate-50/80 rounded-2xl border border-slate-200 overflow-hidden relative group/input">
                          <div class="px-5 py-2 border-b border-slate-200/50 flex items-center justify-between">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">最终判定得分 (由系统生成)</span>
                            <el-tooltip
                              effect="dark"
                              content="该项为系统固话指标，分数来源于底层业务系统通过公式自动演算。"
                              placement="top"
                            >
                              <el-icon class="h-4 w-4 text-slate-300 hover:text-slate-500 cursor-help">
                                <Info />
                              </el-icon>
                            </el-tooltip>
                          </div>
                          <div class="px-6 py-4 flex items-center justify-center bg-white">
                            <div class="text-4xl font-black text-slate-900 tracking-tighter tabular-nums drop-shadow-sm">
                              {{ ind.finalScore }}
                            </div>
                            <div class="ml-4 flex flex-col items-center">
                              <div :class="['w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-sm border border-white/50', (ind.finalScore !== null && typeof ind.finalScore === 'number') ? getScoreGrade(ind.finalScore).class : '']">
                                {{ (ind.finalScore !== null && typeof ind.finalScore === 'number') ? getScoreGrade(ind.finalScore).label : '-' }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="space-y-3">
                          <div class="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 shadow-inner">
                            <div class="flex items-center justify-between mb-3">
                              <span class="text-[10px] font-black text-indigo-800 uppercase tracking-widest">请录入主管评价分 (0-100)</span>
                              <span class="text-[10px] font-medium text-indigo-400">手动调节项</span>
                            </div>
                            <div class="flex items-center gap-3">
                              <Input 
                                v-model="qualitativeScores[ind.id]" 
                                type="number"
                                placeholder="0" 
                                class="h-10 text-center font-black text-lg bg-white border-white focus:border-indigo-400 focus:ring-indigo-100 rounded-xl shadow-sm transition-all text-indigo-900"
                                :disabled="props.isLocked"
                              />
                              <div class="w-10 h-10 bg-indigo-600 flex items-center justify-center rounded-xl shrink-0 shadow-sm shadow-indigo-200">
                                <ArrowRight class="h-4 w-4 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>

                  <!-- Bottom: Qualitative Remarks -->
                  <div class="mt-3 pt-3 border-t border-slate-50">
                    <div class="flex items-center gap-2 mb-2">
                      <el-icon class="text-slate-400">
                        <MessageSquare />
                      </el-icon>
                      <span class="text-xs font-bold text-slate-700">主管评语 / 考评理由</span>
                      <span
                        v-if="ind.nature === '定性评分'"
                        class="text-red-500 font-bold ml-1"
                      >* 必填</span>
                    </div>
                    <el-input 
                      v-model="qualitativeComments[ind.id]"
                      type="textarea" 
                      placeholder="请输入在该考核周期内该项指标的具体表现分析、优点与待提升点..."
                      rows="2"
                      class="custom-textarea"
                      :disabled="props.isLocked"
                    />
                  </div>
                </div>
              </el-card>
            </div>
          </div>

          <!-- Bottom Footer Logic -->
          <div class="px-8 py-5 border-t border-slate-100 bg-white shrink-0 flex items-center justify-end">
            <div class="flex items-center gap-4">
              <el-button
                link
                class="text-slate-500 font-bold"
                @click="selectedEmpId = ''"
              >
                取消打分项
              </el-button>
              <el-button
                type="primary"
                size="large"
                class="custom-submit-button"
                :disabled="props.isLocked"
              >
                确认并封存本条打分项
                <el-icon class="ml-2">
                  <ChevronRight />
                </el-icon>
              </el-button>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="flex-1 flex flex-col items-center justify-center text-slate-300">
            <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <el-icon
                :size="48"
                class="opacity-20"
              >
                <User />
              </el-icon>
            </div>
            <h4 class="text-xl font-bold text-slate-400">
              请在左侧列表中选择需要评价的员工
            </h4>
            <p class="text-sm mt-3 opacity-60">
              点击成员卡片即可进入对应的沉浸式打分面板
            </p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 20px;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.custom-search-input :deep(.el-input__wrapper) {
  border-radius: 0.75rem;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  height: 44px;
}

.custom-indicator-card :deep(.el-card__body) {
  padding: 0;
}

.custom-score-input :deep(.el-input__wrapper) {
  border-radius: 0.75rem;
  background-color: white;
  border: none;
  box-shadow: none !important;
}

.custom-score-input :deep(.el-input__inner) {
  text-align: center;
  font-weight: 900;
  font-size: 1.125rem;
  color: #312e81;
}

.custom-textarea :deep(.el-textarea__inner) {
  border-radius: 1rem;
  background-color: #f8fafc;
  border-color: #f1f5f9;
  font-size: 0.75rem;
  line-height: 1.6;
}
.custom-textarea :deep(.el-textarea__inner:focus) {
  background-color: white;
  border-color: #e2e8f0;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
}

.custom-submit-button {
  border-radius: 0.75rem;
  font-weight: 900;
  padding-left: 3rem;
  padding-right: 3rem;
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.2);
}
</style>
