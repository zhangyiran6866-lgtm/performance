<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
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
  Notebook,
} from '@element-plus/icons-vue';
import { getUserByDept } from '@/api/system/dept/dept';
import { getDepartmentUserTarget, saveDepartmentUserTarget, getDepartmentUserTargetProgress, type PerformanceUserIndicatorRespVO, type PerformanceCycleRespVO } from '@/api/deptWorkbench';
import { confirmDepartmentUserTarget } from '@/api/deptWorkbench';

import { getDictLabel } from '@/utils/dict';
import { ElMessage, ElMessageBox } from 'element-plus';

const emit = defineEmits(['back', 'update-cycle-info']);

// Define Props
interface Props {
  isLocked?: boolean
  deptId?: string | number
  cycleId?: string | number
}
const props = withDefaults(defineProps<Props>(), {
  isLocked: false,
  deptId: '',
  cycleId: '',
});

// State & Data
const searchQuery = ref('');
const selectedEmpId = ref('');
const targets = ref<Record<string, string>>({});
const employees = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const publishing = ref(false);
const cycleProgress = ref<PerformanceCycleRespVO | null>(null);

const fetchCycleProgress = async () => {
  if (!props.cycleId || !props.deptId) return;
  try {
    const res: any = await getDepartmentUserTargetProgress({
      cycleId: Number(props.cycleId),
      deptId: Number(props.deptId)
    });
    if (res.code === 0) {
      cycleProgress.value = res.data;
      // 同时给父组件发送一份，用于同步顶部卡片
      emit('update-cycle-info', res.data);
    }
  } catch (error) {
    console.error('Fetch cycle progress failed:', error);
  }
};

const fetchEmployees = async () => {
  if (!props.deptId) return;
  try {
    loading.value = true;
    // 只有当设定目标点进去时才传递cycleId
    const queryParams: any = { deptIds: [props.deptId] };
    if (props.cycleId) {
      queryParams.cycleId = Number(props.cycleId);
    }
    
    const res: any = await getUserByDept(queryParams);
    if (res.code === 0) {
      employees.value = (res.data || []).map((user: any) => ({
        id: String(user.id),
        name: user.nickname || user.userName || '未知',
        position: user.position || '待定',
        role: user.deptName || '员工', // 保留作为兜底
        avatar: (user.nickname || user.userName || '未知').substring(0, 1),
        // 优先使用 temporaryStatus，0-3 的数字状态
        status: user.temporaryStatus !== undefined ? user.temporaryStatus : (user.performanceStatus || 0),
      }));
      
      // 如果有员工且当前未选中，默认选中第一个
      if (employees.value.length > 0 && !selectedEmpId.value) {
        selectedEmpId.value = employees.value[0].id;
      }
    }
  } catch (error) {
    console.error('Fetch employees failed:', error);
  } finally {
    loading.value = false;
  }
};

const indicatorData = ref<PerformanceUserIndicatorRespVO | null>(null);
const indicatorLoading = ref(false);

const fetchUserTarget = async () => {
  if (!props.cycleId || !selectedEmpId.value) return;
  try {
    indicatorLoading.value = true;
    const res: any = await getDepartmentUserTarget({
      cycleId: Number(props.cycleId),
      userId: Number(selectedEmpId.value),
    });
    if (res.code === 0) {
      indicatorData.value = res.data;
      // Initialize targets Map
      if (res.data?.items) {
        res.data.items.forEach((item: any) => {
          if (item.targetValue !== undefined && item.targetValue !== null) {
            targets.value[String(item.id)] = String(item.targetValue);
          }
        });
      }
    }
  } catch (error) {
    console.error('Fetch user target failed:', error);
  } finally {
    indicatorLoading.value = false;
  }
};

