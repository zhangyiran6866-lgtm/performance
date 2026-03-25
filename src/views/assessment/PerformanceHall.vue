<!--
  @author: Zyr
  @date: 2026-03-07 17:15:00
  @description: 绩效工作台 Tab 导航栏高度调整与全局内容区域间距对齐优化。
  @lines: +5, -5
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  BarChart3 as BarChart3Icon, 
  Calendar as CalendarIcon
} from 'lucide-vue-next';
import {
  Medal as Award,
  User as UserCircle,
  Unlock
} from '@element-plus/icons-vue';

import MyAssessmentWorkspace from '@/components/assessment/MyAssessmentWorkspace.vue';
import TeamAssessmentWorkspace from '@/components/assessment/TeamAssessmentWorkspace.vue';
import TeamGoalWorkspace from '@/components/assessment/TeamGoalWorkspace.vue';
import RatingWorkspace from '@/components/assessment/RatingWorkspace.vue';

defineOptions({ name: 'AssessmentHall' });

// ---------- Mock Business Logic ----------
// Current cycle state (simulated)
const currentCycle = {
  id: 'cycle-2026-03',
  title: '2026年3月份初级销售KPI',
  phase: 'rating', // goal_setting | rating | finished | public_公示
  expireDate: '2026-03-07',
};

// User role (simulated as 'manager' by default)
const userRole = ref<'employee' | 'manager'>('manager');

// Navigation state
const activeTab = ref('my_performance');
const selectedTeamCycle = ref<any>(null);
const currentDeptId = ref<string | number>('');

const handleSwitchTab = (tab: string, cycle: any, deptId?: string | number) => {
  activeTab.value = tab;
  if (cycle) {
    selectedTeamCycle.value = cycle;
  }
  if (deptId) {
    currentDeptId.value = deptId;
  }
};

// Map internal workspace state to top-level navigation tab
const navTab = computed({
  get: () => {
    if (['team_performance', 'team_goals', 'team_rating'].includes(activeTab.value)) {
      return 'team_performance';
    }
    return activeTab.value;
  },
  set: (val) => {
    activeTab.value = val;
  }
});

// Phase status UI mapping
const phaseInfo = computed(() => {
  const phase = (cycleProgressDetail.value?.stage || selectedTeamCycle.value?.stage || currentCycle.phase).toLowerCase();
  switch (phase) {
  case 'goal_setting':
    return {
      label: '目标设定中',
      color: 'bg-blue-500',
      description: '当前正在为下属设定本期指标。',
    };
  case 'published':
    return {
      label: '待签署',
      color: 'bg-indigo-500',
      description: '指标已下发，等待员工签署。',
    };
  case 'rating':
    return {
      label: '考评打分中',
      color: 'bg-amber-500',
      description: '各级主管正根据业绩表现进行闭案评分。',
    };
  case 'archived':
    return {
      label: '已归档',
      color: 'bg-emerald-500',
      description: '本考核周期已正式结束。',
    };
  case 'to_be_opened':
    return {
      label: '待开启',
      color: 'bg-slate-400',
      description: '等待周期开启。',
    };
  default:
    return { label: '未开始', color: 'bg-slate-400', description: '等待周期开启。' };
  }
});

// Locking logic for different workspaces
const isGoalSettingLocked = computed(() => {
  if (selectedTeamCycle.value) {
    return selectedTeamCycle.value.stage !== 'GOAL_SETTING';
  }
  return currentCycle.phase !== 'goal_setting';
});
const isRatingLocked = computed(() => {
  if (selectedTeamCycle.value) {
    return selectedTeamCycle.value.stage !== 'RATING';
  }
  return currentCycle.phase !== 'rating';
});

const cycleProgressDetail = ref<any>(null);
const handleUpdateCycleInfo = (data: any) => {
  cycleProgressDetail.value = data;
};

