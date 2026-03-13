<!--
  @author: Zyr
  @date: 2026-03-07 17:15:00
  @description: 我的绩效列表布局紧凑化：缩小标题字体、缩减各项间距及卡片内边距。
  @lines: +10, -10
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Warning, Edit, CircleCheck, TrendCharts, ArrowLeft, Calendar, Clock, Right, Aim, Operation as Calculator, PriceTag as Award, Notebook, } from '@element-plus/icons-vue';
import { getDictOptions, getDictLabel } from '@/utils/dict';
import { getEmployeePerformance, confirmEmployeePerformance, type PerformanceUserResultRespVO } from '@/api/workbench';

// Define Props
interface Props {
  isLocked?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  isLocked: false,
});

// ========== Mock Data ==========
import { ElMessageBox, ElMessage } from 'element-plus';

// ========== State & Data ==========
const cycleList = ref<PerformanceUserResultRespVO[]>([]);
const loading = ref(false);
const total = ref(0);
const queryParams = ref({
  pageNo: 1,
  pageSize: 20,
});

const selectedCycleId = ref<number | null>(null);

// Fetch data from API
const fetchList = async () => {
  try {
    loading.value = true;
    const res: any = await getEmployeePerformance(queryParams.value as any);
    if (res.code === 0) {
      cycleList.value = res.data.list || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error('Fetch performance failed:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchList();
});

const selectedCycle = computed(() => cycleList.value.find((c) => c.cycleId === selectedCycleId.value));

const currentStatus = computed(() => {
  if (!selectedCycleId.value) return '0';
  const cycle = cycleList.value.find((c) => c.cycleId === selectedCycleId.value);
  return cycle ? String(cycle.status) : '0';
});

const handleConfirm = (cycleId: number) => {
  if (!selectedCycle.value) return;
  
  ElMessageBox.confirm(
    '您确定已完整阅读并确认签署该绩效目标吗？签署后将作为周期末计分的唯一法律基础。',
    '签署确认',
    {
      confirmButtonText: '确定签署',
      cancelButtonText: '取消',
      type: 'warning',
      draggable: true,
      roundButton: true,
    }
  )
    .then(async () => {
      try {
        loading.value = true;
        const res: any = await confirmEmployeePerformance({
          userId: selectedCycle.value!.userId,
          cycleId: cycleId
        });
        
        if (res.code === 0) {
          ElMessage({
            type: 'success',
            message: '目标签署成功',
            duration: 2000
          });
          // 刷新列表数据以更新状态
          await fetchList();
        } else {
          ElMessage.error(res.msg || '签署失败，请稍后重试');
        }
      } catch (error) {
        console.error('Confirm performance failed:', error);
        ElMessage.error('网络请求失败');
      } finally {
        loading.value = false;
      }
    })
    .catch(() => {
      // User cancelled
    });
};

// Utils
const formatDate = (date: any) => {
  if (!date) return '-';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const quantitativeResults = computed(() => {
    // Current VO doesn't distinguish nature, using all targets for now
    return selectedCycle.value?.targetRespVOList || [];
});

const qualitativeResults = computed(() => {
    return []; // Placeholder as VO doesn't detail this currently
});
</script>

<template>
  <div class="h-full flex flex-col bg-slate-50/30 overflow-hidden">
    <!-- Cycle List View -->
    <template v-if="!selectedCycle">
      <div v-loading="loading" class="flex-1 py-5 space-y-6 overflow-y-auto custom-scrollbar">
        <div class="mx-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 class="text-2xl font-black tracking-tight text-slate-900">
            我的考核目标与结果
          </h2>
          <p class="text-sm text-slate-500 mt-1">
            <span class="font-bold text-slate-600">{{ cycleList[0]?.userName || 'XXX' }} (工号: {{ cycleList[0]?.userId || '---' }})</span> · 查阅您参与的所有考核周期的目标与最终评价结果。
          </p>
        </div>

        <div class="grid gap-4">
          <el-card
            v-for="cycle in cycleList"
            :key="cycle.cycleId"
            shadow="hover"
            class="custom-card-hover border-slate-200 !rounded-3xl overflow-hidden cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500 group"
            @click="selectedCycleId = cycle.cycleId"
          >
            <div
              class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div class="flex items-center gap-4 min-w-0">
                <div
                  :class="[
                    'h-14 w-14 rounded-2xl flex flex-col items-center justify-center font-bold leading-tight shrink-0 transition-colors',
                    (cycle.stage === 'TO_BE_OPENED' || String(cycle.status) === '4') ? 'bg-slate-50 text-slate-400' :
                    String(cycle.status) === '0' ? 'bg-amber-50 text-amber-600' :
                    String(cycle.status) === '2' ? 'bg-indigo-50 text-indigo-600' :
                    String(cycle.status) === '1' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-slate-50 text-slate-400',
                  ]"
                >
                  <el-icon :size="24">
                    <Calendar />
                  </el-icon>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-3 flex-wrap">
                    <h3 class="text-lg font-black text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                      {{ cycle.cycleName || cycle.templateName }}
                    </h3>
                    <el-tag
                      v-if="cycle.stage === 'TO_BE_OPENED'"
                      type="info"
                      effect="light"
                      class="custom-tag"
                    >
                      待开启
                    </el-tag>
                    <template v-else v-for="dict in getDictOptions('user_performance_status')" :key="dict.value">
                      <el-tag
                        v-if="dict.value === String(cycle.status)"
                        :type="dict.value === '4' ? 'info' : (dict.value === '0' ? 'warning' : 'success')"
                        effect="light"
                        class="custom-tag"
                      >
                        {{ dict.label }}
                      </el-tag>
                    </template>
                  </div>
                  <p class="text-sm text-slate-500 mt-1 flex items-center gap-1 text-left">
                    <el-icon><Clock /></el-icon> {{ formatDate(cycle.startTime) }} ~ {{ formatDate(cycle.endTime) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-4 shrink-0 px-2 lg:px-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 mt-1 lg:mt-0">
                <div
                  v-if="cycle.overallScore !== null && cycle.overallScore !== undefined"
                  class="flex items-center gap-3"
                >
                  <div class="text-right text-left">
                    <div class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      综合评分
                    </div>
                    <div class="text-xl font-black text-slate-800 leading-none mt-0.5">
                      {{ cycle.overallScore }}
                    </div>
                  </div>
                  <div
                    :class="[
                      'w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg shadow-sm border border-white/50',
                      cycle.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                      cycle.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                      cycle.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700',
                    ]"
                  >
                    {{ cycle.grade || '-' }}
                  </div>
                </div>
                <div
                  v-else-if="String(cycle.status) === '0'"
                  class="text-sm font-medium text-amber-600 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100"
                >
                  <el-icon><Warning /></el-icon> 需要签署目标
                </div>
                <div class="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-all duration-300 shrink-0">
                  <el-icon class="h-5 w-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
                    <Right />
                  </el-icon>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </template>

    <!-- Cycle Detail View -->
    <template v-else>
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="px-1 py-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          <!-- Small Back Link -->
          <div class="flex items-center">
            <el-button
              link
              class="!text-slate-500 hover:!text-indigo-600 transition-colors flex items-center gap-1.5 p-0 h-auto"
              @click="selectedCycleId = null"
            >
              <el-icon :size="14"><ArrowLeft /></el-icon>
              <span class="text-sm font-medium">返回列表</span>
            </el-button>
          </div>

          <!-- Header Card -->
          <div class="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
            <div class="flex items-center gap-4 w-full md:w-auto">
              <!-- Vibrant Orange Calendar Icon Box -->
              <div class="h-12 w-12 rounded-2xl !bg-orange-50 flex flex-col items-center justify-center shrink-0 border border-orange-200/20 shadow-sm shadow-orange-100/50">
                <el-icon :size="24" class="!text-orange-500"><Calendar /></el-icon>
              </div>
              <div class="min-w-0">
                <h3 class="text-lg font-black text-slate-900 truncate tracking-tight">
                  {{ selectedCycle?.cycleName || selectedCycle?.templateName }}
                </h3>
                <p class="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <span class="font-bold text-slate-600">{{ selectedCycle?.userName || '李小明' }} (工号: {{ selectedCycle?.userId || '00192' }})</span>
                  <span class="text-slate-300">-</span>
                  <span>岗位： {{ selectedCycle?.position || '---' }}</span>
                </p>
              </div>
            </div>
            <div v-if="currentStatus === '0'" class="w-full md:w-auto">
              <el-button
                type="danger"
                class="!bg-[#f00000] !border-[#f00000] !rounded-xl !px-6 !py-5 shadow-lg shadow-red-100 hover:!bg-[#d00000] transition-all font-black"
                :disabled="props.isLocked"
                @click="handleConfirm(selectedCycle.cycleId)"
              >
                <el-icon class="mr-2"><Edit /></el-icon> 我已完整阅读，确认签署
              </el-button>
            </div>
          </div>

          <!-- Tabs Section -->
          <el-tabs class="custom-tabs-borderless animate-in fade-in duration-700 delay-150">
            <!-- Goals Tab -->
            <el-tab-pane>
              <template #label>
                <span class="flex items-center gap-2 font-bold"><el-icon><Aim /></el-icon>考核指标详情(目标)</span>
              </template>
              
              <div class="mt-2 space-y-4 pb-10">
                <!-- Status Notices -->
                <div v-if="currentStatus === '4'" class="bg-slate-50 border-l-4 border-l-slate-400 border-y border-r border-y-slate-100 border-r-slate-100 p-4 rounded-r-2xl shadow-sm flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
                  <div class="bg-slate-100 p-3 rounded-2xl shrink-0 shadow-sm text-slate-500"><el-icon :size="24"><Clock /></el-icon></div>
                  <div class="flex-1 text-left">
                    <h4 class="text-slate-900 font-black text-lg">待开启：目标尚未下发</h4>
                    <p class="text-slate-500 text-sm mt-1">当前绩效周期尚处于准备阶段，请在目标正式下发后再进行确认签署。</p>
                  </div>
                </div>

                <div v-if="currentStatus === '0'" class="bg-red-50 border-l-4 border-l-red-500 border-y border-r border-y-red-100 border-r-red-100 p-4 rounded-r-2xl shadow-sm flex items-start gap-4 animate-in slide-in-from-top-4 duration-500 active-notice">
                  <div class="bg-red-100 p-3 rounded-2xl shrink-0 shadow-sm"><el-icon :size="24" class="text-red-600"><Warning /></el-icon></div>
                  <div class="flex-1 text-left">
                    <h4 class="text-red-900 font-black text-lg">待确认：本月绩效核心目标</h4>
                    <div class="mt-3 text-red-800/80 text-sm leading-relaxed space-y-3">
                      <p>上级主管已正式下发考核基数。请核对下方各项指标权重与目标值是否属实。</p>
                      <div class="bg-white/40 p-3 rounded-lg border border-red-200/50 flex items-center gap-2 text-xs font-bold text-red-600">
                        <el-icon><Notebook /></el-icon> 提醒：确认签署后将作为周期末计分的唯一法律基础。
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="['2', '1'].includes(currentStatus) || [2, 1].includes(selectedCycle.status)" class="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-2xl shadow-sm flex items-center justify-between animate-in zoom-in-95 duration-500">
                  <div class="flex items-center gap-5">
                    <div class="bg-emerald-100 p-3 rounded-full shadow-sm"><el-icon :size="28" class="text-emerald-600"><CircleCheck /></el-icon></div>
                    <div>
                      <h4 class="text-emerald-900 font-black text-lg">已确认当前月份考核指标</h4>
                    </div>
                  </div>
                </div>

                <!-- Indicators Details -->
                <div class="space-y-4 text-left">
                  <!-- <h4 class="font-black text-indigo-600 flex items-center gap-3 pb-2 border-b-2 border-slate-100">
                    <el-icon><Calculator /></el-icon> 本期考核指标明细
                  </h4> -->
                  <div class="grid gap-4">
                    <el-card v-for="(ind, index) in selectedCycle.targetRespVOList" :key="ind.id" shadow="hover" class="!border-slate-100 !rounded-[20px] relative custom-indicator-card overflow-hidden">
                      <div :class="['absolute left-0 top-0 bottom-0 w-1.5 transition-colors', ['2', '1'].includes(currentStatus) || [2, 1].includes(selectedCycle.status) ? 'bg-emerald-400' : currentStatus === '0' ? 'bg-amber-400' : 'bg-slate-300']" />
                      <div class="px-5 py-3 flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div class="flex-1 space-y-5 w-full">
                          <div class="flex items-center gap-3">
                            <span class="w-6 h-6 rounded-full border border-slate-200 text-slate-400 text-xs flex items-center justify-center font-bold">{{ index + 1 }}</span>
                            <h5 class="text-[22px] font-black text-[#1e293b] leading-tight">{{ ind.indicatorName }}</h5>
                            <span class="px-2.5 py-0.5 bg-blue-50 text-blue-500 text-[11px] font-bold rounded-full border-blue-100/50">{{ ind.month }}</span>
                          </div>
                          <div class="flex flex-wrap gap-3">
                            <div class="flex items-center bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-100 text-[13px] shadow-sm">
                              <span class="text-slate-400 mr-2">{{ ind.dataAggregation === 'system' ? '系统接口预置' : '员工手动填报' }}</span>
                              <span class="font-bold text-slate-700">{{ getDictLabel(ind.dataAggregation === 'system' ? 'system_performance_filling_method' : 'complete_system_performance_filling_method', ind.dataAggregationValue) }}</span>
                            </div>
                          </div>
                        </div>
                        <div class="w-full md:w-[240px] shrink-0 assessment-base-box bg-[#f8faff] rounded-[24px] border border-blue-50/50 px-6 py-2 relative overflow-hidden flex flex-col  h-[110px]">
                          <div class="flex justify-between items-center relative z-10">
                            <span class="text-[12px] font-bold text-slate-400 uppercase tracking-tight">考核基数</span>
                            <div class="bg-white px-3 py-1 rounded-full shadow-sm border border-blue-100 text-[14px] font-black text-blue-600">
                              权重 {{ ind.weight }}%
                            </div>
                          </div>
                          <div class="mt-2 flex-1 text-4xl font-black text-[#1e3a8a] tracking-tight relative z-10 leading-none target-value-text">{{ ind.targetValue || '---' }}</div>
                          <!-- Mock Target Pattern Background -->
                          <!-- <div class="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
                            <el-icon :size="80" class="text-blue-900"><Aim /></el-icon>
                          </div> -->
                        </div>
                      </div>
                    </el-card>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- Results Tab -->
            <el-tab-pane>
              <template #label>
                <span class="flex items-center gap-2 font-bold"><el-icon><Aim /></el-icon>最终考核结果(闭案)</span>
              </template>
              
              <div v-if="String(selectedCycle.status) === '1' || currentStatus === '1'" class="mt-2 space-y-6 animate-in fade-in duration-700">
                <!-- Score Dashboard -->
                <div class="relative overflow-hidden group rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 p-8 text-white shadow-xl">
                  <div class="absolute inset-0 opacity-10 pointer-events-none">
                    <el-icon class="absolute -left-10 -bottom-10 text-[120px] rotate-12"><TrendCharts /></el-icon>
                    <el-icon class="absolute -right-10 -top-10 text-[120px] -rotate-12"><Award /></el-icon>
                  </div>
                  <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div class="flex items-center gap-6">
                      <div class="bg-white/10 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-white/20"><el-icon :size="48" class="text-blue-100"><Award /></el-icon></div>
                      <div class="text-left">
                        <div class="text-blue-100/70 font-black text-xs uppercase tracking-[0.2em] mb-1">综合考核得分</div>
                        <div class="text-7xl font-black tracking-tighter leading-none shadow-sm drop-shadow-md">{{ selectedCycle.overallScore }}</div>
                      </div>
                    </div>
                    <div class="grid grid-cols-3 md:flex md:items-center gap-4 lg:gap-10 w-full md:w-auto">
                      <div class="bg-black/10 backdrop-blur rounded-2xl p-4 flex-1 text-center border border-white/5">
                        <div class="text-2xl font-black">{{ quantitativeResults.length }}</div>
                        <div class="text-[10px] text-white/50 font-bold mt-1 uppercase">定量</div>
                      </div>
                      <div class="bg-black/10 backdrop-blur rounded-2xl p-4 flex-1 text-center border border-white/5">
                        <div class="text-2xl font-black">{{ qualitativeResults.length }}</div>
                        <div class="text-[10px] text-white/50 font-bold mt-1 uppercase">定性</div>
                      </div>
                      <div class="bg-white/15 backdrop-blur rounded-2xl p-4 flex-1 text-center border border-white/20 shadow-xl scale-110">
                        <div class="text-4xl font-black text-white leading-none">{{ selectedCycle.grade || '-' }}</div>
                        <div class="text-[10px] text-blue-100/70 font-bold mt-1 uppercase">等第</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Result Details -->
                <div class="space-y-5 text-left">
                  <div class="flex items-center gap-3">
                    <div class="bg-blue-100 p-2 rounded-xl"><el-icon class="text-blue-600"><Calculator /></el-icon></div>
                    <h4 class="text-xl font-black text-slate-900">系统业绩测算明细</h4>
                  </div>
                  <div class="grid gap-4">
                    <el-card v-for="(ind, index) in quantitativeResults" :key="ind.id" shadow="hover" class="border-slate-200 custom-result-card">
                      <div class="p-2">
                        <div class="flex items-center justify-between mb-6">
                          <div class="flex items-center gap-3">
                            <span class="h-7 w-7 bg-blue-50 text-blue-600 flex items-center justify-center rounded-lg text-sm font-black">{{ index + 1 }}</span>
                            <h5 class="font-black text-slate-800 text-lg">{{ ind.indicatorName }}</h5>
                          </div>
                          <div class="text-right">
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">占比权重</div>
                            <div class="text-lg font-black text-slate-700 leading-none mt-1">{{ ind.weight }}%</div>
                          </div>
                        </div>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div class="bg-slate-50/80 border border-slate-100 p-4 rounded-xl">
                            <div class="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-tighter">目标参考</div>
                            <div class="font-black text-slate-900">{{ ind.targetValue }}</div>
                          </div>
                          <div class="bg-gradient-to-br from-indigo-50 to-blue-100 border border-blue-200 p-4 rounded-xl shadow-sm scale-105 text-left">
                            <div class="text-[10px] font-black text-blue-800 mb-2 uppercase tracking-tighter">当前状态</div>
                            <div class="font-black text-indigo-700 text-lg leading-none drop-shadow-sm">{{ ind.status ? '已确认' : '处理中' }}</div>
                          </div>
                        </div>
                      </div>
                    </el-card>
                  </div>
                </div>
              </div>
              <div v-else class="flex flex-col items-center justify-center py-20 text-slate-400 animate-in zoom-in-95 duration-1000">
                <div class="relative bg-slate-50 p-10 rounded-full mb-6 shadow-inner">
                  <el-icon :size="64" class="opacity-30 animate-spin-slow"><Clock /></el-icon>
                  <el-icon :size="32" class="text-blue-400 absolute top-2 right-2 opacity-50"><Aim /></el-icon>
                </div>
                <h4 class="text-xl font-black text-slate-800 tracking-tight">绩效大盘尚未正式“结案”</h4>
                <p class="text-sm mt-3 font-medium max-w-xs text-center leading-relaxed">
                  请耐心等待周期进入<b>评分公示期</b>或<b>归档阶段</b>。届时我们将为您解密最终得分与等级。
                </p>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.animate-spin-slow {
  animation: spin 10s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.active-notice {
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(255, 255, 255, 0.4),
    rgba(255, 255, 255, 0.4) 10px,
    transparent 10px,
    transparent 20px
  );
}

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

.custom-card-hover {
  transition: all 0.3s;
}
.custom-card-hover:hover {
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.custom-tag {
  border: none;
  font-weight: 600;
}

.custom-confirm-button {
  height: 48px;
  border-radius: 0.75rem;
  font-weight: bold;
  font-size: 1rem;
  padding: 0 2rem;
  box-shadow: 0 10px 15px -3px rgba(220, 38, 38, 0.2);
}

.custom-tabs-borderless {
  background: transparent;
  border: none;
}
.custom-tabs-borderless :deep(.el-tabs__header) {
  background-color: transparent;
  margin: 0 0 4px 0;
  border-bottom: 1px solid #f1f5f9;
}
.custom-tabs-borderless :deep(.el-tabs__nav-wrap::after) {
  display: none;
}
.custom-tabs-borderless :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px;
  background-color: #6366f1;
}
.custom-tabs-borderless :deep(.el-tabs__item) {
  font-size: 1.05rem;
  font-weight: 700;
  color: #64748b;
  height: 44px;
  line-height: 44px;
  transition: all 0.3s;
  padding: 0 20px !important;
}
.custom-tabs-borderless :deep(.el-tabs__item.is-active) {
  color: #4f46e5;
}
.custom-tabs-borderless :deep(.el-tabs__item:hover) {
  color: #4f46e5;
}
.custom-tabs-borderless :deep(.el-tabs__content) {
  padding: 0;
}

.custom-indicator-card {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f1f5f9;
}
.custom-indicator-card:hover {
  border-color: #60a5fa !important;
  transform: translateY(-2px);
  box-shadow: 0 12px 20px -5px rgba(37, 99, 235, 0.08);
}
.target-value-text {
  display: inline-block;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: left center;
}
.custom-indicator-card:hover .target-value-text {
  transform: scale(1.12);
  color: #2563eb;
}
.assessment-base-box {
  transition: all 0.4s ease;
}
.custom-indicator-card:hover .assessment-base-box {
  background-color: #f0f7ff;
  border-color: #dbeafe;
}

.custom-indicator-card :deep(.el-card__body) {
  padding: 0;
}
.custom-result-card :deep(.el-card__body) {
  padding: 0;
}
</style>