// 暂存指标目标
const handleSaveTarget = async () => {
    if (!selectedEmpId.value || !indicatorData.value?.items) return;
    
    try {
        saving.value = true;
        
        const updateData = indicatorData.value.items.map(item => ({
            id: item.id!,
            indicatorId: item.indicatorId!,
            targetValue: targets.value[String(item.id)],
            templateId: item.templateId!,
            userId: Number(selectedEmpId.value),
            cycleId: Number(props.cycleId),
            weight: item.weight,
            userName: item.userName,
            indicatorName: item.indicatorName
        }));
        
        await saveDepartmentUserTarget(updateData);
        ElMessage.success('目标暂存成功');
        await fetchUserTarget();
        await fetchEmployees(); // 刷新员工列表以更新状态图标
    } catch (error) {
        console.error('Save target failed:', error);
        ElMessage.error('目标暂存失败，请重试');
    } finally {
        saving.value = false;
    }
}

// 下发给员工确认
const handlePublishTarget = async () => {
    if (!selectedEmpId.value || !indicatorData.value?.items) return;
    
    // 检查是否有未填写的指标
    const hasEmpty = indicatorData.value.items.some(item => !targets.value[String(item.id)]);
    if (hasEmpty) {
        ElMessage.warning('请先完善所有指标的目标基数再下发');
        return;
    }

    try {
        // 第一轮确认
        await ElMessageBox.confirm(
            `确定要下发【${selectedEmp.value?.name}】的考核目标吗？下发后将由员工进行签署确认。`,
            '确认下发',
            {
                confirmButtonText: '确定下发',
                cancelButtonText: '取消',
                type: 'info',
            }
        );

        // 第二轮确认 (二次弹框)
        await ElMessageBox.confirm(
          `考评目标一旦下发，该员工的指标基数将暂时锁定。如需再次修改，需联系管理员或执行撤回操作。是否确认下发？`,
          '操作预警',
          {
            confirmButtonText: '确认并下发',
            cancelButtonText: '返回检查',
            type: 'warning',
            dangerouslyUseHTMLString: true,
          }
        );

        publishing.value = true;
        
        // 1. 先保存最新的目标数值（确保最新的修改被保存）
        const updateData = indicatorData.value.items.map(item => ({
            id: item.id!,
            indicatorId: item.indicatorId!,
            targetValue: targets.value[String(item.id)],
            templateId: item.templateId!,
            userId: Number(selectedEmpId.value),
            cycleId: Number(props.cycleId),
            weight: item.weight,
            userName: item.userName,
            indicatorName: item.indicatorName
        }));
        
        await saveDepartmentUserTarget(updateData);

        // 2. 调用真正的下发确认接口
        await confirmDepartmentUserTarget({
            userId: Number(selectedEmpId.value),
            cycleId: Number(props.cycleId)
        });

        ElMessage.success('考核目标下发成功');
        
        // 刷新数据
        await fetchUserTarget();
        await fetchEmployees();
        await fetchCycleProgress(); // 刷新进度
    } catch (error) {
        if (error !== 'cancel') {
            console.error('Publish target failed:', error);
            ElMessage.error('目标下发失败，请刷新页面重试');
        }
    } finally {
        publishing.value = false;
    }
}

onMounted(() => {
  fetchEmployees();
  fetchCycleProgress();
});

watch(() => props.deptId, () => {
  fetchEmployees();
  fetchCycleProgress();
});

watch(() => props.cycleId, () => {
  fetchCycleProgress();
});

watch(() => selectedEmpId.value, () => {
  fetchUserTarget();
});

type EmployeeStatus = 'pending_set' | 'pending_confirm' | 'confirmed' | 'disputed'

const isPendingSet = (s: any) => s === 'pending_set' || s === 0 || s === 1;
const isPendingConfirm = (s: any) => s === 'pending_confirm' || s === 2;
const isConfirmed = (s: any) => s === 'confirmed' || s === 3;

