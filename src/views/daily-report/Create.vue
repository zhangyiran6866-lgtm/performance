<script setup lang="ts">
  import { ref, onMounted, watch, computed } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { ElMessage, ElLoading } from 'element-plus';
  import { useUserStore } from '@/store/modules/user';
  import {
    saveDailyReport,
    getTargetIndicators,
    getDailyReport,
    type DailyReportSaveReqVO,
    type DailyReportTargetIndicatorVO,
  } from '@/api/daily';
  import {
    FileText,
    Activity,
    ClipboardCheck,
    User,
    TrendingUp,
    Clock,
    ChevronLeft,
    Calendar,
    Save,
    Send,
    MapPin,
    ClipboardList,
    History,
  } from 'lucide-vue-next';

  defineOptions({ name: 'DailyReportCreate' });

  interface IndicatorOption {
    label: string;
    value: string;
  }

  interface ProcessedIndicator extends DailyReportTargetIndicatorVO {
    name: string;
    type: string;
    options?: IndicatorOption[];
    value: any;
    icon: any;
    iconBg: string;
    iconColor: string;
    autoFetch?: boolean;
    placeholder?: string;
    dataAggregation?: string;
  }

  const router = useRouter();
  const route = useRoute();
  const activeTab = ref('indicators');
  const isSubmitting = ref(false);
  const isLoadingIndicators = ref(false);
  const cycleId = ref<number | null>(null);
  const dailyTemplateId = ref<number | null>(null);
  const isReadOnly = ref(false);

  const userStore = useUserStore();
  const userInfo = computed(() => userStore.user);

  // 从路由参数中获取要查看/填报的用户 ID，如果没有则默认为当前登录用户
  const targetUserId = computed(() => {
    return route.query.userId ? Number(route.query.userId) : userInfo.value.id;
  });

  // Indicators data
  const indicators = ref<ProcessedIndicator[]>([]);

  // 实际提交给后端的日期格式
  const submitDate = ref(new Date().toISOString().split('T')[0]);
  const workSummary = ref('');

  const inferIndicatorType = (ind: any) => {
    let inferredType = (ind.type as string) || 'text_score';
    let inferredOptions = ind.options as IndicatorOption[] | undefined;
    const ruleId = ind.indicatorRuleId || ind.ruleId;
    const ruleName = (ind.indicatorRuleName as string) || (ind.indicatorName as string) || '';

    if (ruleId === 14 || ruleName.includes('定性分级')) {
      inferredType = 'select';
      inferredOptions = [
        { label: '优秀', value: '1' },
        { label: '良好', value: '2' },
        { label: '普通', value: '3' },
        { label: '不合格', value: '4' },
      ];
    } else if (ruleId === 13 || ruleName.includes('任务节点/完成即满分 逾期0分')) {
      inferredType = 'switch';
    } else if ([8, 9, 10, 11].includes(ruleId)
      || ruleName.includes('阶梯制') || ruleName.includes('预算控制')) {
      inferredType = 'number_step';
    } else if (ruleId === 12 || ruleName.includes('领导直接打分')) {
      inferredType = 'text_score';
    }

    const iconMap: Record<string, any> = {
      switch: ClipboardCheck,
      text_score: ClipboardList,
      select: User,
      number_step: Activity,
      number: Activity,
    };

    const bgMap: Record<string, string> = {
      switch: 'bg-emerald-50',
      text_score: 'bg-cyan-50',
      select: 'bg-cyan-50',
      number_step: 'bg-rose-50',
      number: 'bg-rose-50',
    };

    const colorMap: Record<string, string> = {
      switch: 'text-emerald-500',
      text_score: 'rgb(71 193 241)',
      select: 'text-cyan-500',
      number_step: 'text-rose-500',
      number: 'text-rose-500',
    };

    const defaultValue = inferredType === 'switch' ? 0 : (inferredType === 'select' || inferredType === 'text_score' ? '' : 0);

    let val = ind.indicatorValue || ind.value || defaultValue;
    if (inferredType === 'switch') {
      // Ensure it's 1 or 0
      val = (val === '1' || val === 1 || val === true) ? 1 : 0;
    }

    return {
      name: ruleName,
      type: inferredType,
      options: inferredOptions,
      value: val,
      icon: iconMap[inferredType] || Activity,
      iconBg: bgMap[inferredType] || 'bg-slate-50',
      iconColor: colorMap[inferredType] || 'text-slate-400',
    };
  };

  const fetchIndicators = async () => {
    try {
      isLoadingIndicators.value = true;
      const res = await getTargetIndicators({
        reportDate: submitDate.value.substring(0, 10),
        userId: targetUserId.value
      });
      const data = res.data?.indicators || res.indicators || [];
      console.log('targetData===', res);
      // 获取什么传什么，不进行非空判断（除了校验是否存在字段）
      // 获取什么传什么，直接赋值
      cycleId.value = res.data?.cycleId;
      dailyTemplateId.value = res.data?.dailyTemplateId;

      if (Array.isArray(data)) {
        indicators.value = data.map((ind: any) => ({
          ...ind,
          ...inferIndicatorType(ind),
        }));
      }
    } catch (err) {
      console.error('Failed to fetch indicators:', err);
      // ElMessage.error('获取指标列表失败');
    } finally {
      isLoadingIndicators.value = false;
    }
  };

  const fetchReportDetail = async (id: string) => {
    try {
      isLoadingIndicators.value = true;
      const [reportRes, targetRes] = await Promise.all([
        getDailyReport(Number(id)),
        getTargetIndicators({
          reportDate: submitDate.value.substring(0, 10),
          userId: targetUserId.value
        }),
      ]);

      const data = reportRes.data || reportRes;
      const targetData = targetRes.data?.indicators || targetRes.indicators || [];
      console.log('targetData', data);
      if (data) {
        workSummary.value = data.workSummary || '';
        // 获取什么传什么
        cycleId.value = data.cycleId;
        dailyTemplateId.value = data.dailyTemplateId;

        // 如果状态为已提交 (1)，则设为只读模式
        if (data.status === 1) {
          isReadOnly.value = true;
          // ElMessage.info('该日报已提交');
        }

        if (Array.isArray(data.items)) {
          indicators.value = data.items.map((ind: any) => {
            const targetInd = targetData.find((t: any) => t.indicatorId === ind.indicatorId);
            return {
              ...targetInd,
              ...ind,
              ...inferIndicatorType({ ...targetInd, ...ind }),
            };
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch report detail:', err);
      ElMessage.error('获取日报详情失败');
    } finally {
      isLoadingIndicators.value = false;
    }
  };

  watch(submitDate, (newDate) => {
    if (newDate && !route.query.id) {
      fetchIndicators();
    }
  });

  onMounted(() => {
    if (route.query.date) {
      submitDate.value = String(route.query.date);
    }

    if (route.query.id) {
      fetchReportDetail(String(route.query.id));
    } else {
      fetchIndicators();
    }
  });

  const fieldRecords = ref([
    {
      startTime: '09:00',
      endTime: '10:30',
      location: '上海华艺进出口有限公司',
      address: '徐汇区虹桥路1号',
      description: '沟通Q2季度采购计划，确认初步意向单备份。',
    },
    {
      startTime: '11:00',
      endTime: '12:00',
      location: '宜家家居 (徐汇店)',
      address: '徐汇区漕溪路126号',
      description: '日常巡店，检查展位布置及物料库存。',
    },
  ]);

  const submitReport = async (status: number) => {
    if (status === 1) {
      if (!workSummary.value || workSummary.value.trim() === '') {
        return ElMessage.warning('请填写今日工作总结与后续计划');
      }

      const incompleteIndicator = indicators.value.find((ind) => {
        if (ind.type === 'switch') return false;
        return ind.value === null || ind.value === undefined || ind.value === '';
      });

      if (incompleteIndicator) {
        return ElMessage.warning(`请填写指标: ${incompleteIndicator.name}`);
      }
    }

    let loading: ReturnType<typeof ElLoading.service> | null = null;
    try {
      isSubmitting.value = true;
      const loadingMessage = status === 1 ? '正在提交日报...' : '正在保存草稿...';
      loading = ElLoading.service({
        lock: true,
        text: loadingMessage,
        background: 'rgba(255, 255, 255, 0.7)',
      });

      const payload: DailyReportSaveReqVO = {
        id: route.query.id ? Number(route.query.id) : undefined,
        // 获取什么传什么，如果为null则不合并或按原样传（后端VO支持number，通常0是有效值）
        cycleId: cycleId.value as number,
        dailyTemplateId: dailyTemplateId.value as number,
        reportDate: submitDate.value,
        workSummary: workSummary.value,
        status: status,
        items: indicators.value.map((ind) => ({
          userTargetId: ind.userTargetId,
          indicatorId: ind.indicatorId,
          indicatorName: ind.name,
          indicatorValue: String(ind.value) || '返回数据为空',
          unit: ind.unit,
        })),
      };

      const res = await saveDailyReport(payload);
      console.log('res', res);
      if (res.code === 400) {
        return ElMessage.error(res.msg);
      }
      ElMessage.success(status === 1 ? '日报提交成功' : '草稿保存成功');
      router.push('/daily-report');
    } catch (error: any) {
      ElMessage.error(error.message || (status === 1 ? '提交失败' : '保存失败'));
    } finally {
      loading?.close();
      isSubmitting.value = false;
    }
  };
  // 格式化数字增加千分位
  const formatNumber = (val: string | number | undefined | null) => {
    if (val === undefined || val === null || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return val;
    return num.toLocaleString('en-US');
  };
</script>

<template>
  <div class="daily-report-create h-full flex flex-col space-y-4 overflow-hidden">
    <!-- Header Section -->
    <div
      class="bg-white/70 backdrop-blur-md rounded-[24px] p-4 border border-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <button
          class="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm group"
          @click="router.back()">
          <ChevronLeft class="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div class="h-8 w-px bg-slate-100 hidden md:block" />
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <h1 class="text-lg font-bold text-slate-800">
              填写工作日报
            </h1>
            <span
              class="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 text-[10px] font-medium rounded-md uppercase tracking-wider">New</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            <div class="flex items-center gap-1">
              <User class="w-3.5 h-3.5 text-slate-400" />
              <span>{{ userInfo.nickname || userInfo.username }} </span>
            </div>
            <div class="flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              <el-date-picker v-model="submitDate" type="date" placeholder="选择日期" size="small" value-format="YYYY-MM-DD"
                class="custom-date-picker-inline" :clearable="false" disabled />
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 w-full md:w-auto">
        <el-tag v-if="isReadOnly" type="info"
          class="!px-3 !h-8 !text-xs font-bold uppercase tracking-wider !rounded-lg border-none bg-slate-100 text-slate-500">
          已提交
        </el-tag>
        <template v-else>
          <el-button
            class="!rounded-xl !h-10 !px-4 !text-xs !border-slate-200 !text-slate-600 hover:!bg-slate-50 flex-1 md:flex-none"
            @click="submitReport(0)">
            <template #icon>
              <Save class="w-3.5 h-3.5" />
            </template>
            暂存草稿
          </el-button>
          <el-button type="primary"
            class="!rounded-xl !h-10 !px-6 !text-xs !bg-indigo-600 !border-none !shadow-lg !shadow-indigo-100 flex-1 md:flex-none hover:!scale-105 transition-all"
            :loading="isSubmitting" :disabled="isSubmitting" @click="submitReport(1)">
            <template v-if="!isSubmitting" #icon>
              <Send class="w-3.5 h-3.5" />
            </template>
            确认提交
          </el-button>
        </template>
      </div>
    </div>

    <!-- Tabs Section -->
    <div class="custom-tabs-wrapper flex-1 min-h-0 flex flex-col p-4">
      <el-tabs v-model="activeTab" class="report-tabs flex-1 flex flex-col min-h-0">
        <el-tab-pane name="indicators">
          <template #label>
            <div class="flex items-center gap-2 py-0.5 px-1">
              <TrendingUp class="w-3.5 h-3.5" />
              <span class="font-bold text-sm">绩效指标填报</span>
            </div>
          </template>

          <div class="pt-2 flex-1 flex flex-col lg:grid lg:grid-cols-[7.5fr_2.5fr] gap-6">
            <!-- Left: Indicators -->
            <div class="w-full space-y-4">
              <div class="flex items-center justify-between px-1" v-if="false">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <ClipboardCheck class="w-4 h-4" />
                  </div>
                  <h2 class="text-lg font-bold text-slate-800">
                    关键考核指标
                  </h2>
                </div>
              </div>

              <div v-loading="isLoadingIndicators" class="flex flex-col gap-4 min-h-[100px]">
                <div v-for="indicator in indicators" :key="indicator.name"
                  class="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 relative overflow-hidden flex flex-col md:flex-row gap-4">

                  <!-- Decorative Background Elements -->
                  <div
                    class="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-100/50 transition-colors" />
                  <div
                    class="absolute -bottom-10 -left-10 w-32 h-32 bg-slate-50/50 rounded-full blur-3xl pointer-events-none" />

                  <!-- AUTO 标识 -->
                  <div v-if="indicator.dataAggregation === 'system'"
                    class="absolute -right-6 top-2 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest py-0.5 px-6 rotate-45 shadow-sm z-10">
                    AUTO
                  </div>

                  <!-- Header: Target Badge (Top Right) -->
                  <div
                    v-if="indicator.targetValue !== null && indicator.targetValue !== undefined && indicator.targetValue !== '' && indicator.dataAggregation !== 'system'"
                    class="absolute top-[18px] right-4 z-20">
                    <div class="inline-flex items-center transition-all hover:scale-105 group/target cursor-help"
                      :title="`考核目标：${indicator.targetValue}${indicator.unit ? ' ' + indicator.unit : ''}`">
                      <div
                        class="flex items-center bg-indigo-50/80 rounded-l-md px-1.5 py-0.5 border border-indigo-100 border-r-0 h-5">
                        <TrendingUp class="w-3 h-3 text-indigo-500 mr-1" />
                        <span class="text-[12px] font-bold text-indigo-400 uppercase tracking-wider">目标值</span>
                      </div>
                      <div
                        class="bg-indigo-600 rounded-r-md px-2 py-0.5 border border-indigo-600 h-5 flex items-center shadow-sm">
                        <span class="text-[15px] font-bold text-white uppercase flex items-center gap-1">

                          {{ formatNumber(indicator.targetValue) }}{{ indicator.unit ? ' ' + indicator.unit : '' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    :class="['flex flex-col gap-4 w-full relative z-10', indicator.type === 'text_score' ? 'is-textarea-layout' : 'md:flex-row md:items-start']">
                    <!-- Left: Info -->
                    <div class="flex items-start gap-4 flex-1 min-w-0 pr-24 md:pr-0">
                      <div :class="[
                        indicator.iconBg || 'bg-slate-50',
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105',
                      ]">
                        <component :is="indicator.icon" :class="['w-6 h-6', indicator.iconColor || 'text-slate-400']" />
                      </div>

                      <div class="space-y-1.5 flex-1 min-w-0 py-0.5">
                        <div class="flex items-center gap-2 flex-wrap min-w-0">
                          <span class="text-rose-500 font-bold self-start mt-0.5 shrink-0">*</span>
                          <h3 class="text-base font-bold text-slate-900 truncate flex-1 min-w-0"
                            :title="indicator.indicatorName">
                            {{ indicator.indicatorName }}
                          </h3>
                        </div>

                        <p v-if="indicator.indicatorDescription"
                          class="text-xs text-slate-500 line-clamp-2 leading-relaxed"
                          :title="indicator.indicatorDescription">
                          {{ indicator.indicatorDescription }}
                        </p>

                        <div v-if="indicator.indicatorRuleName"
                          class="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50/80 rounded-md border border-slate-100/50 mt-1">
                          <span class="text-[13px] font-medium text-slate-500 truncate"
                            :title="`规则：${indicator.indicatorRuleName}`">规则：{{ indicator.indicatorRuleName }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Right: Input -->
                    <div :class="[
                      'shrink-0 flex flex-col gap-1.5 self-end',
                      indicator.type === 'text_score' ? 'w-full mt-2' : 'w-full md:w-auto md:min-w-[280px]'
                    ]">


                      <div v-if="indicator.autoFetch"
                        class="h-10 bg-indigo-50/50 rounded-xl border border-indigo-100/50 px-4 flex items-center justify-between group-hover:bg-indigo-50 transition-colors">
                        <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Auto Fetch</span>
                        <div class="flex items-baseline gap-1">
                          <span class="text-lg font-bold text-slate-900">{{ indicator.value }}</span>
                          <span class="text-xs font-medium text-slate-500 ml-0.5">{{ indicator.unit }}</span>
                        </div>
                      </div>

                      <div v-else class="relative group/input">
                        <template v-if="indicator.dataAggregation === 'system'">
                          <el-input
                            :model-value="(indicator.value === null || indicator.value === undefined || indicator.value === '') ? '返回数据为空' : indicator.value"
                            disabled class="custom-indicator-input-compact">
                            <template #suffix
                              v-if="indicator.value !== null && indicator.value !== undefined && indicator.value !== ''">
                              <span class="text-xs font-medium text-slate-400 mr-2">{{ indicator.unit }}</span>
                            </template>
                          </el-input>
                        </template>
                        <template v-else-if="indicator.type === 'number_step' || indicator.type === 'number'">
                          <el-input-number v-model="indicator.value" :step="1" :min="0"
                            class="custom-number-input-compact w-full" controls-position="right"
                            :disabled="isReadOnly" />
                          <span
                            class="absolute right-[44px] top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400 pointer-events-none z-10">
                            {{ indicator.unit }}
                          </span>
                        </template>
                        <template v-else-if="indicator.type === 'switch'">
                          <div
                            class="h-10 rounded-xl bg-slate-50/50 border border-slate-200 px-4 flex items-center justify-between transition-colors hover:border-slate-300">
                            <span class="text-sm font-bold"
                              :class="indicator.value === 1 ? 'text-emerald-600' : 'text-slate-500'">
                              {{ indicator.value === 1 ? '已完成' : '未完成' }}
                            </span>
                            <el-switch v-model="indicator.value" :active-value="1" :inactive-value="0"
                              style="--el-switch-on-color: #10b981; --el-switch-off-color: #cbd5e1"
                              :disabled="isReadOnly" />
                          </div>
                        </template>
                        <template v-else-if="indicator.type === 'text_score'">
                          <el-input v-model="indicator.value" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }"
                            :placeholder="indicator.placeholder || '填写情况说明或分值'" class="custom-textarea-compact"
                            :disabled="isReadOnly" />
                        </template>
                        <template v-else-if="indicator.type === 'select'">
                          <el-select v-model="indicator.value" placeholder="请选择" class="custom-select-compact w-full"
                            :disabled="isReadOnly" popper-class="custom-select-dropdown">
                            <el-option v-for="opt in indicator.options" :key="opt.value" :label="opt.label"
                              :value="opt.value" />
                          </el-select>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="!isLoadingIndicators && indicators.length === 0"
                  class="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                  <ClipboardList class="w-10 h-10 mb-2 opacity-20" />
                  <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    暂无派发指标
                  </p>
                </div>
              </div>
            </div>

            <!-- Right: Work Summary -->
            <div class="w-full sticky top-4 flex flex-col h-full">
              <div
                class="bg-white rounded-[26px] border border-slate-200 shadow-sm p-4 md:p-6 flex-1 flex flex-col min-h-[500px] relative overflow-hidden group">
                <!-- Decorative Background Elements -->
                <div
                  class="absolute -top-12 -right-12 w-48 h-48 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none transition-colors group-hover:bg-indigo-100/40" />
                <div
                  class="absolute -bottom-12 -left-12 w-48 h-48 bg-slate-50/40 rounded-full blur-3xl pointer-events-none transition-colors group-hover:bg-slate-100/40" />

                <div class="flex items-center gap-3 mb-6 relative z-10">
                  <div
                    class="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0 shadow-sm transition-transform hover:scale-110">
                    <FileText class="w-5.5 h-5.5" />
                  </div>
                  <div class="flex flex-col">
                    <div class="flex items-center gap-1.5">
                      <span class="text-rose-500 font-black self-start mt-0.5">*</span>
                      <h3 class="text-lg font-black text-slate-800 tracking-tight">
                        今日工作总结和后续工作计划
                      </h3>
                    </div>
                  </div>
                </div>
                <el-input v-model="workSummary" type="textarea" placeholder="请详细描述今日工作完成情况、遇到的问题及后续工作重点..."
                  class="custom-textarea-compact flex-1-textarea relative z-10" :disabled="isReadOnly" />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="false" name="tasks">
          <template #label>
            <div class="flex items-center gap-2 py-0.5">
              <History class="w-3.5 h-3.5" />
              <span class="font-bold text-sm">计划任务/外勤记录</span>
            </div>
          </template>

          <div class="space-y-4 pt-2 animate-in fade-in slide-in-from-top-4 duration-700">
            <div class="flex items-center justify-between px-1">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <Activity class="w-5 h-5" />
                </div>
                <div class="space-y-0.5">
                  <h2 class="text-lg font-bold text-slate-800">
                    今日外勤轨迹
                  </h2>
                  <p class="text-[10px] font-medium text-slate-400">
                    同步自计划任务/CRM系统
                  </p>
                </div>
              </div>
              <div
                class="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded-lg border border-emerald-100">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                实时同步中
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="(record, index) in fieldRecords" :key="index"
                class="bg-white rounded-[20px] border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all group flex flex-col gap-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex flex-col gap-1 min-w-0">
                    <h3
                      class="text-[13px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                      {{ record.location }}
                    </h3>
                    <div class="flex items-center gap-1 text-slate-400 text-xs font-medium">
                      <MapPin class="w-3.5 h-3.5 shrink-0" />
                      <span class="truncate">{{ record.address }}</span>
                    </div>
                  </div>
                  <div
                    class="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-medium rounded-lg flex items-center gap-1.5 shrink-0">
                    <Clock class="w-3.5 h-3.5" />
                    {{ record.startTime }} - {{ record.endTime }}
                  </div>
                </div>
                <div class="bg-slate-50/50 rounded-xl p-3 flex items-start gap-2 border border-slate-100/50 mt-1">
                  <FileText class="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <p class="text-slate-600 text-xs leading-relaxed line-clamp-2 font-medium">
                    {{ record.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
  .daily-report-create {
    width: 100%;
  }

  :deep(.report-tabs) {
    display: flex !important;
    flex-direction: column !important;
  }

  :deep(.report-tabs .el-tabs__content) {
    flex: 1 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    padding: 4px;
  }

  /* Hide scrollbar for Chrome, Safari and Opera */
  :deep(.report-tabs .el-tabs__content::-webkit-scrollbar) {
    display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  :deep(.report-tabs .el-tabs__content) {
    -ms-overflow-style: none;
    /* IE and Edge */
    scrollbar-width: none;
    /* Firefox */
  }

  /* Compact Input Styling */
  :deep(.custom-indicator-input-compact .el-input__wrapper) {
    border-radius: 12px;
    height: 40px;
    background-color: white;
    box-shadow: none !important;
    border: 1px solid #cbd5e1;
    padding: 0 16px;
    transition: all 0.3s;
  }

  :deep(.custom-indicator-input-compact .el-input__wrapper:hover) {
    border-color: #94a3b8;
  }

  :deep(.custom-indicator-input-compact .el-input__wrapper.is-focus) {
    background-color: white;
    border-color: #6366f1;
  }

  :deep(.custom-indicator-input-compact .el-input__inner) {
    font-weight: 700;
    font-size: 14px;
    color: #1e293b;
  }

  /* Textarea variation for custom-indicator-input-compact */
  :deep(.custom-indicator-input-compact.el-textarea .el-textarea__inner) {
    border-radius: 12px;
    background-color: white;
    box-shadow: none !important;
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
    transition: all 0.3s;
    font-weight: 600;
    font-size: 14px;
    color: #1e293b;
    resize: none;
    font-family: inherit;
  }

  :deep(.custom-indicator-input-compact.el-textarea .el-textarea__inner:hover) {
    border-color: #94a3b8;
  }

  :deep(.custom-indicator-input-compact.el-textarea .el-textarea__inner:focus) {
    background-color: white;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
  }

  /* Full height textarea for summary alignment */
  :deep(.flex-1-textarea) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  :deep(.flex-1-textarea .el-textarea__inner) {
    flex: 1;
    min-height: 300px;
    resize: none;
  }

  /* Compact Number Input */
  :deep(.custom-number-input-compact) {
    width: 100% !important;
  }

  :deep(.custom-number-input-compact .el-input-number__increase) {
    width: 32px;
    height: 19px;
    line-height: 19px;
    background: #f8fafc;
    border-color: #cbd5e1;
    border-top-right-radius: 12px;
  }

  :deep(.custom-number-input-compact .el-input-number__increase:hover) {
    background: #f1f5f9;
  }

  :deep(.custom-number-input-compact .el-input-number__decrease) {
    width: 32px;
    height: 19px;
    line-height: 19px;
    background: #f8fafc;
    border-color: #cbd5e1;
    border-bottom-right-radius: 12px;
  }

  :deep(.custom-number-input-compact .el-input-number__decrease:hover) {
    background: #f1f5f9;
  }

  :deep(.custom-number-input-compact .el-input__wrapper) {
    padding-left: 12px;
    padding-right: 48px;
    height: 40px;
    border-radius: 12px;
    background-color: white;
    box-shadow: none !important;
    border: 1px solid #cbd5e1;
    transition: all 0.3s;
  }

  :deep(.custom-number-input-compact .el-input__wrapper:hover) {
    border-color: #94a3b8;
  }

  :deep(.custom-number-input-compact .el-input__wrapper.is-focus) {
    border-color: #6366f1;
  }

  :deep(.custom-number-input-compact .el-input__inner) {
    font-weight: 700;
    font-size: 14px;
    color: #1e293b;
    text-align: left;
  }

  /* Compact Select */
  :deep(.custom-select-compact) {
    width: 100% !important;
  }

  :deep(.custom-select-compact .el-input__wrapper) {
    height: 40px;
    border-radius: 12px;
    background-color: white;
    box-shadow: none !important;
    border: 1px solid #cbd5e1;
    padding: 0 12px;
    transition: all 0.3s;
  }

  :deep(.custom-select-compact .el-input__wrapper:hover) {
    border-color: #94a3b8;
  }

  :deep(.custom-select-compact .el-input__wrapper.is-focus) {
    border-color: #6366f1;
  }

  :deep(.custom-select-compact .el-input__inner) {
    font-weight: 700;
    font-size: 14px;
    color: #1e293b;
  }

  /* Compact Textarea Styling */
  :deep(.custom-textarea-compact .el-textarea__inner) {
    border-radius: 16px;
    padding: 12px 20px 12px 16px;
    background-color: white;
    border: 1.5px solid #cbd5e1;
    box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.05);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
    transition: all 0.3s;
    line-height: 1.6;
    resize: none;
    /* Custom Scrollbar for Textarea */
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }

  :deep(.custom-textarea-compact .el-textarea__inner::-webkit-scrollbar) {
    width: 6px;
  }

  :deep(.custom-textarea-compact .el-textarea__inner::-webkit-scrollbar-thumb) {
    background-color: #cbd5e1;
    border-radius: 10px;
    border: 1px solid transparent;
  }

  :deep(.custom-textarea-compact .el-textarea__inner::-webkit-scrollbar-track) {
    background: transparent;
    margin: 12px 0;
    /* Keep scrollbar away from rounded corners */
  }

  :deep(.custom-textarea-compact .el-textarea__inner:focus) {
    background-color: white;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
  }

  /* Inline Date Picker Styling */
  :deep(.custom-date-picker-inline) {
    width: 140px !important;
  }

  :deep(.custom-date-picker-inline .el-input__wrapper) {
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
    height: 24px !important;
  }

  :deep(.custom-date-picker-inline .el-input__inner) {
    color: #475569 !important;
    font-weight: 600 !important;
    font-size: 12px !important;
    cursor: pointer !important;
  }

  :deep(.custom-date-picker-inline .el-input__prefix) {
    display: none !important;
  }

  :deep(.el-button) {
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Tabs Styling */
  .custom-tabs-wrapper {
    background: white;
    border-radius: 24px;
    border: 1px solid #f1f5f9;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.02);
  }

  :deep(.report-tabs .el-tabs__header) {
    margin-bottom: 8px;
    border-bottom: none;
  }

  :deep(.report-tabs .el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.report-tabs .el-tabs__nav) {
    padding: 2px;
  }

  :deep(.report-tabs .el-tabs__item) {
    height: 40px;
    padding: 0 24px;
    border-radius: 14px;
    font-size: 13px;
    transition: all 0.3s;
    color: #64748b;
  }

  :deep(.report-tabs .el-tabs__item.is-active) {
    background-color: #f8faff;
    color: #4f46e5;
  }

  :deep(.report-tabs .el-tabs__active-bar) {
    height: 2px;
    border-radius: 2px;
    background-color: #4f46e5;
    bottom: 2px;
  }

  /* Indicator Card Styling */
  .indicator-card {
    background: white;
    border-radius: 20px;
    border: 1.5px solid #e2e8f0;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .indicator-card:hover {
    border-color: #6366f1;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    transform: translateY(-2px);
  }
</style>