const formatDate = (date: any) => {
  if (!date) return '-';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50/50 overflow-hidden">
    <!-- Top Header Navigation / Breadcrumb replacement for more space -->
    <header class="bg-white border-b border-slate-200 px-5 py-4 shrink-0 shadow-sm z-20">
      <div class="flex items-center justify-between max-w-full mx-auto">
        <div class="flex items-center gap-8">
          <div class="flex items-center gap-4">
            <div class="bg-indigo-50 p-3 rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-center">
              <BarChart3Icon class="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 class="text-3xl font-black tracking-tight text-slate-900 leading-none">
                绩效工作台
              </h1>
              <p class="text-base text-slate-500 mt-1">
                实时跟进考评进度，沉淀个人与团队绩效资产
              </p>
            </div>
          </div>
          
        </div>

        <div class="flex items-center gap-6">
          <!-- Main Information Card (Requested Style) -->
          <div 
            v-if="['team_goals', 'team_rating'].includes(activeTab)"
            class="bg-slate-50 border border-slate-100/60 rounded-[20px] px-5 py-3 flex items-center gap-4 transition-all duration-300"
          >
            <div class="text-slate-400">
              <el-icon :size="20"><CalendarIcon /></el-icon>
            </div>
            <div class="flex flex-col min-w-0">
              <h4 class="text-[16px] font-black text-slate-800 leading-tight truncate">
                {{ cycleProgressDetail?.name || selectedTeamCycle?.name || currentCycle.title }}
              </h4>
              <p class="text-[14px] text-slate-400 font-bold mt-0.5 tracking-tight">
                截止时间: {{ cycleProgressDetail ? formatDate(cycleProgressDetail.endDate) : (selectedTeamCycle ? (selectedTeamCycle.endDate?.split?.(' ')?.[0] || '2026-03-07') : currentCycle.expireDate) }}
              </p>
            </div>
            <div 
              class="ml-2 px-3 py-1.5 rounded-xl text-white text-[11px] font-black shadow-[0_4px_10px_-2px_rgba(245,158,11,0.4)] whitespace-nowrap"
              :class="activeTab === 'team_rating' ? 'bg-amber-500' : phaseInfo.color"
            >
              {{ phaseInfo.label }}
            </div>
          </div>

          <!-- Special Actions if in Rating Mode -->
          <!-- <template v-if="activeTab === 'team_rating' && !isRatingLocked">
             <el-button
                type="primary"
                class="!bg-indigo-600 !border-indigo-600 !rounded-xl !h-10 !px-6 !font-bold shadow-lg shadow-indigo-600/20 transition-all hover:!scale-105 active:!scale-95"
              >
                全部提交
              </el-button>
          </template> -->
        </div>
      </div>
    </header>

    <!-- Main Tabs -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <div class="bg-white border-b border-slate-200 px-8 py-0 shrink-0 z-10">
        <el-tabs
          v-model="navTab"
          class="custom-nav-tabs"
        >
          <el-tab-pane name="my_performance">
            <template #label>
              <div class="flex items-center gap-2 h-13">
                <el-icon :size="20">
                  <UserCircle />
                </el-icon>
                <span>我的绩效</span>
              </div>
            </template>
          </el-tab-pane>

          <el-tab-pane
            v-if="userRole === 'manager'"
            name="team_performance"
          >
            <template #label>
              <div class="flex items-center gap-2 h-13">
                <el-icon :size="20">
                  <Award />
                </el-icon>
                <span>团队绩效</span>
              </div>
            </template>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-hidden relative">
        <MyAssessmentWorkspace v-if="activeTab === 'my_performance'" />
        <TeamAssessmentWorkspace 
          v-else-if="activeTab === 'team_performance'" 
          @switch-tab="handleSwitchTab"
        />
        <TeamGoalWorkspace
          v-else-if="activeTab === 'team_goals'"
          :is-locked="isGoalSettingLocked"
          :dept-id="currentDeptId"
          :cycle-id="selectedTeamCycle?.id"
          @back="activeTab = 'team_performance'"
          @update-cycle-info="handleUpdateCycleInfo"
        />
        <RatingWorkspace
          v-else-if="activeTab === 'team_rating'"
          :is-locked="isRatingLocked"
          :dept-id="currentDeptId"
          :cycle-id="selectedTeamCycle?.id"
          @back="activeTab = 'team_performance'"
        />

        <!-- Floating Phase Status Notification -->
        <transition 
          enter-active-class="transform transition ease-out duration-500" 
          enter-from-class="translate-y-10 opacity-0" 
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition ease-in duration-300"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div 
            v-if="['team_goals', 'team_rating'].includes(activeTab) && (activeTab === 'team_goals' ? isGoalSettingLocked : isRatingLocked)"
            class="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div class="bg-blue-600/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-blue-400/50">
              <div class="bg-blue-400 p-1.5 rounded-lg">
                <Unlock class="h-4 w-4" />
              </div>
              <div class="flex flex-col pr-4">
                <span class="text-xs font-black uppercase tracking-widest text-blue-100">只读模式开启</span>
                <span class="text-sm font-medium">当前周期处于<b>{{ phaseInfo.label }}</b>，禁止修改操作。</span>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure the hall takes full height below the breadcrumb/header of main layout */
.h-screen {
  height: calc(100vh - 0px);
}

.custom-phase-tag {
  border-radius: 0.5rem;
  height: 24px;
  line-height: normal;
}

.custom-submit-btn {
  background-color: #4f46e5;
  border-color: #4f46e5;
  height: 40px;
  border-radius: 10px;
  font-weight: 700;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
}

:deep(.custom-nav-tabs .el-tabs__header) {
  margin: 0;
  border-bottom: none;
}

:deep(.custom-nav-tabs .el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.custom-nav-tabs .el-tabs__item) {
  padding: 0 1.75rem;
  height: 52px;
  line-height: 52px;
  font-weight: 900;
  font-size: 0.95rem;
  color: #94a3b8;
  transition: all 0.3s;
}

:deep(.custom-nav-tabs .el-tabs__item.is-active) {
  color: #4f46e5;
}

:deep(.custom-nav-tabs .el-tabs__active-bar) {
  height: 4px;
  border-radius: 4px;
  background-color: #4f46e5;
}
</style>