const getStatusUI = (statusInput: any) => {
  // 统一转为数字进行判断，如果是字符串枚举则保持不变
  const status = (statusInput !== null && statusInput !== undefined && !isNaN(Number(statusInput))) 
    ? Number(statusInput) 
    : statusInput;

  if (typeof status === 'number') {
    const label = getDictLabel('user_performance_temporary', status);
    
    // 映射颜色和图标
    // 0: 待设定 -> info/slate
    // 1: 已暂存 -> warning/amber
    // 2: 已下发 -> primary/blue
    // 3: 已确认 -> success/emerald
    let type = 'info';
    let icon: any = CircleDashed;
    let iconColor = '#cbd5e1'; // slate-300

    if (status === 1) {
      type = 'warning';
      icon = FileSignature;
      iconColor = '#f59e0b'; // amber-500
    } else if (status === 2) {
      type = 'primary';
      icon = Send;
      iconColor = '#3b82f6'; // blue-500
    } else if (status === 3) {
      type = 'success';
      icon = CheckCircle2;
      iconColor = '#10b981'; // emerald-500
    }

    return { 
      icon, 
      iconColor, 
      badgeText: label || '未知状态', 
      type 
    };
  }

  // 处理字符串枚举状态 (兜底或旧逻辑)
  switch (status) {
  case 'pending_set':
    return {
      icon: CircleDashed,
      iconColor: '#cbd5e1',
      badgeText: '待设定目标',
      type: 'info',
    };
  case 'pending_confirm':
    return {
      icon: FileSignature,
      iconColor: '#f59e0b',
      badgeText: '待员工签署',
      type: 'warning',
    };
  case 'confirmed':
    return {
      icon: CheckCircle2,
      iconColor: '#10b981',
      badgeText: '已签署确认',
      type: 'success',
    };
  case 'disputed':
    return {
      icon: AlertCircle,
      iconColor: '#ef4444',
      badgeText: '有异议',
      type: 'danger',
    };
  default:
    return { icon: null, iconColor: '', badgeText: '', type: 'info' };
  }
};

const selectedEmp = computed(() => employees.value.find((e) => e.id === selectedEmpId.value));

const currentStatus = computed(() => {
  if (indicatorData.value?.temporaryStatus !== undefined) {
    return indicatorData.value.temporaryStatus;
  }
  return selectedEmp.value?.status;
});

const stats = computed(() => {
  // 优先使用接口返回的进度数据
  if (cycleProgress.value) {
    return {
      total: cycleProgress.value.totalCount || 0,
      pendingSet: cycleProgress.value.toSetCount || 0,
      pendingConfirm: cycleProgress.value.toConfirmCount || 0,
      confirmed: cycleProgress.value.signedCount || 0,
    };
  }
  // 兜底使用当前加载的员工列表计算
  const totalCount = employees.value.length;
  // 0,1/pending_set (待设定), 2/pending_confirm (待签署), 3/confirmed (已确认)

  return {
    total: totalCount || 0,
    pendingSet: employees.value.filter((e) => isPendingSet(e.status)).length,
    pendingConfirm: employees.value.filter((e) => isPendingConfirm(e.status)).length,
    confirmed: employees.value.filter((e) => isConfirmed(e.status)).length,
  };
});

