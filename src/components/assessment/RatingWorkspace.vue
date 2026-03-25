<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  Search,
  Promotion as Send,
  CircleCheck as CheckCircle2,
  Loading as CircleDashed,
  Warning as AlertCircle,
  Edit as FileSignature,
  Operation as Calculator,
  FolderChecked as Save,
  User,
  ChatDotRound as MessageSquare,
  TrendCharts as TrendingUp,
  InfoFilled as Info,
  ArrowLeft,
  Notebook,
  Close,
  Calendar,
} from '@element-plus/icons-vue';
import { getUserByDept } from '@/api/system/dept/dept';
import { getEmployeeEvaluation, saveEmployeeEvaluation, submitEmployeeEvaluation, submitEmployeeEvaluationApproval, getDeptTeamRatingProgress, type EmployeeEvaluationRespVO, type EmployeeEvaluationSaveReqVO } from '@/api/deptWorkScore';
import { getDailyReportList, type PerformanceDailyReportItemDetailRespVO } from '@/api/daily';
import { ElMessage, ElMessageBox } from 'element-plus';

const emit = defineEmits(['back']);

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
const employees = ref<any[]>([]);
const loading = ref(false);
const ratingProgress = ref<any>(null);

const fetchRatingProgress = async () => {
  if (!props.cycleId || !props.deptId) return;
  try {
    const res: any = await getDeptTeamRatingProgress({
      cycleId: Number(props.cycleId),
      deptId: Number(props.deptId)
    });
    if (res.code === 0) {
      ratingProgress.value = res.data;
    }
  } catch (error) {
    console.error('Fetch rating progress failed:', error);
  }
};

