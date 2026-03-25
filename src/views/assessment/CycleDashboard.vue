<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowDown as ChevronDown,
  ArrowRight as ChevronRight,
  Warning as AlertCircle,
  ArrowLeft as ChevronLeft,
  Calendar,
} from '@element-plus/icons-vue';
import {
  FileText,
  Users,
  UserCheck,
  TrendingUp,
  BarChart3,
} from 'lucide-vue-next';
import { getPerformanceCycle, getPerformanceDashboard, type PerformanceCycleTemplateRespVO, type PerformanceComprehensiveRespVO } from '@/api/assessment';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';

defineOptions({ name: 'AssessmentCycleDashboard' });

const route = useRoute();
const router = useRouter();
const cycleId = route.params.id as string;

const activeTab = ref('templates'); // 'templates' or 'dashboard'

const cycleInfo = ref({
  id: cycleId,
  title: '',
  period: '',
  status: '',
  teamMemberCount: 0,
  completedCount: 0,
});

const cycleTemplates = ref<any[]>([]);
const dashboardData = ref<PerformanceComprehensiveRespVO | null>(null);
const loading = ref(false);
const dashboardLoading = ref(false);

const fetchDashboardData = async () => {
  if (dashboardData.value) return; // 已加载则跳过
  try {
    dashboardLoading.value = true;
    const res: any = await getPerformanceDashboard(Number(cycleId));
    if (res.code === 0) {
      dashboardData.value = res.data;
    }
  } catch (error) {
    console.error('获取绩效大盘失败:', error);
    ElMessage.error('获取绩效大盘数据失败');
  } finally {
    dashboardLoading.value = false;
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getPerformanceCycle(Number(cycleId));
    const data = (res as any)?.data || res;
    
    // 映射周期基本信息
    cycleInfo.value = {
      id: cycleId,
      title: data.name || '',
      period: `${dayjs(data.startDate).format('YYYY/MM/DD')} - ${dayjs(data.endDate).format('YYYY/MM/DD')}`,
      status: data.stage ? data.stage.toLowerCase() : '',
      teamMemberCount: data.teamMemberCount || 0,
      completedCount: data.completedCount || 0,
    };

    // 映射模板列表数据
    if (data.templateRespVOS && Array.isArray(data.templateRespVOS)) {
      cycleTemplates.value = data.templateRespVOS.map((tpl: PerformanceCycleTemplateRespVO) => {
        // 提取指标，后端新接口逻辑：直接取 templateItemRespVOS
        const templateItems = tpl.templateItemRespVOS || [];
        
        return {
          id: tpl.templateId,
          name: tpl.templateName,
          userCount: tpl.userCount || 0,
          indicatorCount: tpl.indicatorCount || templateItems.length,
          indicators: templateItems.map(item => ({
            name: item.indicatorName || '未命名指标',
            detail: item.indicatorRuleDescription || '无描述',
            engine: item.indicatorRuleName || 'DEFAULT',
            weight: item.weight || 0
          }))
        };
      });

      // 默认展开第一个模板
      if (cycleTemplates.value.length > 0) {
        expandedTemplates.value[cycleTemplates.value[0].id] = true;
      }
    }
  } catch (error) {
    console.error('获取周期详情失败:', error);
    ElMessage.error('获取周期详情失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

const expandedTemplates = ref<Record<string, boolean>>({});

const toggleTemplate = (id: string) => {
  expandedTemplates.value[id] = !expandedTemplates.value[id];
};

type EmployeeRecord = {
  id: string
  name: string
  role: string
  avatar: string
  score: number | null
  grade: string | null
  goalStatus: '已确认' | '待确认' | '未下发'
  history: { month: string; score: number }[]
}

type Department = {
  id: string
  name: string
  avgScore: number | null
  headcount: number
  ratedCount: number
  employees: EmployeeRecord[]
}

const generateHistory = (base: number): { month: string; score: number }[] => [
  { month: '2025-10', score: Math.round(base + (Math.random() - 0.5) * 15) },
  { month: '2025-11', score: Math.round(base + (Math.random() - 0.5) * 12) },
  { month: '2025-12', score: Math.round(base + (Math.random() - 0.5) * 10) },
  { month: '2026-01', score: Math.round(base + (Math.random() - 0.5) * 8) },
  { month: '2026-02', score: Math.round(base + (Math.random() - 0.5) * 6) },
];

const departments = computed<Department[]>(() => {
  if (!dashboardData.value?.templateRespVOS) return [];
  
  return dashboardData.value.templateRespVOS.map(tpl => ({
    id: String(tpl.templateId),
    name: tpl.templateName,
    avgScore: tpl.averageScore ?? null,
    headcount: tpl.userCount || 0,
    ratedCount: tpl.completeScoreCount || 0,
    employees: (tpl.userRespVOS || []).map(user => ({
      id: String(user.userId),
      name: user.userName,
      role: user.position || '员工',
      avatar: (user.userName || '未').substring(0, 1),
      score: user.overallScore,
      grade: user.grade,
      goalStatus: '已确认', // API 暂无此细化状态，默认为已确认
      history: generateHistory(user.overallScore || 80)
    }))
  }));
});

const expandedDepts = ref<Record<string, boolean>>({});

const toggleDept = (deptId: string) => {
  expandedDepts.value[deptId] = !expandedDepts.value[deptId];
};

const gradeColor = (grade: string | null) => {
  switch (grade) {
  case 'A': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  case 'B': return 'bg-blue-100 text-blue-700 border-blue-200';
  case 'C': return 'bg-amber-100 text-amber-700 border-amber-200';
  case 'D': return 'bg-red-100 text-red-700 border-red-200';
  default: return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};

// Summary stats - 使用 API 提供的汇总数据
const summary = computed(() => {
  if (dashboardData.value) {
    return {
      totalEmployees: dashboardData.value.totalAssessmentUser || 0,
      totalRated: dashboardData.value.completedScoringUser || 0,
      overallAvg: dashboardData.value.fullCycleAverageScore ?? null,
      deptCount: dashboardData.value.totalParticipatingDepartments || 0,
    };
  }
  return {
    totalEmployees: cycleInfo.value.teamMemberCount || 0,
    totalRated: cycleInfo.value.completedCount || 0,
    overallAvg: null as number | null,
    deptCount: 0,
  };
});

const viewTemplateDetail = (templateId: string | number) => {
  router.push({
    path: '/template/builder',
    query: {
      id: templateId,
      mode: 'view',
      redirect: route.fullPath
    }
  });
};

const goBack = () => router.push('/assessment/cycle');
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden space-y-6 px-4 xl:px-8 pb-6">
    <!-- Header with Back Button -->
    <div class="flex items-center justify-between gap-4 mt-2">
      <div class="flex items-center gap-4">
        <!-- Back Button -->
        <el-button
          circle
          class="shadow-sm hover:border-indigo-200 hover:bg-indigo-50/10 group transition-all !w-11 !h-11"
          @click="goBack"
        >
          <ChevronLeft class="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
        </el-button>

        <!-- Title Info -->
        <div class="flex flex-col items-start gap-1">
          <div class="flex items-center gap-3">
            <el-tag
              type="primary"
              effect="light"
              class="custom-tag-official"
              size="large"
            >
              绩效大盘
            </el-tag>
            <h1 class="text-2xl font-bold tracking-tight text-slate-800">
              {{ cycleInfo.title }}
            </h1>
          </div>
          <div class="flex items-center gap-1.5 text-slate-400">
            <Calendar class="w-3.5 h-3.5 mb-0.5" />
            <span class="text-[16px] font-medium tracking-tight">{{ cycleInfo.period }} · 仅HR可见统计视图</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="relative mt-2">
      <!-- Full-width Divider Line -->
      <div class="absolute bottom-0 -mx-4 xl:-mx-8 left-0 right-0 h-[1px] bg-slate-200/60"></div>
      
      <div class="flex gap-10">
        <button
          @click="activeTab = 'templates'"
          :class="[
            'pb-4 text-base font-bold transition-all relative z-10',
            activeTab === 'templates' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          ]"
        >
          本周期适用模板及名单
          <div
            v-if="activeTab === 'templates'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"
          ></div>
        </button>
        <button
          @click="() => { activeTab = 'dashboard'; fetchDashboardData(); }"
          :class="[
            'pb-4 text-base font-bold transition-all relative z-10',
            activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          ]"
        >
          绩效综合大盘
          <div
            v-if="activeTab === 'dashboard'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"
          ></div>
        </button>
      </div>
    </div>

    <!-- Tab Content Area -->
    <div 
      class="flex-1 overflow-y-auto pr-2 custom-scrollbar"
      v-loading="loading || dashboardLoading"
    >
      <div v-if="activeTab === 'templates'" class="space-y-6 animate-in fade-in duration-500 pb-10">
      <!-- Info Alert -->
      <div class="bg-indigo-50/40 border border-indigo-100/50 p-3 rounded-2xl flex items-start gap-4 text-left shadow-sm">
        <div class="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-1.5 shrink-0 shadow-sm"></div>
        <div class="text-[15px] text-indigo-900/80 leading-relaxed font-medium">
          该面板展示本次考评周期关联的所有<span class="font-bold">“考核模板（由配置中心下发）”</span>以及被分配到对应模板下的<span class="font-bold">“人员名单”</span>。点击查看模板详情配置可预览考核维度构成。
        </div>
      </div>

      <!-- Template List -->
      <div class="space-y-4">
        <div
          v-for="tpl in cycleTemplates"
          :key="tpl.id"
          class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <!-- Template Header -->
          <div
            class="px-6 py-5 flex items-center justify-between cursor-pointer select-none group"
            @click="toggleTemplate(tpl.id)"
          >
            <div class="flex items-center gap-5">
              <div class="text-slate-300 transition-transform duration-300 transform group-hover:text-indigo-400" :class="{ 'rotate-0': expandedTemplates[tpl.id], '-rotate-90': !expandedTemplates[tpl.id] }">
                <ChevronDown class="w-5 h-5" />
              </div>
              <div class="space-y-1.5">
                <div class="flex items-center gap-4">
                  <h3 class="text-xl font-bold text-slate-800 tracking-tight">{{ tpl.name }}</h3>
                  <div class="bg-indigo-50/50 px-3 py-1 rounded-md text-[11px] font-bold text-indigo-600/70 border border-indigo-100/50">
                    考评人数: {{ tpl.userCount }}人
                  </div>
                </div>
                <div class="flex items-center gap-1.5 text-slate-400">
                  <FileText class="w-3.5 h-3.5" />
                  <span class="text-xs font-medium">包含 {{ tpl.indicatorCount }} 个维度指标</span>
                </div>
              </div>
            </div>

            <el-button
              class="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-6 py-4 shadow-sm text-xs"
              @click.stop="viewTemplateDetail(tpl.id)"
            >
              查看模板详情配置
            </el-button>
          </div>

          <!-- Template Expanded Info -->
          <div
            v-if="expandedTemplates[tpl.id]"
            class="px-8 pb-8 animate-in slide-in-from-top-2 duration-300"
          >
            <div class="border-t border-slate-100 pt-6">
              <!-- <div class="flex items-center gap-2 mb-6 text-indigo-600">
                <CircleDot class="w-4 h-4" />
                <span class="text-sm font-bold tracking-tight">指标构成模型</span>
              </div> -->

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  v-for="(indicator, idx) in tpl.indicators"
                  :key="idx"
                  class="bg-white border border-slate-100 rounded-xl p-5 relative shadow-sm hover:border-indigo-100 transition-all hover:shadow-md group/card"
                >
                  <div class="flex justify-between items-start mb-4">
                    <span class="text-[104x] font-black text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded tracking-widest uppercase">
                      {{ indicator.name }}
                    </span>
                    <span class="text-lg font-black text-indigo-700/80 font-mono">
                      {{ indicator.weight }}%
                    </span>
                  </div>
                  <h4 class="text-[15px] font-bold text-slate-700 mb-4 leading-snug">
                    {{ indicator.detail }}
                  </h4>
                  <div class="flex items-center gap-2 text-slate-300">
                    <div class="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover/card:bg-indigo-300 transition-colors"></div>
                    <span class="text-[12px] font-bold uppercase tracking-wider">计分引擎: <span class="text-slate-400">{{ indicator.engine }}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'dashboard'" class="space-y-6 animate-in fade-in duration-500">
      <!-- Summary Statistics Dashboard -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <el-card
        shadow="hover"
        class="relative group custom-stat-card border-none"
      >
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
        <div class="p-1 flex items-center gap-4">
          <div class="bg-blue-50 p-3 rounded-2xl">
            <Users class="w-6 h-6 text-blue-500" />
          </div>
          <div class="text-left">
            <div class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
              考核总人数
            </div>
            <div class="text-2xl font-black text-slate-800">
              {{ summary.totalEmployees }}
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        shadow="hover"
        class="relative group custom-stat-card border-none"
      >
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
        <div class="p-1 flex items-center gap-4">
          <div class="bg-emerald-50 p-3 rounded-2xl">
            <UserCheck class="w-6 h-6 text-emerald-500" />
          </div>
          <div class="text-left">
            <div class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
              已完成评分
            </div>
            <div class="text-2xl font-black text-slate-800">
              {{ summary.totalRated }}
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        shadow="hover"
        class="relative group custom-stat-card border-none"
      >
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
        <div class="p-1 flex items-center gap-4">
          <div class="bg-purple-50 p-3 rounded-2xl">
            <TrendingUp class="w-6 h-6 text-purple-500" />
          </div>
          <div class="text-left">
            <div class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
              全周期平均分
            </div>
            <div class="text-2xl font-black text-slate-800">
              {{ summary.overallAvg?.toFixed(1) || '--' }}
            </div>
          </div>
        </div>
      </el-card>

      <el-card
        shadow="hover"
        class="relative group custom-stat-card border-none"
      >
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
        <div class="p-1 flex items-center gap-4">
          <div class="bg-amber-50 p-3 rounded-2xl">
            <BarChart3 class="w-6 h-6 text-amber-500" />
          </div>
          <div class="text-left">
            <div class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
              参评部门总数
            </div>
            <div class="text-2xl font-black text-slate-800">
              {{ summary.deptCount }}
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Alert for active cycles -->
    <div
      v-if="cycleInfo.status === 'rating'"
      class="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3 shadow-inner text-left"
    >
      <el-icon
        :size="20"
        class="text-blue-500 shrink-0 mt-0.5"
      >
        <AlertCircle />
      </el-icon>
      <div class="text-sm text-blue-800">
        <p class="font-bold mb-1">
          考核正在进行中
        </p>
        <p>当前分数为实时计算的参考得分，最终成绩将以周期正式结案归档后的记录为准。</p>
      </div>
    </div>

    <!-- Department Detail List -->
    <div class="space-y-4">
      <el-card
        v-for="dept in departments"
        :key="dept.id"
        shadow="hover"
        class="custom-dept-card border-slate-200"
      >
        <div 
          class="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
          @click="toggleDept(dept.id)"
        >
          <div class="flex items-center gap-4 min-w-0">
            <div class="text-slate-400">
              <el-icon v-if="expandedDepts[dept.id]">
                <ChevronDown />
              </el-icon>
              <el-icon v-else>
                <ChevronRight />
              </el-icon>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-slate-800">
                  {{ dept.name }}
                </h3>
                <el-tag
                  size="small"
                  effect="light"
                  type="info"
                  class="bg-slate-100 text-slate-500 font-bold border-none text-[10px]"
                >
                  {{ dept.headcount }}人
                </el-tag>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-[12px] text-slate-400  uppercase">评分进度</span>
                <el-progress 
                  :percentage="(dept.ratedCount / dept.headcount) * 100" 
                  :show-text="false" 
                  class="w-16 custom-progress"
                />
                <span class="text-[10px] font-bold text-slate-600">{{ dept.ratedCount }}/{{ dept.headcount }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4 shrink-0">
            <template v-if="dept.avgScore !== null">
              <div class="text-right">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  部门均分
                </div>
                <div class="text-xl font-black text-slate-800 leading-none mt-1.5">
                  {{ dept.avgScore }}
                </div>
              </div>
              <div
                :class="['w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-sm border border-white/50', 
                         gradeColor(dept.avgScore >= 85 ? 'A' : dept.avgScore >= 70 ? 'B' : dept.avgScore >= 60 ? 'C' : 'D')]"
              >
                {{ dept.avgScore >= 85 ? 'A' : dept.avgScore >= 70 ? 'B' : dept.avgScore >= 60 ? 'C' : 'D' }}
              </div>
            </template>
          </div>
        </div>

        <div
          v-if="expandedDepts[dept.id]"
          class="border-t border-slate-100 animate-in slide-in-from-top-2 duration-300"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50/50 border-b border-slate-100 italic">
                  <th class="text-left font-bold text-slate-400 text-[10px] uppercase px-6 py-3 tracking-widest">
                    考核对象
                  </th>
                  <th class="text-left font-bold text-slate-400 text-[10px] uppercase px-4 py-3 tracking-widest">
                    业务岗位
                  </th>
                  <th class="text-center font-bold text-slate-400 text-[10px] uppercase px-4 py-3 tracking-widest">
                    当前分
                  </th>
                  <th class="text-center font-bold text-slate-400 text-[10px] uppercase px-4 py-3 tracking-widest">
                    评级
                  </th>
                  <th class="text-right font-bold text-slate-400 text-[10px] uppercase px-6 py-3 tracking-widest">
                    半年趋势
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr
                  v-for="emp in dept.employees"
                  :key="emp.id"
                  class="group hover:bg-blue-50/30 transition-colors"
                >
                  <td class="px-6 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center text-xs font-bold text-slate-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700">
                        {{ emp.avatar }}
                      </div>
                      <span class="font-bold text-slate-700 group-hover:text-blue-900 transition-colors">{{ emp.name }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3.5 text-slate-500 font-medium">
                    {{ emp.role }}
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <span class="font-black text-slate-800 tracking-tight">{{ emp.score ?? '--' }}</span>
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <div
                      v-if="emp.grade"
                      :class="['inline-flex w-7 h-7 rounded items-center justify-center text-xs font-black shadow-inner', gradeColor(emp.grade)]"
                    >
                      {{ emp.grade }}
                    </div>
                  </td>
                  <td class="px-6 py-3.5">
                    <div class="flex items-center justify-end">
                      <el-tooltip
                        effect="light"
                        placement="left"
                        popper-class="custom-chart-tooltip"
                      >
                        <template #content>
                          <div class="bg-white min-w-[200px]">
                            <div class="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                              <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">
                                {{ emp.avatar }}
                              </div>
                              <span class="font-black text-xs text-slate-800">{{ emp.name }} · 历史绩效分布</span>
                            </div>
                            <div class="p-3 space-y-2">
                              <div
                                v-for="h in emp.history"
                                :key="h.month"
                                class="flex items-center justify-between gap-6"
                              >
                                <span class="text-[10px] font-bold text-slate-400 font-mono">{{ h.month }}</span>
                                <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                                  <div
                                    class="h-full bg-blue-500 rounded-full"
                                    :style="{ width: `${h.score}%` }"
                                  />
                                </div>
                                <span class="text-[10px] font-black text-slate-700 w-4 text-right">{{ h.score }}</span>
                              </div>
                            </div>
                          </div>
                        </template>
                        <div class="flex items-end gap-1 h-6 cursor-help group-hover:scale-110 transition-transform origin-right">
                          <div
                            v-for="(h, i) in emp.history.slice(-4)"
                            :key="i"
                            :class="['w-1.5 rounded-t-sm transition-all duration-500', 
                                     h.score >= 85 ? 'bg-emerald-400' : h.score >= 70 ? 'bg-blue-400' : 'bg-slate-300']"
                            :style="{ height: `${Math.max(4, (h.score / 100) * 24)}px` }"
                          />
                        </div>
                      </el-tooltip>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </el-card>
    </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.custom-tag-official {
  background-color: #DBEAFE;
  color: #3b66ff;
  border: none;
  font-weight: 800;
  padding: 5px 16px;
  height: 32px;
  line-height: 32px;
  font-size: 14px;
  border-radius: 8px;
}

.custom-header-button {
  background-color: white;
  border-color: #e2e8f0;
  color: #475569;
}

.custom-stat-card {
  border-radius: 1rem;
}
.custom-stat-card :deep(.el-card__body) {
  padding: 1rem;
}

.custom-dept-card {
  border-radius: 1rem;
}
.custom-dept-card :deep(.el-card__body) {
  padding: 0;
}

.custom-progress :deep(.el-progress-bar__outer) {
  background-color: #f1f5f9;
}
.custom-progress :deep(.el-progress-bar__inner) {
  background-color: #3b82f6;
}

.custom-chart-tooltip {
  padding: 0 !important;
  border-radius: 0.75rem !important;
  overflow: hidden !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  border: none !important;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