const filteredEmployees = computed(() =>
  employees.value.filter((e) => e.name.includes(searchQuery.value)),
);


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
        <div v-loading="loading" class="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
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
                  :color="getStatusUI(emp.status).iconColor"
                >
                  <component :is="getStatusUI(emp.status).icon" />
                </el-icon>
              </div>
              <div class="text-xs text-slate-500 truncate mt-0.5">
                {{ emp.position }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Bottom Statistics Bar (Fixed) -->
        <div class="bg-slate-100/50 border-t border-slate-100 p-4 shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
          <div class="flex items-center justify-between mb-3 px-1">
            <span class="text-[12px] font-black text-slate-400 uppercase tracking-widest">团队目标设定概览</span>
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
              <div class="text-lg font-black text-slate-400 leading-none">
                {{ stats.pendingSet }}
              </div>
              <div class="text-[12px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter">
                待设定
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
            class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0"
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
                    :type="getStatusUI(currentStatus as EmployeeStatus).type as any"
                    class="custom-tag"
                  >
                    {{ typeof currentStatus === 'number' ? getDictLabel('user_performance_temporary', currentStatus) : getStatusUI(currentStatus as EmployeeStatus).badgeText }}
                  </el-tag>
                </div>
                <p class="text-sm text-slate-500 mt-1 truncate">
                  岗位角色: {{ indicatorData?.position || selectedEmp.role }} · 匹配模板: {{ indicatorData?.templateName || '暂未匹配模板' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <el-button
                v-if="isPendingSet(currentStatus) && !props.isLocked"
                :disabled="saving || publishing"
                :loading="saving"
                @click="handleSaveTarget"
              >
                <el-icon class="mr-2">
                  <Save />
                </el-icon>
                暂存修改
              </el-button>
              <el-button
                type="primary"
                :disabled="!isPendingSet(currentStatus) || props.isLocked || saving || publishing"
                :loading="publishing"
                @click="handlePublishTarget"
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
              v-if="!isPendingSet(currentStatus) && !props.isLocked"
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
                    (isPendingConfirm(currentStatus)) ? '待签署' : '已签署'
                  }}</b>状态，目标不允许修改。
                </p>
              </div>
            </div>

            <div class="space-y-4" v-loading="indicatorLoading">
              <div
                v-for="(ind, index) in indicatorData?.items || []"
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
                      {{ ind.indicatorName }}
                    </h5>
                    <el-tag
                      size="small"
                      effect="light"
                      type="primary"
                      class="border-none bg-indigo-50 text-indigo-600 ml-2"
                    >
                    {{  ind.ruleName }}
                    </el-tag>
                  </div>
                  <div class="text-sm font-semibold text-slate-700">
                    权重: {{ ind.weight }}%
                  </div>
                </div>

                <!-- Middle config -->
                <div class="px-5 py-3 flex flex-col md:flex-row gap-6 items-center">
                  <!-- Left: properties -->
                  <div class="flex-1 w-full space-y-4">
                    <div v-if="ind.indicatorRuleDescription" class="text-[13px] text-slate-400 leading-relaxed mb-4">
                      <span class="text-slate-600 font-bold">指标描述：</span>{{ ind.indicatorRuleDescription }}
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div class="text-slate-400 text-xs mb-1">
                        数据采集方式
                      </div>
                      <div
                        class="font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 inline-block"
                      >
                        {{ ind.dataAggregation === 'system' ? '系统接口预置' : '员工手动填报' }}
                      </div>
                    </div>
                    <div>
                      <div class="text-slate-400 text-xs mb-1">
                        考核指标项
                      </div>
                      <div
                        class="font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 inline-block"
                      >
                        {{ getDictLabel(ind.dataAggregation === 'system' ? 'system_performance_filling_method' : 'complete_system_performance_filling_method', ind.dataAggregationValue) || '-' }}
                      </div>
                    </div>
                  </div>
                </div>

                  <el-icon class="h-5 w-5 text-slate-300 hidden md:block shrink-0">
                    <ArrowRight />
                  </el-icon>

                  <!-- Right: Target input component -->
                  <div
                    class="w-full md:w-[320px] shrink-0 bg-blue-50/50 rounded-xl border border-blue-100 px-4 py-2"
                  >
                    <div class="mb-2 flex items-center justify-between">
                      <span class="text-xs font-bold text-blue-800">🎯 设定本期完成目标：</span>
                    </div>
                    <el-input
                      class="custom-indicator-input"
                      placeholder="请输入需达成的具体目标"
                      v-model="targets[String(ind.id)]"
                      :disabled="!isPendingSet(currentStatus) || props.isLocked"
                    />
                  </div>
                </div>
              </div>

              <!-- Empty State for items -->
              <div v-if="!indicatorLoading && (!indicatorData?.items || indicatorData.items.length === 0)" class="text-center py-20 text-slate-400">
                <el-icon class="h-12 w-12 mb-4 opacity-20"><Notebook /></el-icon>
                <p>该员工暂未被匹配考核指标项</p>
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
  height: 44px;
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