const fetchEmployees = async () => {
  if (!props.deptId) return;
  try {
    if (!props.cycleId) return;
    loading.value = true;
    const queryParams: any = { 
        deptIds: [props.deptId],
        cycleId: Number(props.cycleId)
    };
    const res: any = await getUserByDept(queryParams);
    if (res.code === 0) {
      employees.value = (res.data || []).map((user: any) => {
        // 映射接口状态字符串到内部数值状态
        // complete -> 2 (已打分), staged -> 1 (已暂存), to_be_opened -> 0 (待打分)
        let status = 0;
        if (user.ratingStatus === 'complete') {
          status = 2;
        } else if (user.ratingStatus === 'staged') {
          status = 1;
        } else if (user.ratingStatus === 'to_be_opened') {
          status = 0;
        } else if (user.ratingStatus !== undefined && user.ratingStatus !== null) {
          status = Number(user.ratingStatus);
        }

        return {
          id: String(user.id),
          name: user.nickname || user.userName || '未知',
          position: user.position || '待定',
          role: user.deptName || '员工',
          avatar: (user.nickname || user.userName || '未知').substring(0, 1),
          status: status,
        };
      });
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

onMounted(() => {
  fetchEmployees();
  fetchRatingProgress();
});

watch(() => props.deptId, () => {
  fetchEmployees();
  fetchRatingProgress();
});

watch(() => props.cycleId, () => {
  fetchRatingProgress();
});

// Indicator State
const evaluationIndicators = ref<EmployeeEvaluationRespVO[]>([]);
const evaluationLoading = ref(false);
const lastSavedData = ref('');

const isDataChanged = computed(() => {
  if (evaluationIndicators.value.length === 0) return false;
  const currentData = JSON.stringify(evaluationIndicators.value.map(ind => ({
    id: ind.id,
    finalScore: ind.finalScore,
    comment: ind.comment
  })));
  return currentData !== lastSavedData.value;
});

const evaluationTotalScore = computed(() => {
  if (evaluationIndicators.value.length === 0) return 0;
  
  const leaderItem = evaluationIndicators.value.find(ind => ind.indicatorName === '领导综合评价');
  const otherItems = evaluationIndicators.value.filter(ind => ind.indicatorName !== '领导综合评价');
  
  // 1. 计算普通指标的加权总分 (按其内部权重比例折算为百分制)
  let othersScore = 0;
  if (otherItems.length > 0) {
    const totalOtherWeight = otherItems.reduce((sum, ind) => sum + (Number(ind.weight) || 0), 0);
    const weightedSum = otherItems.reduce((sum, ind) => {
      return sum + (Number(ind.finalScore) || 0) * (Number(ind.weight) || 0);
    }, 0);
    othersScore = totalOtherWeight > 0 ? (weightedSum / totalOtherWeight) : 0;
  }
  
  // 2. 领导综合评价得分
  const leaderScore = Number(leaderItem?.finalScore) || 0;
  
  // 3. 最终组合计算：普通指标占 80%，领导评分直接求和 (0-20)
  const total = (othersScore * 0.8) + leaderScore;
  return Number(total.toFixed(2));
});

const fetchEvaluation = async () => {
  if (!selectedEmpId.value || !props.cycleId) return;
  try {
    evaluationLoading.value = true;
    const res = await getEmployeeEvaluation({
      cycleId: Number(props.cycleId),
      userId: Number(selectedEmpId.value)
    });
    if (res.code === 0) {
      evaluationIndicators.value = (res.data || []).map((ind: EmployeeEvaluationRespVO) => {
        // Initialize finalScore with initialScore if null/undefined
        if (ind.finalScore === null || ind.finalScore === undefined) {
          ind.finalScore = ind.initialScore ?? 0;
        }
        return ind;
      });
      // 记录初始数据指纹
      lastSavedData.value = JSON.stringify(evaluationIndicators.value.map(ind => ({
        id: ind.id,
        finalScore: ind.finalScore,
        comment: ind.comment
      })));
    }
  } catch (error) {
    console.error('Fetch evaluation failed:', error);
  } finally {
    evaluationLoading.value = false;
  }
};

const activeIndicatorTab = ref('all'); // all, quantitative, qualitative


const selectedEmp = computed(() => employees.value.find((e) => e.id === selectedEmpId.value));

const filteredEmployees = computed(() =>
  employees.value.filter((e) => e.name.includes(searchQuery.value)),
);

watch([selectedEmpId, () => props.cycleId], () => {
  fetchEvaluation();
}, { immediate: true });

const filteredIndicators = computed(() => {
  if (activeIndicatorTab.value === 'quantitative') {
    return evaluationIndicators.value.filter((i: EmployeeEvaluationRespVO) => i.indicatorType?.includes('定量') || (i as any).nature?.includes('定量'));
  } else if (activeIndicatorTab.value === 'qualitative') {
    return evaluationIndicators.value.filter((i: EmployeeEvaluationRespVO) => i.indicatorType?.includes('定性') || (i as any).nature?.includes('定性'));
  }
  return evaluationIndicators.value;
});

const submitting = ref(false);

const validateRatingData = () => {
  for (const ind of evaluationIndicators.value) {
    if (ind.indicatorName === '领导综合评价') continue;
    
    // 性质为定性，或者主管手动修改了得分
    const isQualitative = ind.indicatorType?.includes('定性') || (ind as any).nature?.includes('定性');
    const isScoreAdjusted = Number(ind.finalScore) !== Number(ind.initialScore ?? 0);
    
    if ((isQualitative || isScoreAdjusted) && !ind.comment?.trim()) {
      ElMessage.warning(`指标“${ind.indicatorName}”为主管调整项或定性项，请填写主管评语`);
      return false;
    }
  }
  return true;
};

const handleSaveRating = async () => {
  if (!selectedEmpId.value) return;

  // 校验必填项
  if (!validateRatingData()) return;

  try {
    submitting.value = true;
    
    // Prepare data for saving
    const saveList: EmployeeEvaluationSaveReqVO[] = evaluationIndicators.value.map(ind => ({
      ...ind,
      userId: Number(selectedEmpId.value),
      deptId: Number(props.deptId),
      totalScore: evaluationTotalScore.value,
      status: '1', // 1: 已暂存
    }));

    const res = await saveEmployeeEvaluation(saveList);
    if (res.code === 0) {
      ElMessage.success('绩效评分暂存成功');
      // Update employee status in the list
      const emp = employees.value.find(e => e.id === selectedEmpId.value);
      if (emp) {
        emp.status = 1;
      }
      fetchEvaluation();
      fetchRatingProgress();
    }
  } catch (error) {
    console.error('Save rating failed:', error);
    ElMessage.error('绩效评分暂存失败');
  } finally {
    submitting.value = false;
  }
};

const handleSubmitRating = async () => {
  if (!selectedEmpId.value) return;

  // 校验必填项
  if (!validateRatingData()) return;

  try {
    // 检查是否有主管调整项 (排除领导综合评价)
    const adjustedItems = evaluationIndicators.value.filter(ind => 
      ind.indicatorName !== '领导综合评价' && 
      Number(ind.finalScore) !== Number(ind.initialScore ?? 0)
    );
    const isAdjusted = adjustedItems.length > 0;

    const confirmMessage = isAdjusted 
      ? '当前分值经由主管进行了调整，提交打分需走企微审批，确认提交么？'
      : '确定要提交该员工的绩效考评打分吗？提交后将无法修改，并进入下一审核流程。';

    await ElMessageBox.confirm(
      confirmMessage,
      isAdjusted ? '调整提交确认' : '确认提交',
      {
        confirmButtonText: '确定提交',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    submitting.value = true;
    
    // Prepare data for submission
    const submitList: EmployeeEvaluationSaveReqVO[] = evaluationIndicators.value.map(ind => ({
      ...ind,
      userId: Number(selectedEmpId.value),
      deptId: Number(props.deptId),
      totalScore: evaluationTotalScore.value
    }));

    // 根据是否有调整决定调用哪个接口
    const apiMethod = isAdjusted ? submitEmployeeEvaluationApproval : submitEmployeeEvaluation;
    const res = await apiMethod(submitList);

    if (res.code === 0) {
      ElMessage.success(isAdjusted ? '审批申请已提交' : '绩效评分提交成功');
      const emp = employees.value.find(e => e.id === selectedEmpId.value);
      if (emp) {
        emp.status = 2;
      }
      fetchEvaluation();
      fetchRatingProgress();
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('Submit rating failed:', error);
      ElMessage.error('绩效评分提交失败');
    }
  } finally {
    submitting.value = false;
  }
};

const getStatusUI = (statusInput: any) => {
  // 统一转为数字进行判断，如果是字符串则保持原样
  const status = (statusInput !== null && statusInput !== undefined && !isNaN(Number(statusInput))) 
    ? Number(statusInput) 
    : statusInput;
  
  // 默认样式（待打分状态）
  let type = 'info';
  let icon: any = CircleDashed;
  let iconColor = '#cbd5e1'; // slate-300

  if (status === 1 || status === 'staged') {
    type = 'warning';
    icon = FileSignature;
    iconColor = '#f59e0b'; // amber-500
  } else if (status === 2 || status === 'complete') {
    type = 'success';
    icon = CheckCircle2;
    iconColor = '#10b981'; // emerald-500
  } else if (status === 0 || status === 'to_be_opened') {
    type = 'info';
    icon = CircleDashed;
    iconColor = '#cbd5e1'; // slate-300
  }

  return { icon, iconColor, type };
};

const stats = computed(() => {
  // 優先使用接口返回的進度數據
  if (ratingProgress.value) {
    return {
      total: ratingProgress.value.deptCount || 0,
      rated: ratingProgress.value.gradedCount || 0,
      pending: ratingProgress.value.ungradedCount || 0,
      rate: ratingProgress.value.probability !== undefined 
        ? (Number(ratingProgress.value.probability) > 1 
            ? Math.round(Number(ratingProgress.value.probability)) 
            : Math.round(Number(ratingProgress.value.probability) * 100))
        : 0,
    };
  }
  
  const total = employees.value.length;
  const rated = employees.value.filter((e) => e.status === 2).length;
  const pending = employees.value.filter((e) => e.status === 0).length;
  const rate = total > 0 ? Math.round((rated / total) * 100) : 0;
  return { total, rated, pending, rate };
});

// 格式化数字增加千分位
const formatNumber = (val: any) => {
  if (val === null || val === undefined || val === '') return '---';
  // 如果是纯数值（包含带小数点的字符串），则进行千分位格式化
  const num = Number(val);
  if (isNaN(num)) return val;
  
  // 使用 toLocaleString，支持自动识别小数位
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 10, // 尽可能保留原有精度
  });
};

// 格式化实际完成量：任务节点类显示 已完成/未完成
const formatCompletedValue = (ind: any) => {
  const isTaskNode = ind.scoringRule?.includes('任务节点');
  if (isTaskNode) {
    if (ind.completedValue === 0 || ind.completedValue === '0') return '未完成';
    if (ind.completedValue === 1 || ind.completedValue === '1') return '已完成';
  }
  return formatNumber(ind.completedValue);
};

// 抽屉控制及日报数据抓取
const dailyReportDrawerVisible = ref(false);
const currentIndicatorForDailyReport = ref<any>(null);
const dailyRecords = ref<PerformanceDailyReportItemDetailRespVO[]>([]);
const dailyRecordsLoading = ref(false);

const parseDateDay = (dateStr: any) => {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '--' : d.getDate().toString().padStart(2, '0');
};

const parseDateWeekday = (dateStr: any) => {
  if (!dateStr) return '--';
  const weekdaysArray = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '--' : weekdaysArray[d.getDay()];
};

const parseDateMonth = (dateStr: any) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : `${d.getFullYear()}年${d.getMonth() + 1}月`;
};

const fetchDailyRecords = async () => {
  if (!currentIndicatorForDailyReport.value || !selectedEmp.value) return;
  
  try {
    dailyRecordsLoading.value = true;
    const res: any = await getDailyReportList({
      userId: Number(selectedEmp.value.id),
      cycleId: Number(props.cycleId),
      indicatorId: Number(currentIndicatorForDailyReport.value.indicatorId)
    });
    if (res.code === 0) {
      dailyRecords.value = res.data || [];
    }
  } catch (error) {
    console.error('Fetch daily records failed:', error);
  } finally {
    dailyRecordsLoading.value = false;
  }
};

const openDailyReportDrawer = async (ind: any) => {
  currentIndicatorForDailyReport.value = ind;
  dailyReportDrawerVisible.value = true;
  await fetchDailyRecords();
};

// 是否为领导直接打分类型
const isDirectScoringType = (ind: any) => {
  return ind.scoringRule?.includes('领导直接打分');
};

</script>

<template>
  <div class="h-full flex flex-col bg-slate-50/10 overflow-hidden relative">


    <!-- Workspace Grid -->
    <div class="flex-1 py-4 grid grid-cols-12 gap-6 overflow-hidden">
      <!-- Left: Navigation Sidebar -->
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
        <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
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
                'shadow-sm border border-slate-200 shrink-0',
                selectedEmpId === emp.id ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-slate-100 text-slate-600 font-medium',
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
                <el-icon :color="getStatusUI(emp.status).iconColor">
                  <component :is="getStatusUI(emp.status).icon" />
                </el-icon>
              </div>
              <div class="text-xs text-slate-500 truncate mt-0.5">
                {{ emp.position }}
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Statistics Bar -->
        <div class="bg-slate-100/50 border-t border-slate-100 p-4 shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
          <div class="flex items-center justify-between mb-3 px-1">
            <span class="text-[12px] font-black text-slate-400 uppercase tracking-widest">团队打分进度概览</span>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <div class="text-center group/stat">
              <div class="text-xl font-black text-slate-700 leading-none tabular-nums transition-transform group-hover/stat:scale-110">
                {{ stats.total }}
              </div>
              <div class="text-[11px] text-slate-400 font-bold mt-2 uppercase tracking-tight">
                合计
              </div>
            </div>
            <div class="text-center group/stat">
              <div class="text-xl font-black text-orange-500 leading-none tabular-nums transition-transform group-hover/stat:scale-110">
                {{ stats.pending }}
              </div>
              <div class="text-[11px] text-slate-400 font-bold mt-2 uppercase tracking-tight">
                待打分
              </div>
            </div>
            <div class="text-center group/stat">
              <div class="text-xl font-black text-emerald-600 leading-none tabular-nums transition-transform group-hover/stat:scale-110">
                {{ stats.rated }}
              </div>
              <div class="text-[11px] text-slate-400 font-bold mt-2 uppercase tracking-tight">
                已打分
              </div>
            </div>
            <div class="text-center group/stat">
              <div class="text-xl font-black text-indigo-600 leading-none tabular-nums transition-transform group-hover/stat:scale-110">
                {{ stats.rate }}%
              </div>
              <div class="text-[11px] text-slate-400 font-bold mt-2 uppercase tracking-tight">
                完成率
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Main Form Body -->
      <div class="col-span-9 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
        <template v-if="selectedEmp">
          <!-- Detail Header -->
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div class="flex items-center gap-4 min-w-0 w-full sm:w-auto">
              <div class="relative">
                <el-avatar 
                  :size="56" 
                  class="shadow-sm border border-slate-200 bg-indigo-100 text-indigo-700 font-bold"
                >
                  {{ selectedEmp.avatar }}
                </el-avatar>
                <div 
                  v-if="selectedEmp.status === 2"
                  class="absolute -right-1 -bottom-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm flex items-center justify-center"
                >
                  <el-icon :size="8">
                    <CheckCircle2 />
                  </el-icon>
                </div>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-3 mb-1">
                  <h4 class="text-xl font-bold text-slate-900 truncate">
                    {{ selectedEmp.name }}
                  </h4>
                  <div class="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-xl border border-orange-100 shadow-sm transition-all hover:bg-white hover:border-orange-300">
                    <span class="text-[11px] font-black text-orange-400 uppercase tracking-[0.1em] whitespace-nowrap">合计分值</span>
                    <div class="w-px h-3 bg-orange-200/80 mx-1"></div>
                    <span class="text-xl font-black text-orange-600 tabular-nums leading-none tracking-tight">{{ evaluationTotalScore }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-slate-500 truncate">
                    岗位角色: {{ evaluationIndicators[0]?.position || selectedEmp.position }} · 匹配模板: {{ evaluationIndicators[0]?.templateName || '---' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <!-- <el-button
                :disabled="props.isLocked"
                @click=""
              >
                <el-icon class="mr-1.5">
                  <History />
                </el-icon>
                历史评价
              </el-button> -->
              <el-button
                v-if="selectedEmp.status !== 2"
                type="primary"
                :disabled="props.isLocked"
                :loading="submitting"
                @click="handleSaveRating"
              >
                <el-icon class="mr-1.5">
                  <Save />
                </el-icon>
                暂存打分
              </el-button>
              <el-tooltip
                content="请先暂存当前打分内容，确保数据同步后再提交"
                placement="top"
                :disabled="!isDataChanged && selectedEmp.status === 1"
              >
                <span>
                  <el-button
                    v-if="selectedEmp.status !== 2"
                    type="warning"
                    :disabled="props.isLocked || isDataChanged || selectedEmp.status !== 1"
                    :loading="submitting"
                    @click="handleSubmitRating"
                  >
                    <el-icon class="mr-1.5">
                      <Send />
                    </el-icon>
                    提交打分
                  </el-button>
                </span>
              </el-tooltip>
            </div>
          </div>

          <!-- Forms Container - Expanding content -->
          <div 
            v-loading="evaluationLoading"
            class="flex-1 px-8 py-6 space-y-6 bg-slate-50/20 overflow-y-auto custom-scrollbar"
          >
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
            <div class="grid gap-4">
              <el-card 
                v-for="(ind, index) in filteredIndicators" 
                :key="ind.id"
                shadow="hover"
                :class="[
                  'border-slate-200 !rounded-2xl custom-indicator-card transition-all duration-500',
                  ind.indicatorName === '领导综合评价' ? 'leader-score-card !border-indigo-500/20 shadow-indigo-100/50' : ''
                ]"
              >
                <!-- Standard Indicator Layout -->
                <div v-if="ind.indicatorName !== '领导综合评价'" class="p-4 md:p-5">
                  <div class="flex flex-col md:flex-row gap-6 items-stretch">
                    <!-- Left: Basic Info -->
                    <div class="flex-1 space-y-3">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <span class="h-6 w-6 bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center rounded-lg border border-slate-200">{{ index + 1 }}</span>
                          <h5 class="text-xl font-black text-slate-800 tracking-tight">
                            {{ ind.indicatorName }}
                          </h5>
                          <el-tag
                            size="small"
                            effect="light"
                            type="primary"
                            class="font-bold border-none bg-indigo-50 text-indigo-600"
                          >
                            {{ ind.indicatorType }}
                          </el-tag>
                        </div>
                      </div>
                      <div v-if="ind.indicatorRuleDescription" class="text-[13px] text-slate-400 leading-relaxed mb-4">
                        <span class="text-slate-600 font-bold">指标描述：</span>{{ ind.indicatorRuleDescription }}
                      </div>
                      <div class="flex flex-wrap gap-4">
                        <div class="flex items-center gap-2 text-xs font-medium text-slate-400">
                          <el-icon><Calculator /></el-icon>
                          计分规则: <span class="text-slate-600">{{ ind.scoringRule }}</span>
                        </div>
                        <div class="w-px h-3 bg-slate-200" />
                        <div class="flex items-center gap-2 text-xs font-medium text-slate-400">
                          <el-icon><TrendingUp /></el-icon>
                          权重占比: <span class="text-slate-600 font-bold">{{ ind.weight }}%</span>
                        </div>
                      </div>

                      <div :class="['grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4', isDirectScoringType(ind) ? 'lg:grid-cols-3' : 'lg:grid-cols-5']">
                        <!-- Target Value -->
                        <div :class="[isDirectScoringType(ind) ? 'lg:col-span-1' : 'lg:col-span-2', 'bg-gradient-to-br from-blue-50/60 to-white px-4 py-4 rounded-2xl border border-blue-100/50 shadow-sm transition-all hover:shadow-md hover:border-blue-200/60 group/box overflow-hidden']">
                          <div class="text-[12px] text-blue-500 font-black uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                             <div class="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"></div>
                             目标参考值
                          </div>
                          <div class="text-2xl font-black text-blue-700 tracking-tighter leading-tight tabular-nums break-all">
                            {{ formatNumber(ind.targetValue) }}
                          </div>
                        </div>

                        <div :class="[isDirectScoringType(ind) ? 'lg:col-span-1' : 'lg:col-span-2', 'bg-gradient-to-br from-indigo-50/60 to-white px-4 py-4 rounded-2xl border border-indigo-100/50 shadow-sm transition-all hover:shadow-md hover:border-indigo-200/60 group/box overflow-hidden flex flex-col']">
                          <div class="text-[12px] text-indigo-500 font-black uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                             <div class="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]"></div>
                             实际完成量
                          </div>
                          <div class="flex-1 flex flex-col justify-end mt-1">
                            <div v-if="!isDirectScoringType(ind)" class="text-2xl font-black text-indigo-700 tracking-tighter leading-tight tabular-nums break-all">
                              {{ formatCompletedValue(ind) }}
                            </div>
                            <div v-else>
                              <el-button
                                type="primary"
                                plain
                                round
                                class="!w-full !justify-center !bg-indigo-50/50 !border-indigo-100 !text-indigo-600 !h-10 !shadow-none hover:!bg-indigo-50/50 hover:!border-indigo-100 !transition-none"
                                @click="openDailyReportDrawer(ind)"
                              >
                                <div class="flex items-center gap-2">
                                  <el-icon :size="16"><Notebook /></el-icon>
                                  <span class="text-sm font-bold">查阅本周期日报</span>
                                </div>
                              </el-button>
                            </div>
                          </div>
                        </div>

                        <!-- System Score / Direct Scoring -->
                        <div class="lg:col-span-1 bg-gradient-to-br from-emerald-50/60 to-white px-4 py-4 rounded-2xl border border-emerald-100/50 shadow-sm transition-all hover:shadow-md hover:border-emerald-200/60 group/box overflow-hidden relative">
                          <div class="text-[12px] text-emerald-600 font-black uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                             <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                             {{ isDirectScoringType(ind) ? '领导打分' : '系统结算' }}
                          </div>
                          <div v-if="isDirectScoringType(ind)" class="mt-2 flex items-center">
                             <el-input-number 
                                v-model="ind.initialScore"
                                :precision="2"
                                :step="1"
                                :min="0"
                                :max="100"
                                class="final-score-input-large !w-full"
                                @change="(val: any) => ind.finalScore = val"
                                :disabled="props.isLocked || selectedEmp.status === 2"
                              />
                          </div>
                          <div v-else class="text-2xl font-black text-emerald-700 tracking-tighter leading-tight tabular-nums break-all">
                            {{ formatNumber(ind.initialScore) }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Right: Input Control -->
                    <div v-if="!isDirectScoringType(ind)" class="w-full md:w-[180px] lg:w-[240px] shrink-0 flex flex-col">
                      <template v-if="ind.indicatorType?.includes('定量') || (ind as any).nature?.includes('定量')">
                        <div class="bg-indigo-50/30 rounded-3xl border-2 border-indigo-100/50 overflow-hidden relative group/input h-full flex flex-col shadow-sm hover:shadow-md transition-all duration-300">
                          <div class="px-5 py-3 border-b border-indigo-100/50 flex items-center justify-between bg-indigo-50/50">
                            <span class="text-sm font-black text-indigo-900 uppercase tracking-widest">主管调整得分</span>
                            <el-tooltip
                              effect="dark"
                              content="决策修正：主管对系统初算分拥有最高裁定权。"
                              placement="top"
                            >
                              <el-icon class="h-4 w-4 text-indigo-400 hover:text-indigo-600 cursor-help">
                                <Info />
                              </el-icon>
                            </el-tooltip>
                          </div>
                          <div class="px-5 py-8 flex-1 flex flex-col items-center justify-center bg-white gap-6">
                            <div class="flex items-center justify-center w-full">
                              <el-input-number 
                                v-model="ind.finalScore"
                                :precision="2"
                                :step="1"
                                :min="0"
                                :max="100"
                                class="final-score-input-large !w-full"
                                :disabled="props.isLocked || selectedEmp.status === 2"
                              />
                            </div>
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="h-full">
                          <div class="bg-indigo-50/50 rounded-3xl border border-indigo-100 h-full flex flex-col group/input overflow-hidden">
                            <div class="px-5 py-4 flex items-center justify-between border-b border-indigo-100/50">
                              <span class="text-sm font-black text-indigo-900 uppercase tracking-widest">主管调整得分</span>
                            </div>
                            <div class="flex-1 p-5 flex flex-col items-center justify-center bg-white/50 gap-4">
                              <el-input-number 
                                v-model="ind.finalScore" 
                                :precision="2"
                                :step="1"
                                :min="0"
                                :max="100"
                                class="final-score-input-large !w-full"
                                :disabled="props.isLocked || selectedEmp.status === 2"
                              />
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
                        v-if="(ind.indicatorType?.includes('定性') || (ind as any).nature?.includes('定性')) || (Number(ind.finalScore) !== Number(ind.initialScore ?? 0))"
                        class="text-red-500 font-bold ml-1"
                      >* 必填</span>
                    </div>
                    <el-input 
                      v-model="ind.comment"
                      type="textarea" 
                      placeholder="请输入在该考核周期内该项指标的具体表现分析、优点与待提升点..."
                      rows="2"
                      class="custom-textarea"
                      :disabled="props.isLocked || selectedEmp.status === 2"
                    />
                  </div>
                </div>

                <!-- Custom Leader Score Layout -->
                <div v-else-if="ind.indicatorName === '领导综合评价'" class="p-4 md:p-5 bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border border-indigo-100 rounded-2xl flex flex-col md:flex-row gap-6 items-center shadow-sm">
                  <div class="flex-1 flex flex-col gap-3">
                    <div class="flex items-center gap-2.5">
                      <el-icon class="text-purple-500" :size="20"><MessageSquare /></el-icon>
                      <span class="text-[16px] font-black text-indigo-900 uppercase tracking-wider">领导综合评价</span>
                    </div>
                    
                    <el-input 
                      v-model="ind.comment"
                      type="textarea" 
                      placeholder="请输入对该名员工本阶段的综合沉淀评价及未来改进指导建议..."
                      rows="2"
                      class="leader-textarea-refined"
                      :disabled="props.isLocked || selectedEmp.status === 2"
                    />
                  </div>
                  <div class="flex items-center gap-4 border-r border-indigo-100/50 pr-8 shrink-0">
                    <div>
                      <h5 class="text-[16px] font-black text-indigo-900 tracking-wider mb-3">领导综合打分</h5>
                      <el-input-number 
                        v-model="ind.finalScore" 
                        :precision="2"
                        :step="1"
                        :min="0"
                        :max="20"
                        class="leader-score-input-refined !w-[220px]"
                        :disabled="props.isLocked || selectedEmp.status === 2"
                      />
                    </div>
                  </div>
                </div>
              </el-card>

              <!-- Empty State for indicators -->
              <div v-if="!evaluationLoading && filteredIndicators.length === 0" class="text-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <el-icon :size="48" class="mb-4 opacity-20"><Notebook /></el-icon>
                <h4 class="text-xl font-bold text-slate-400">暂无考核指标数据</h4>
                <p class="text-sm mt-2 opacity-60">请联系管理员核实考评模板配置</p>
              </div>
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
    <el-drawer
      v-model="dailyReportDrawerVisible"
      size="45%"
      :with-header="false"
      class="daily-report-drawer"
      modal-class="daily-report-drawer-container"
      :append-to-body="false"
    >
      <div v-loading="dailyRecordsLoading" class="h-full flex flex-col bg-slate-50/30 overflow-hidden">
        <!-- Drawer Header: 固定展示 -->
        <div class="px-8 py-8 bg-white border-b border-slate-100 shrink-0 relative z-10">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-start gap-4">
              <div class="h-12 w-12 bg-indigo-50/60 rounded-xl flex items-center justify-center border border-indigo-100/50 flex-shrink-0">
                <el-icon :size="24" class="text-indigo-500"><Notebook /></el-icon>
              </div>
              <div class="min-w-0 flex flex-col justify-center">
                <h3 class="text-xl font-black text-slate-800 tracking-tight leading-none mb-1.5">日报记录查阅</h3>
                <p class="text-slate-500 font-medium text-xs tracking-wide">
                  {{ selectedEmp?.name }} <span class="mx-2 text-slate-300">·</span> {{ currentIndicatorForDailyReport?.indicatorName }}
                </p>
              </div>
            </div>
            <el-button link @click="dailyReportDrawerVisible = false" class="!text-slate-400 hover:!text-indigo-600 transition-colors">
              <el-icon :size="24"><Close /></el-icon>
            </el-button>
          </div>
          <div class="mt-6 flex items-center gap-6">
            <div class="flex items-center gap-2 text-sm font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <el-icon><Calendar /></el-icon>
              <span>{{ dailyRecords.length > 0 ? parseDateMonth(dailyRecords[0].reportDate) : '本周期' }}</span>
            </div>
            <div class="h-4 w-px bg-slate-200" />
            <div class="text-sm font-black text-indigo-600">
              共 {{ dailyRecords.filter(r => r.workSummary).length }} 条有效记录
            </div>
          </div>
        </div>

        <!-- Drawer Body: 高性能滚动容器 -->
        <div class="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-slate-50/50">
          <div 
            v-for="record in dailyRecords" 
            :key="record.id"
            :class="[
              'bg-white rounded-2xl border transition-all duration-300 flex items-stretch overflow-hidden',
              record.workSummary 
                ? 'border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300' 
                : 'border-slate-100 opacity-60 grayscale-[0.5] border-dashed'
            ]"
          >
            <!-- Date Axis -->
            <div :class="[
              'w-20 border-r flex flex-col items-center justify-center shrink-0 transition-colors',
              record.workSummary ? 'bg-indigo-50/30 border-indigo-50 text-indigo-600' : 'bg-slate-50/50 border-slate-50 text-slate-400'
            ]">
              <div class="text-2xl font-black tabular-nums tracking-tighter">{{ parseDateDay(record.reportDate) }}</div>
              <div class="text-[11px] font-bold uppercase mt-0.5 opacity-70">{{ parseDateWeekday(record.reportDate) }}</div>
            </div>
            <!-- Main Content -->
            <div class="flex-1 p-6 flex flex-col justify-center min-h-[90px]">
              <template v-if="record.workSummary">
                <p class="text-[15px] text-slate-600 leading-relaxed font-medium">
                  {{ record.workSummary }}
                </p>
              </template>
              <template v-else>
                <div class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  <p class="text-sm text-slate-300 italic font-medium">当时未填写日报记录</p>
                </div>
              </template>
            </div>
          </div>
          
          <!-- Bottom Padding to avoid clip -->
          <div class="h-8" />
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
/* 针对局部抽屉的定位深度补丁，确保其在 Absolute 容器中逻辑自洽 */
:deep(.daily-report-drawer-container.el-overlay) {
  position: fixed !important;
  top: 56px !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  height: calc(100vh - 56px) !important;
  width: 100vw !important;
  z-index: 1000 !important;
}

:deep(.daily-report-drawer-container .el-drawer) {
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  height: 100% !important;
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.08) !important;
}

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

.final-score-input-large :deep(.el-input__wrapper) {
  border-radius: 1.25rem;
  background-color: #f8fafc;
  box-shadow: none !important;
  border: 2px solid #f1f5f9;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0.5rem;
}

.final-score-input-large :deep(.el-input__wrapper.is-focus) {
  background-color: white;
  border-color: #6366f1;
  box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.1) !important;
}

