<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Search,
  Promotion as Send,
  CircleCheck as CheckCircle2,
  Loading as CircleDashed,
  Warning as AlertCircle,
  Edit as FileSignature,
  Right as ArrowRight,
  FolderChecked as Save,
  TrendCharts as TrendingUp,
  ArrowLeft,
} from '@element-plus/icons-vue';

const emit = defineEmits(['back']);

// Define Props
interface Props {
  isLocked?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  isLocked: false,
});

// Mock Data
const employees = [
  { id: 'emp-001', name: '刘小红', role: 'KA经理', avatar: 'XH', status: 'pending_set' },
  { id: 'emp-002', name: '胡凌波', role: 'KA经理', avatar: 'LB', status: 'pending_confirm' },
  { id: 'emp-003', name: '穆宏洋', role: 'KA经理', avatar: 'HY', status: 'confirmed' },
  { id: 'emp-004', name: '邱臻', role: 'KA经理', avatar: 'QZ', status: 'disputed' },
  { id: 'emp-005', name: '郑甜甜', role: 'KA经理', avatar: 'TT', status: 'pending_set' },
];

const mockIndicators = [
  {
    id: 'ind-001',
    name: '门店实际销售总额',
    nature: '越高越好',
    weight: 60,
    aggregation: '月度累加',
    source: '系统接口直连',
    targetBase: '',
  },
  {
    id: 'ind-002',
    name: '连带率考核',
    nature: '越高越好',
    weight: 20,
    aggregation: '按下达值平均',
    source: '人工填报',
    targetBase: '',
  },
  {
    id: 'ind-003',
    name: '重点客诉事件处罚',
    nature: '越低越好',
    weight: 20,
    aggregation: '单次触发',
    source: '管理扣分',
    targetBase: '0',
  },
];

type EmployeeStatus = 'pending_set' | 'pending_confirm' | 'confirmed' | 'disputed'

const searchQuery = ref('');
const selectedEmpId = ref('emp-001');
const targets = ref<Record<string, string>>({});

const getStatusUI = (status: EmployeeStatus) => {
  switch (status) {
  case 'pending_set':
    return {
      icon: CircleDashed,
      iconClass: 'text-slate-300',
      badgeText: '待设定目标',
      type: 'info',
    };
  case 'pending_confirm':
    return {
      icon: FileSignature,
      iconClass: 'text-amber-500',
      badgeText: '待员工签署',
      type: 'warning',
    };
  case 'confirmed':
    return {
      icon: CheckCircle2,
      iconClass: 'text-emerald-500',
      badgeText: '已签署确认',
      type: 'success',
    };
  case 'disputed':
    return {
      icon: AlertCircle,
      iconClass: 'text-red-500',
      badgeText: '有异议',
      type: 'danger',
    };
  default:
    return { icon: null, iconClass: '', badgeText: '', type: 'info' };
  }
};

const selectedEmp = computed(() => employees.find((e) => e.id === selectedEmpId.value));

const stats = computed(() => ({
  total: employees.length,
  pendingSet: employees.filter((e) => e.status === 'pending_set').length,
  pendingConfirm: employees.filter((e) => e.status === 'pending_confirm').length,
  confirmed: employees.filter((e) => e.status === 'confirmed').length,
}));

const filteredEmployees = computed(() =>
  employees.filter((e) => e.name.includes(searchQuery.value)),
);

const handleTargetChange = (indId: string, value: string) => {
  targets.value[indId] = value;
};
</script>

