<script setup lang="ts">
  import { ref, computed, onMounted, watch, onActivated } from 'vue';
  import { useRouter } from 'vue-router';
  import { getDailyReportHistory, getDailyReport, getTargetIndicators } from '@/api/daily';
  import { useUserStore } from '@/store/modules/user';
  import { getManageAllUser } from '@/api/system/dept/dept';
  import { ElMessage } from 'element-plus';
  import {
    ChevronRight,
    AlertCircle,
    ClipboardList,
    ClipboardCheck,
    ChevronLeft,
    ChevronDown,
    User,
    FileText,
    Plus,
    Activity,
    Calendar as CalendarIcon,
    TrendingUp,
    Users
  } from 'lucide-vue-next';

  defineOptions({
    name: 'DailyReportIndex'
  });

  const router = useRouter();
  const userStore = useUserStore();
  const userInfo = computed(() => userStore.user);

  // 下属用户列表
  const subordinateUsers = ref<any[]>([]);
  // 当前查看的用户ID（优先从 session 中恢复之前选择的 userId，如果没有则使用当前登录用户）
  const savedUserId = sessionStorage.getItem('dailyReportViewUserId');
  const currentViewUserId = ref<number>(savedUserId ? Number(savedUserId) : (userInfo.value?.id || 0));

  watch(() => userInfo.value?.id, (newId) => {
    if (newId && !savedUserId) {
      currentViewUserId.value = newId;
    }
  }, { immediate: true });

  // 是否显示用户选择器（仅当有下属时显示）
  const showUserSelector = computed(() => {
    // 过滤掉当前用户自己，只检查是否有其他用户（下属）
    return subordinateUsers.value.some(u => u.id !== userInfo.value.id);
  });

  // 获取下属用户列表
  const fetchSubordinates = async () => {
    if (!userInfo.value.deptId) {
      currentViewUserId.value = userInfo.value.id;
      return;
    }
    try {
      const res = await getManageAllUser();
      const users = Array.isArray(res) ? res : (res as any).data || [];

      subordinateUsers.value = users.map((u: any) => ({
        id: u.id,
        nickname: u.nickname || u.username,
        avatar: u.avatar
      }));

      // 如果获取后发现没有下属，强制重置当前查看用户为自己
      if (!subordinateUsers.value.some(u => u.id !== userInfo.value.id)) {
        currentViewUserId.value = userInfo.value.id;
      }
    } catch (error) {
      console.error('Failed to fetch subordinates:', error);
    }
  };

  interface Indicator {
    name: string;
    value: string;
    unit: string;
    source: string;
    icon: any;
    iconBg: string;
    iconColor: string;
  }

  interface ReportRecord {
    id: string;
    date: string;
    displayDate: string;
    weekday: string;
    status: 'submitted' | 'pending' | 'draft';
    content: string;
    indicators: Indicator[];
    score: number;
  }

  // ================== 日历逻辑 ==================
  const monthPickerRef = ref();
  // 设为当前时间：2026年3月14日
  const todayDate = new Date();
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const currentMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const selectedDate = ref(formatDate(todayDate));
  const isLoadingDetail = ref(false);
  const isLoadingHistory = ref(false);
  const fetchedIndicators = ref<any[]>([]);
  const currentDetail = ref<any>(null);

  const records = ref<ReportRecord[]>([]);

  // 获取该月份的日报历史（用于日历点亮）
  const fetchHistory = async (monthDate: Date) => {
    try {
      isLoadingHistory.value = true;
      const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const startDate = formatDate(firstDay);

      let endDay;
      const now = new Date();
      if (monthDate.getFullYear() === now.getFullYear() && monthDate.getMonth() === now.getMonth()) {
        endDay = now;
      } else {
        endDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      }
      const endDate = formatDate(endDay);

      const res = await getDailyReportHistory({
        reportDate: [startDate, endDate],
        userId: currentViewUserId.value
      });
      const data = res.data || res || [];
      if (Array.isArray(data)) {
        records.value = data.map((item) => ({
          id: item.id,
          date: item.reportDate.substring(5),
          displayDate: item.reportDate,
          weekday: '',
          status: item.isPending ? 'pending' : (item.status === 1 ? 'submitted' : 'draft'),
          content: item.workSummary || (item.isPending ? '待补填' : ''),
          indicators: [],
          score: 0,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      isLoadingHistory.value = false;
    }
  };

  const getDayRecord = (dateString: string) => {
    return records.value.find((r) => r.displayDate === dateString);
  };

  // 根据日报 ID 获取详情
const fetchDetail = async (id: string | number) => {
  try {
    isLoadingDetail.value = true;
    const [reportRes, targetRes] = await Promise.all([
      getDailyReport(Number(id)),
      getTargetIndicators({
        reportDate: selectedDate.value,
        userId: currentViewUserId.value
      })
    ]);

    const data = reportRes.data || reportRes;
    const targetData = targetRes.data?.indicators || targetRes.indicators || [];

    if (data) {
      currentDetail.value = data;
      if (Array.isArray(data.items)) {
        fetchedIndicators.value = data.items.map((ind: any) => {
          const targetInd = targetData.find((t: any) => t.indicatorId === ind.indicatorId);

          let inferredIcon = Activity;
          let inferredIconBg = 'bg-slate-50';
          let inferredIconColor = 'text-slate-400';
          let inferredType = 'text_score';

          const ruleId = ind.indicatorRuleId || targetInd?.indicatorRuleId 
            || ind.ruleId || targetInd?.ruleId;
          const ruleName = ind.indicatorRuleName || targetInd?.indicatorRuleName || '';

          if (ruleId === 14 || ruleName.includes('定性分级')) {
            inferredIcon = User;
            inferredIconBg = 'bg-cyan-50';
            inferredIconColor = 'text-cyan-500';
            inferredType = 'select';
          } else if (ruleId === 13 || ruleName.includes('任务节点(完成即满分,逾期0分)')) {
            inferredIcon = ClipboardCheck;
            inferredIconBg = 'bg-emerald-50';
            inferredIconColor = 'text-emerald-500';
            inferredType = 'switch';
          } else if ([8, 9, 10, 11].includes(ruleId) 
            || ruleName.includes('阶梯制') || ruleName.includes('预算控制')) {
            inferredIcon = Activity;
            inferredIconBg = 'bg-rose-50';
            inferredIconColor = 'text-rose-500';
            inferredType = 'number_step';
          } else if (ruleId === 12 || ruleName.includes('领导直接打分')) {
            inferredIcon = ClipboardList;
            inferredIconBg = 'bg-cyan-50';
            inferredIconColor = 'rgb(71 193 241)';
          }

          return {
            ...targetInd,
            ...ind,
            name: ind.indicatorName || targetInd?.indicatorName,
            value: ind.indicatorValue,
            unit: ind.unit || targetInd?.unit,
            ruleName: ind.indicatorRuleName || targetInd?.indicatorRuleName,
            indicatorDescription: ind.indicatorDescription || targetInd?.indicatorDescription,
            dataAggregation: ind.dataAggregation || targetInd?.dataAggregation,
            type: inferredType,
            icon: inferredIcon,
            iconBg: inferredIconBg,
            iconColor: inferredIconColor
          };
        }).sort((a: any, b: any) => {
          const aIsQual = a.ruleName === '领导直接打分';
          const bIsQual = b.ruleName === '领导直接打分';
          if (aIsQual && !bIsQual) return -1;
          if (!aIsQual && bIsQual) return 1;
          return 0;
        });
      }
    }
  } catch (error) {
    console.error('Failed to fetch detail:', error);
    currentDetail.value = null;
    fetchedIndicators.value = [];
  } finally {
    isLoadingDetail.value = false;
  }
};

  onMounted(async () => {
    // 先获取下属列表，确定是否有查看权限
    await fetchSubordinates();

    await fetchHistory(currentMonth.value);

    // 自动选中今天并获取详情
    const todayStr = selectedDate.value;
    const day = calendarDays.value.find(d => d.dateString === todayStr);
    if (day) {
      handleDateClick(day);
    }
  });

  // 页面从缓存恢复时，刷新数据
  onActivated(async () => {
    await fetchHistory(currentMonth.value);

    // 重新获取选中日期的详情
    const record = getDayRecord(selectedDate.value);
    if (record && record.id) {
      fetchDetail(record.id);
    } else {
      currentDetail.value = null;
      fetchedIndicators.value = [];
    }
  });

  // 监听查看对象变化，重新获取数据
  watch(currentViewUserId, (newVal) => {
    sessionStorage.setItem('dailyReportViewUserId', String(newVal));
    fetchHistory(currentMonth.value);
    // 切换用户时，清空当前详情并重新尝试获取选中日期的详情
    currentDetail.value = null;
    fetchedIndicators.value = [];

    setTimeout(() => {
      const record = getDayRecord(selectedDate.value);
      if (record && record.id) {
        fetchDetail(record.id);
      }
    }, 500);
  });

  const monthLabel = computed(() => {
    return currentMonth.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
  });

  const handleMonthChange = (val: Date) => {
    if (val) {
      currentMonth.value = new Date(val.getFullYear(), val.getMonth(), 1);
      fetchHistory(currentMonth.value);
      const now = new Date();
      if (currentMonth.value.getFullYear() === now.getFullYear()
        && currentMonth.value.getMonth() === now.getMonth()) {
        selectedDate.value = formatDate(now);
        const record = getDayRecord(selectedDate.value);
        if (record && record.id) {
          fetchDetail(record.id);
        } else {
          currentDetail.value = null;
          fetchedIndicators.value = [];
        }
      }
    }
  };

  const pickerShortcuts = [
    {
      text: '今天',
      value: new Date(),
    },
  ];

  const prevMonth = () => {
    currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1);
    fetchHistory(currentMonth.value);
  };

  const isNextMonthDisabled = computed(() => {
    const next = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1);
    const now = new Date();
    return next > new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const nextMonth = () => {
    if (isNextMonthDisabled.value) return;
    currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1);
    fetchHistory(currentMonth.value);
  };

  const disabledMonth = (date: Date) => {
    const now = new Date();
    return date > new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const calendarDays = computed(() => {
    const year = currentMonth.value.getFullYear();
    const month = currentMonth.value.getMonth();
    const today = new Date();
    const todayStr = formatDate(today);

    const formatDateLocal = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayL = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayL}`;
    };

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];

    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      const dateStr = formatDateLocal(d);
      days.push({
        date: d,
        isCurrentMonth: false,
        isFuture: dateStr > todayStr,
        isToday: dateStr === todayStr,
        dateString: dateStr,
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dateStr = formatDateLocal(d);
      days.push({
        date: d,
        isCurrentMonth: true,
        isFuture: dateStr > todayStr,
        isToday: dateStr === todayStr,
        dateString: dateStr,
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = formatDateLocal(d);
      days.push({
        date: d,
        isCurrentMonth: false,
        isFuture: dateStr > todayStr,
        isToday: dateStr === todayStr,
        dateString: dateStr,
      });
    }

    return days;
  });

  const handleDateClick = (day: any) => {
    if (day.isFuture) return;
    if (!day.isCurrentMonth) {
      currentMonth.value = new Date(day.date.getFullYear(), day.date.getMonth(), 1);
      fetchHistory(currentMonth.value);
    }
    selectedDate.value = day.dateString;
    const record = getDayRecord(day.dateString);
    if (record && record.id) {
      fetchDetail(record.id);
    } else {
      currentDetail.value = null;
      fetchedIndicators.value = [];
    }
  };

  // 是否为他人视角（查看下属日报）
  const isViewingOthers = computed(() => {
    return currentViewUserId.value !== userInfo.value.id;
  });

  const goToFill = () => {
    // 默认跳到选中的日期
    const targetDate = selectedDate.value;
    const record = getDayRecord(targetDate);

    // 如果是查看他人视角，且没有记录或者记录是草稿，不允许操作
    // 如果是查看他人视角，且有记录且已提交，允许跳转查看
    if (isViewingOthers.value) {
      if (!record || record.status !== 'submitted') {
        return;
      }
    }

    router.push({
      path: '/daily-report/create',
      query: {
        date: targetDate,
        id: record?.id,
        userId: currentViewUserId.value,
      },
    });
  };

  const handleTodayAction = () => {
    const todayStr = formatDate(new Date());
    const record = getDayRecord(todayStr);

    if (isViewingOthers.value) {
      if (!record || record.status !== 'submitted') {
        ElMessage.warning('该下属今日尚未提交日报');
        return;
      }
    }

    if (record) {
      // 如果今日已有记录（草稿或已提交），则进入编辑/查看模式
      router.push({
        path: '/daily-report/create',
        query: {
          date: todayStr,
          id: record.id,
          userId: currentViewUserId.value,
        },
      });
    } else {
      // 否则直接去填报今日
      router.push({
        path: '/daily-report/create',
        query: {
          date: todayStr,
          userId: currentViewUserId.value,
        },
      });
    }
  };

  // 计算今日状态，用于显示按钮文案
  const todayStatusLabel = computed(() => {
    const todayStr = formatDate(new Date());
    const record = getDayRecord(todayStr);

    if (isViewingOthers.value) {
      if (record && record.status === 'submitted') {
        return '查看今日日报';
      }
      return '今日未提交';
    }

    if (!record) return '填写今日日报';
    if (record.status === 'submitted') return '查看今日日报';
    if (record.status === 'draft') return '继续编辑今日日报';
    return '填写今日日报';
  });

  const getStatusType = (status: string) => {
    switch (status) {
      case 'submitted': return 'success';
      case 'pending': return 'warning';
      case 'draft': return 'info';
      default: return 'info';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted': return '已确认提交';
      case 'pending': return '待补填';
      case 'draft': return '草稿';
      default: return '';
    }
  };
// 格式化数字增加千分位
const formatNumber = (val: string | number | undefined | null) => {
  if (val === undefined || val === null || val === '') return '';
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toLocaleString('en-US');
};

// 显示指标值（处理定性分级 ID 转换）
const displayIndicatorValue = (ind: any) => {
  const val = ind.indicatorValue || ind.value;
  if (ind.type === 'select') {
    const options = [
      { label: '优秀', value: '1' },
      { label: '良好', value: '2' },
      { label: '普通', value: '3' },
      { label: '不合格', value: '4' },
    ];
    const option = options.find(o => o.value === String(val) || o.label === val);
    return option ? option.label : (val || '0');
  }
  return val || '0';
};
</script>

<template>
  <div
    class="daily-report-container h-full flex flex-col overflow-hidden animate-in fade-in duration-500 bg-slate-50/50 space-y-6">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <div class="flex items-center gap-5">
        <div
          class="bg-indigo-50 p-3.5 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-center transition-transform">
          <ClipboardList class="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-800">
            我的工作日报
          </h1>
          <div class="flex items-center gap-2 mt-1">
            <p class="text-sm text-slate-500 font-medium">
              {{ userInfo.nickname || userInfo.username }} ({{ userInfo.id }}) · <span
                class="text-indigo-600 font-bold">{{ monthLabel }}</span>考核周期进行中
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- 查看对象选择器 (仅当有下属时显示) -->
        <div v-if="showUserSelector" class="flex items-center gap-2  p-1 rounded-xl">
          <el-select v-model="currentViewUserId" placeholder="选择查看对象" class="!w-40 custom-user-select" filterable>
            <template #prefix>
              <Users class="w-4 h-4 text-slate-500" />
            </template>
            <el-option :value="userInfo.id" label="我的日报">
              <div class="flex items-center gap-2">
                <span class="font-bold text-indigo-600">我的日报</span>
              </div>
            </el-option>
            <el-option-group label="我的下属">
              <el-option v-for="user in subordinateUsers.filter(u => u.id !== userInfo.id)" :key="user.id"
                :label="user.nickname" :value="user.id">
                <div class="flex items-center gap-2">
                  <div
                    class="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                    {{ user.nickname.charAt(0) }}
                  </div>
                  <span>{{ user.nickname }}</span>
                </div>
              </el-option>
            </el-option-group>
          </el-select>
        </div>

        <el-button type="primary" size="large"
          class="!rounded-xl !h-12 !px-6 shadow-sm hover:shadow-md font-bold !bg-indigo-600 !border-indigo-600 transition-all"
          :class="{ '!bg-slate-400 !border-slate-400 opacity-80 cursor-not-allowed': isViewingOthers && getDayRecord(formatDate(new Date()))?.status !== 'submitted' }"
          @click="handleTodayAction">
          <template #icon>
            <!-- <component :is="getDayRecord(formatDate(new Date()))?.status === 'submitted' ? 'FileText' : 'Plus'"
              class="w-5 h-5" /> -->
            <Plus class="w-5 h-5" v-if="getDayRecord(formatDate(new Date()))?.status !== 'submitted'" />
            <FileText class="w-5 h-5" v-else />
          </template>

          {{ todayStatusLabel }}
        </el-button>
      </div>
    </div>

    <div
      class="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[7fr_3fr] gap-6 items-stretch animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div
        class="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-700">
        <div v-if="selectedDate" v-loading="isLoadingDetail" class="flex flex-col h-full overflow-hidden">
          <div class="flex items-center gap-3 shrink-0 p-4 border-b border-slate-100">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <ClipboardCheck class="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-800 tracking-tight">
                填报详情
              </h3>
              <p class="text-xs text-slate-400 font-medium">
                {{ selectedDate }}
              </p>
            </div>
          </div>

          <div class="flex flex-col flex-1 min-h-0">
            <div class="flex-1 overflow-y-auto custom-scrollbar p-4">
              <div class="flex flex-col gap-4">
                <div class="flex items-center gap-4">
                  <div :class="[
                    'w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-md',
                    !getDayRecord(selectedDate)
                      ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                      : 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white',
                  ]">
                    <span class="text-[12px] font-bold opacity-80 uppercase tracking-tighter">{{
                      selectedDate.split('-')[1]
                    }}月</span>
                    <span class="text-xl font-black leading-none mt-0.5">{{ selectedDate.split('-')[2] }}</span>
                  </div>
                  <div class="space-y-1">
                    <h4 class="text-xxxs font-black text-slate-900">
                      {{ getDayRecord(selectedDate)?.weekday || '当日' }}填报
                    </h4>
                    <el-tag :type="getStatusType(getDayRecord(selectedDate)?.status || 'pending')" effect="dark"
                      class="!rounded-md !border-none !px-2.5 !h-6 !text-[11px]  uppercase tracking-widest shadow-sm"
                      :class="{
                        '!bg-emerald-500': getDayRecord(selectedDate)?.status === 'submitted',
                        '!bg-orange-500': !getDayRecord(selectedDate) || getDayRecord(selectedDate)?.status === 'pending',
                        '!bg-slate-500': getDayRecord(selectedDate)?.status === 'draft',
                      }">
                      {{ getStatusLabel(getDayRecord(selectedDate)?.status || 'pending') }}
                    </el-tag>
                  </div>
                </div>

                <div v-if="currentDetail" class="space-y-4">
                  <div
                    class="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/30 relative overflow-hidden group/summary shadow-sm hover:shadow-md transition-all">
                    <div
                      class="absolute -right-4 -top-4 w-12 h-12 bg-indigo-100/20 rounded-full blur-xl transition-all group-hover/summary:scale-150" />
                    <div class="flex items-center gap-2 mb-3">
                      <div
                        class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                        <FileText class="w-3.5 h-3.5 text-white" />
                      </div>
                      <h5 class="text-xs font-black text-indigo-600 uppercase tracking-[0.1em]">
                        日报总结与计划
                      </h5>
                    </div>
                    <p
                      class="text-slate-700 text-sm leading-relaxed font-semibold italic pl-1 border-l-2 border-indigo-200">
                      “{{ currentDetail.workSummary }}”
                    </p>
                    <div v-if="currentDetail.tomorrowPlan" class="mt-4 pt-4 border-t border-indigo-100/40 flex gap-2">
                      <TrendingUp class="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <p class="text-slate-500 text-[11px] leading-relaxed">
                        <strong class="text-indigo-900/60 uppercase text-[9px] tracking-wide block mb-0.5">Next
                          Steps</strong>
                        {{ currentDetail.tomorrowPlan }}
                      </p>
                    </div>
                  </div>
                </div>

                <div v-if="fetchedIndicators.length > 0" class="space-y-2.5">
                  <span class="text-[10px] text-slate-500 font-black uppercase tracking-wider block mb-1">
                    考核指标达成情况
                  </span>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div v-for="(ind, i) in fetchedIndicators" :key="i"
                      :class="[
                        'p-4 bg-white rounded-2xl border border-slate-200 relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group/ind flex flex-col gap-3',
                        ind.ruleName === '领导直接打分' ? 'col-span-full' : ''
                      ]">

                      <!-- AUTO 标识 -->
                      <div v-if="ind.dataAggregation === 'system'"
                        class="absolute -right-6 top-2 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest py-0.5 px-6 rotate-45 shadow-sm z-10">
                        AUTO
                      </div>

                      <div class="flex items-center gap-2 min-w-0 relative z-0 pr-12">
                        <div :class="[
                          ind.iconBg || 'bg-slate-50',
                          'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover/ind:scale-110',
                        ]">
                          <component :is="ind.icon" :class="[ind.iconColor || 'text-slate-400', 'w-3.5 h-3.5']" />
                        </div>
                        <span class="text-xxs font-black text-slate-900 truncate" :title="ind.name">{{ ind.name
                        }}</span>
                      </div>

                      <!-- Premium Target Badge (Compact for grid) - Hidden if AUTO -->
                      <div v-if="ind.targetValue !== null && ind.targetValue !== undefined && ind.targetValue !== '' && ind.dataAggregation !== 'system'"
                        class="absolute top-4 right-4 inline-flex items-center transition-all hover:scale-105 group/target cursor-help z-20"
                        :title="`考核目标：${ind.targetValue}${ind.unit ? ' ' + ind.unit : ''}`">
                        <div
                          class="flex items-center bg-indigo-50/80 rounded-l px-2 py-0.5 border border-indigo-100 border-r-0 h-5">
                          <TrendingUp class="w-3 h-3 text-indigo-500 mr-1.5" />
                          <span class="text-[12px] font-bold text-indigo-400 uppercase tracking-tighter">目标值</span>
                        </div>
                        <div
                          class="bg-indigo-600 rounded-r px-2 py-0.5 border border-indigo-600 h-5 flex items-center shadow-sm">
                          <span class="text-[15px] font-bold text-white whitespace-nowrap">
                            {{ formatNumber(ind.targetValue) }}{{ ind.unit ? ` ${ind.unit}` : '' }}
                          </span>
                        </div>
                      </div>

                      <p v-if="ind.indicatorDescription" class="text-[10px] text-slate-500 line-clamp-1 opacity-70"
                        :title="ind.indicatorDescription">
                        {{ ind.indicatorDescription }}
                      </p>

                      <div v-if="ind.ruleName"
                        class="text-[12px] text-slate-400 leading-snug border-b border-slate-100/50 pb-1 mb-1 truncate">
                        规则：{{ ind.ruleName }}
                      </div>

                      <div class="flex items-baseline justify-between mt-auto">
                        <div class="flex items-baseline gap-1 min-w-0 flex-1">
                          <template v-if="ind.type === 'switch'">
                            <span class="text-sm font-black"
                              :class="ind.indicatorValue == '1' ? 'text-emerald-600' : 'text-rose-500'">
                              {{ ind.indicatorValue == '1' ? '已完成' : '未完成' }}
                            </span>
                          </template>
                          <template v-else>
                            <span class="text-sm font-black text-indigo-600 break-words whitespace-pre-wrap leading-relaxed">
                              {{ displayIndicatorValue(ind) }}
                            </span>
                            <span v-if="ind.unit && ind.type !== 'select'" class="text-[10px] font-bold text-slate-400 shrink-0">{{ ind.unit }}</span>
                          </template>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else-if="!isLoadingDetail" class="py-10 flex flex-col items-center justify-center text-slate-500"
                  style="margin-top: 10%;">
                  <AlertCircle class="w-8 h-8 mb-2 opacity-20" />
                  <p class="text-[14px]  uppercase tracking-widest">
                    该日期日报未填报
                  </p>
                </div>
              </div>
            </div>

            <div class=" border-t border-slate-100 shrink-0 bg-slate-50/50">
              <div v-if="getDayRecord(selectedDate) && getDayRecord(selectedDate)!.score > 0"
                class="flex items-center justify-between bg-white px-5 py-3 border border-slate-200 rounded-xl shadow-sm">
                <span class="text-xs font-bold text-slate-500">
                  效率评分
                </span>
                <div class="flex items-baseline gap-1">
                  <span class="text-2xl font-black text-slate-800">
                    {{ getDayRecord(selectedDate)?.score }}
                  </span>
                  <span class="text-[10px] font-bold text-slate-400">pts</span>
                </div>
              </div>
              <div v-else-if="!getDayRecord(selectedDate) || getDayRecord(selectedDate)?.status !== 'submitted' || true"
                class="w-full p-4">
                <el-button v-if="!isViewingOthers || (getDayRecord(selectedDate)?.status === 'submitted')"
                  type="primary"
                  class="w-full !rounded-xl !h-14 !text-base font-bold shadow-sm hover:shadow-md transition-all group/action !bg-indigo-600 !border-indigo-600"
                  @click="goToFill">
                  <span class="flex items-center justify-center gap-2">
                    {{ getDayRecord(selectedDate)?.status === 'submitted' ? '查看日报详情' :
                      (getDayRecord(selectedDate)?.status
                        === 'draft' ? '继续编辑草稿' : '立即开始填报') }}

                    <component :is="getDayRecord(selectedDate)?.status === 'submitted' ? 'FileText' : 'Plus'"
                      class="w-5 h-5 group-hover/action:rotate-90 transition-transform duration-300" />
                  </span>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center text-center h-full">
          <div class="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
            <ClipboardList class="w-8 h-8" />
          </div>
          <div>
            <h4 class="text-slate-800 font-black text-base tracking-tight">
              请选择日期
            </h4>
            <p class="text-slate-400 text-[10px] mt-1 font-medium mb-6">
              点击日历查看具体的绩效表现
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-3 sm:p-4 lg:p-4 border border-slate-200 shadow-sm flex flex-col min-h-0">
        <div class="flex items-center justify-between shrink-0 mb-3 sm:mb-5">
          <div class="flex items-center gap-2 sm:gap-3 cursor-pointer group/header relative"
            @click="monthPickerRef?.handleOpen()">
            <div
              class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover/header:bg-indigo-100 transition-colors">
              <CalendarIcon class="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            </div>
            <div>
              <h2
                class="text-base sm:text-lg lg:text-2xl font-bold text-slate-900 tracking-tight group-hover/header:text-indigo-600 transition-colors flex items-center gap-1 sm:gap-2">
                {{ monthLabel }}
                <ChevronDown
                  class="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover/header:text-indigo-400 transition-colors" />
              </h2>
              <p class="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5 sm:mt-1">
                点击切换月份
              </p>
            </div>

            <div class="absolute opacity-0 pointer-events-none">
              <el-date-picker ref="monthPickerRef" v-model="currentMonth" type="month" placeholder="选择月份"
                :shortcuts="pickerShortcuts" :disabled-date="disabledMonth" @change="handleMonthChange" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
              @click="prevMonth">
              <ChevronLeft class="w-5 h-5" />
            </button>
            <button
              class="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
              :class="{ 'opacity-30 cursor-not-allowed pointer-events-none': isNextMonthDisabled }" @click="nextMonth">
              <ChevronRight class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="flex-1 flex flex-col min-h-0">
          <div class="grid grid-cols-7 gap-2 shrink-0 mb-2">
            <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day"
              class="text-center py-2 text-[10px] sm:text-xs font-bold text-slate-400 border-b border-slate-50">
              {{ day }}
            </div>
          </div>

          <div class="flex-1 grid grid-cols-7 grid-rows-6 gap-1 sm:gap-2 min-h-0">
            <div v-for="(day, index) in calendarDays" :key="index" :class="[
              'relative rounded-md sm:rounded-lg border transition-all cursor-pointer p-1 group flex flex-col items-center justify-center overflow-hidden',
              (!day.isCurrentMonth || day.isFuture)
                ? 'opacity-30 pointer-events-none border-transparent bg-slate-50/50'
                : 'bg-slate-50/50 border-transparent hover:bg-white hover:border-indigo-100 hover:shadow-sm',
              selectedDate === day.dateString
                ? '!bg-indigo-600 border-indigo-600 shadow-md ring-1 ring-indigo-600 z-10'
                : '',
            ]" @click="handleDateClick(day)">
              <div class="flex flex-col items-center justify-center gap-1.5 relative z-10 w-full h-full min-w-0 px-0.5">
                <div :class="[
                  'w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-md flex items-center justify-center transition-colors duration-300',
                  selectedDate === day.dateString ? 'text-white' : 'group-hover:text-indigo-600 text-slate-700 font-bold',
                  day.isToday && selectedDate !== day.dateString ? 'bg-indigo-100 text-indigo-700' : ''
                ]">
                  <span class="text-[11px] sm:text-sm lg:text-base font-bold tracking-tight">
                    {{ day.date.getDate() }}
                  </span>
                </div>

                <div v-if="getDayRecord(day.dateString)" class="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0" :class="[
                  getDayRecord(day.dateString)?.status === 'submitted'
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-200'
                    : getDayRecord(day.dateString)?.status === 'pending'
                      ? 'bg-orange-500 shadow-sm shadow-orange-200'
                      : 'bg-slate-400',
                ]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .daily-report-container {
    width: 100%;
    background-color: #f8fafc;
  }

  :deep(.custom-search .el-input__wrapper) {
    border-radius: 99px;
    background-color: #f8fafc;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05) !important;
    border: 1px solid #e2e8f0;
    padding: 0 16px;
    height: 48px;
    transition: all 0.3s;
  }

  :deep(.custom-search .el-input__wrapper:hover) {
    border-color: #6366f1/30;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
  }

  :deep(.custom-search .el-input__wrapper.is-focus) {
    background-color: white;
    border-color: #6366f1;
    box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.1) !important;
  }

  /* Main Content Scrollbar */
  .main-scroll-area::-webkit-scrollbar {
    width: 6px;
  }

  .main-scroll-area::-webkit-scrollbar-track {
    background: transparent;
  }

  .main-scroll-area::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
  }

  .main-scroll-area::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
  }

  /* Detail Content Scrollbar */
  .detail-scroll-area::-webkit-scrollbar {
    width: 4px;
  }

  .detail-scroll-area::-webkit-scrollbar-track {
    background: transparent;
  }

  .detail-scroll-area::-webkit-scrollbar-thumb {
    background: #f1f5f9;
    border-radius: 10px;
  }

  .detail-scroll-area::-webkit-scrollbar-thumb:hover {
    background: #e2e8f0;
  }

  /* Glass Effects */
  :deep(.el-button--primary) {
    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important;
    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3) !important;
  }

  :deep(.el-button--primary:hover) {
    transform: translateY(-2px);
    box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.4) !important;
  }
</style>