.final-score-input-large :deep(.el-input__inner) {
  font-weight: 900;
  font-size: 1.75rem;
  height: 52px;
  color: #1e1b4b;
  font-family: 'Outfit', 'Inter', system-ui, sans-serif;
  letter-spacing: -0.02em;
}

.final-score-input-large :deep(.el-input-number__decrease),
.final-score-input-large :deep(.el-input-number__increase) {
  width: 40px;
  background-color: white;
  border: 1px solid #f1f5f9;
  border-radius: 0.75rem;
  margin: 4px;
  color: #64748b;
  transition: all 0.2s;
}

.final-score-input-large :deep(.el-input-number__decrease:hover),
.final-score-input-large :deep(.el-input-number__increase:hover) {
  background-color: #6366f1;
  color: white;
  border-color: #6366f1;
}

.leader-score-input-refined :deep(.el-input__inner) {
  font-weight: 800;
  font-size: 2rem;
  height: 56px;
  color: #312e81;
  font-family: 'Outfit', 'Inter', system-ui, sans-serif;
}

.leader-score-input-refined :deep(.el-input__wrapper) {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
  border-color: #e0e7ff !important;
  border-radius: 0.75rem !important;
  padding: 4px !important;
}

.leader-score-input-refined :deep(.el-input-number__decrease),
.leader-score-input-refined :deep(.el-input-number__increase) {
  width: 44px;
  background-color: #f5f3ff;
  border-radius: 0.5rem;
  margin: 2px;
  color: #6366f1;
}

.leader-textarea-refined :deep(.el-textarea__inner) {
  border-radius: 1rem;
  background-color: white;
  border-color: #e0e7ff;
  font-size: 0.875rem;
  line-height: 1.6;
  padding: 0.75rem 1rem;
}

.leader-textarea-refined :deep(.el-textarea__inner:focus) {
  border-color: #6366f1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
</style>