<template>
  <div class="h-full flex flex-col bg-slate-50/30 overflow-hidden">


    <!-- Workspace Area -->
    <div class="flex-1 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
      <!-- Left Side: Employee List -->
      <div
        class="col-span-1 lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-w-0 h-full"
      >
        <div class="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <el-button
            link
            class="!text-slate-500 hover:!text-indigo-600 transition-colors flex items-center gap-1.5 p-0 h-auto"
            @click="emit('back')"
          >
            <el-icon :size="14"><ArrowLeft /></el-icon>
            <span class="text-sm font-medium">返回列表</span>
          </el-button>
          <el-input
            v-model="searchQuery"
            placeholder="搜索下属姓名..."
            class="custom-search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
          <div
            v-for="emp in filteredEmployees"
            :key="emp.id"
            :class="[
              'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border',
              selectedEmpId === emp.id
                ? 'bg-blue-50 border-blue-200 shadow-sm'
                : 'border-transparent hover:bg-slate-50',
            ]"
            @click="selectedEmpId = emp.id"
          >
            <el-avatar 
              :size="40" 
              :class="[
                'shadow-sm border border-slate-200',
                selectedEmpId === emp.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600',
              ]"
            >
              {{ emp.avatar }}
            </el-avatar>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span
                  :class="[
                    'font-semibold truncate',
                    selectedEmpId === emp.id ? 'text-blue-900' : 'text-slate-700',
                  ]"
                >
                  {{ emp.name }}
                </span>
                <el-icon
                  :class="getStatusUI(emp.status as EmployeeStatus).iconClass"
                >
                  <component :is="getStatusUI(emp.status as EmployeeStatus).icon" />
                </el-icon>
              </div>
              <div class="text-xs text-slate-500 truncate mt-0.5">
                {{ emp.role }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Bottom Statistics Bar (Fixed) -->
        <div class="bg-slate-100/50 border-t border-slate-100 p-4 shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
          <div class="flex items-center justify-between mb-3 px-1">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">团队考核进度概览</span>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <div class="text-center">
              <div class="text-lg font-black text-slate-700 leading-none">
                {{ stats.total }}
              </div>
              <div class="text-[12px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter">
                合计
              </div>
            </div>
            <div class="text-center">
              <div class="text-lg font-black text-amber-500 leading-none">
                {{ stats.pendingConfirm }}
              </div>
              <div class="text-[12px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter">
                待签署
              </div>
            </div>
            <div class="text-center">
              <div class="text-lg font-black text-slate-400 leading-none">
                {{ stats.pendingSet }}
              </div>
              <div class="text-[12px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter">
                待设定
              </div>
            </div>
            <div class="text-center">
              <div class="text-lg font-black text-emerald-500 leading-none">
                {{ stats.confirmed }}
              </div>
              <div class="text-[12px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter">
                已确认
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side: Target Setting Form -->
      <div
        class="col-span-1 lg:col-span-9 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-w-0 h-full"
      >
        <template v-if="selectedEmp">
          <!-- Employee Detail Header -->
          <div
            class="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0"
          >
            <div class="flex items-center gap-4 min-w-0 w-full sm:w-auto">
              <el-avatar 
                :size="56" 
                class="shadow-sm border border-slate-200 bg-slate-100 text-slate-600 font-bold text-lg"
              >
                {{ selectedEmp.avatar }}
              </el-avatar>
              <div class="min-w-0">
                <div class="flex items-center gap-3">
                  <h4 class="text-xl font-bold text-slate-900 truncate">
                    {{ selectedEmp.name }}
                  </h4>
                  <el-tag
                    effect="light"
                    :type="getStatusUI(selectedEmp.status as EmployeeStatus).type as any"
                    class="custom-tag"
                  >
                    {{ getStatusUI(selectedEmp.status as EmployeeStatus).badgeText }}
                  </el-tag>
                </div>
                <p class="text-sm text-slate-500 mt-1 truncate">
                  岗位角色: {{ selectedEmp.role }} · 匹配模板: 门店导购基础考核模板
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <el-button
                :disabled="props.isLocked"
                @click=""
              >
                <el-icon class="mr-2">
                  <Save />
                </el-icon>
                暂存修改
              </el-button>
              <el-button
                type="primary"
                :disabled="selectedEmp.status !== 'pending_set' || props.isLocked"
              >
                <el-icon class="mr-2">
                  <Send />
                </el-icon>
                下发让其确认
              </el-button>
            </div>
          </div>

          <!-- Indicators Form Area -->
          <div
            class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 custom-scrollbar"
          >
            <div
              v-if="props.isLocked"
              class="mb-6"
            >
              <div
                class="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl inline-flex items-start gap-3 text-sm shadow-sm max-w-full"
              >
                <el-icon class="text-blue-500 shrink-0 mt-0.5">
                  <AlertCircle />
                </el-icon>
                <p class="flex-1 leading-relaxed">
                  当前不处于<b>指标设定阶段</b>。系统已自动锁定输入，您仅可浏览本期历史设定的目标基数。
                </p>
              </div>
            </div>

            <div
              v-if="selectedEmp.status !== 'pending_set' && !props.isLocked"
              class="mb-6"
            >
              <div
                class="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl inline-flex items-start gap-3 text-sm shadow-sm max-w-full"
              >
                <el-icon class="text-amber-500 shrink-0 mt-0.5">
                  <AlertCircle />
                </el-icon>
                <p class="flex-1 leading-relaxed">
                  当前员工考核目标已下发。员工处于<b>{{
                    selectedEmp.status === 'pending_confirm' ? '待签署' : '已签署'
                  }}</b>状态时，目标不建议随意修改。如确需调整，需先撤回重新流转。
                </p>
              </div>
            </div>

            <div class="space-y-4">
              <div
                v-for="(ind, index) in mockIndicators"
                :key="ind.id"
                class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-slate-300 transition-colors"
              >
                <!-- Top bar -->
                <div
                  class="bg-slate-50/80 px-5 py-3 border-b border-slate-100 flex items-center justify-between"
                >
                  <div class="flex items-center gap-2">
                    <div
                      class="bg-blue-100 text-blue-600 w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                    >
                      {{ index + 1 }}
                    </div>
                    <h5 class="font-bold text-slate-800">
                      {{ ind.name }}
                    </h5>
                    <el-tag
                      size="small"
                      effect="light"
                      type="info"
                      class="border-none bg-slate-100 text-slate-500 ml-2"
                    >
                      {{ ind.nature }}
                    </el-tag>
                  </div>
                  <div class="text-sm font-semibold text-slate-700">
                    权重: {{ ind.weight }}%
                  </div>
                </div>

                <!-- Middle config -->
                <div class="p-5 flex flex-col md:flex-row gap-6 items-center">
                  <!-- Left: properties -->
                  <div class="flex-1 grid grid-cols-2 gap-4 text-sm w-full">
                    <div>
                      <div class="text-slate-400 text-xs mb-1">
                        数据采集方式
                      </div>
                      <div
                        class="font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 inline-block"
                      >
                        {{ ind.source }}
                      </div>
                    </div>
                    <div>
                      <div class="text-slate-400 text-xs mb-1">
                        考核汇聚手段
                      </div>
                      <div
                        class="font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 inline-block"
                      >
                        {{ ind.aggregation }}
                      </div>
                    </div>
                  </div>

                  <el-icon class="h-5 w-5 text-slate-300 hidden md:block shrink-0">
                    <ArrowRight />
                  </el-icon>

                  <!-- Right: Target input component -->
                  <div
                    class="w-full md:w-[320px] shrink-0 bg-blue-50/50 rounded-xl border border-blue-100 p-4"
                  >
                    <div class="mb-2 flex items-center justify-between">
                      <span class="text-xs font-bold text-blue-800">🎯 设定本期目标基数值：</span>
                    </div>
                    <el-input
                      class="custom-indicator-input"
                      placeholder="请输入需达成的具体数值..."
                      :model-value="targets[ind.id] !== undefined ? targets[ind.id] : ind.targetBase"
                      :disabled="selectedEmp.status !== 'pending_set' || props.isLocked"
                      @input="(val: string) => handleTargetChange(ind.id, val)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div
          v-else
          class="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/10"
        >
          <el-icon class="h-16 w-16 mb-4 opacity-20">
            <TrendingUp />
          </el-icon>
          <p>请在左侧选择需要设定目标的员工</p>
        </div>
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
  background-color: #cbd5e1;
  border-radius: 20px;
}

.custom-tag {
  border: none;
  font-weight: 600;
}

.custom-search-input :deep(.el-input__wrapper) {
  border-radius: 0.75rem;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
}

.custom-indicator-input :deep(.el-input__wrapper) {
  height: 44px;
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 0 0 1px #bfdbfe inset;
}

.custom-indicator-input :deep(.el-input__inner) {
  text-align: center;
  font-weight: bold;
  font-size: 1.125rem;
  color: #1e3a8a;
}
</style>
