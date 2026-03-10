<!--
  @author: Zyr
  @date: 2026-03-07 17:15:00
  @description: 绩效工作台 Tab 导航栏高度调整与全局内容区域间距对齐优化。
  @lines: +5, -5
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  DataLine as LayoutDashboard,
  Aim as Target,
  Medal as Award,
  User as UserCircle,
  Calendar,
  Lock,
  Unlock,
} from '@element-plus/icons-vue';

import MyAssessmentWorkspace from '@/components/assessment/MyAssessmentWorkspace.vue';
import TeamGoalWorkspace from '@/components/assessment/TeamGoalWorkspace.vue';
import RatingWorkspace from '@/components/assessment/RatingWorkspace.vue';

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

// Phase status UI mapping
const phaseInfo = computed(() => {
  switch (currentCycle.phase) {
  case 'goal_setting':
    return {
      label: '目标设定中',
      color: 'bg-blue-500',
      description: '当前正在为下属设定本期指标。',
    };
  case 'rating':
    return {
      label: '考评打分中',
      color: 'bg-amber-500',
      description: '各级主管正根据业绩表现进行闭案评分。',
    };
  case 'public_公示':
    return {
      label: '成绩公示中',
      color: 'bg-purple-500',
      description: '评分已完成，正处于异议复核期。',
    };
  case 'finished':
    return {
      label: '已归档',
      color: 'bg-emerald-500',
      description: '本考核周期已正式结束。',
    };
  default:
    return { label: '未开始', color: 'bg-slate-400', description: '等待周期开启。' };
  }
});

// Locking logic for different workspaces
const isGoalSettingLocked = computed(() => currentCycle.phase !== 'goal_setting');
const isRatingLocked = computed(() => currentCycle.phase !== 'rating');
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-50/50 overflow-hidden">
    <!-- Top Header Navigation / Breadcrumb replacement for more space -->
    <header class="bg-white border-b border-slate-200 px-8 py-3 shrink-0 shadow-sm z-20">
      <div class="flex items-center justify-between max-w-full mx-auto">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-3">
            <div class="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center">
              <el-icon class="text-2xl text-white">
                <LayoutDashboard />
              </el-icon>
            </div>
            <div>
              <h1 class="text-2xl font-black text-slate-900 leading-none">
                绩效工作台
              </h1>
              <p class="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                Performance Hall
              </p>
            </div>
          </div>
          
          <div class="h-8 w-px bg-slate-200 hidden md:block" />

          <!-- Current Cycle Quick Info -->
          <div class="hidden lg:flex items-center gap-5 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
            <el-icon class="text-slate-400 text-lg">
              <Calendar />
            </el-icon>
            <div class="flex flex-col text-left">
              <span class="text-sm font-bold text-slate-700 leading-none">{{ currentCycle.title }}</span>
              <span class="text-xs text-slate-400 mt-1">截止时间: {{ currentCycle.expireDate }}</span>
            </div>
            <el-tag
              :color="phaseInfo.color"
              effect="dark"
              class="border-none px-3 font-bold text-xs ml-2 custom-phase-tag"
            >
              {{ phaseInfo.label }}
            </el-tag>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <template v-if="activeTab === 'team_rating' && !isRatingLocked">
            <div class="flex items-center gap-6 mr-1">
              <div class="flex flex-col items-end pt-1">
                <div class="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <span>评分进度: <span class="text-indigo-600">2</span>/5 (40%)</span>
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-200 hidden sm:block" />
                  <span class="hidden sm:inline">剩余时间: <span class="text-slate-700">14:22:05</span></span>
                </div>
                <div class="w-56 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner hidden sm:block">
                  <div class="h-full bg-indigo-600 w-[40%] transition-all" />
                </div>
              </div>
              <el-button
                type="primary"
                class="custom-submit-btn"
              >
                全部提交
              </el-button>
            </div>
          </template>
        </div>
      </div>
    </header>

    <!-- Main Tabs -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <div class="bg-white border-b border-slate-200 px-8 py-0 shrink-0 z-10">
        <el-tabs
          v-model="activeTab"
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
            name="team_goals"
          >
            <template #label>
              <div class="flex items-center gap-2 h-13 relative group">
                <el-icon
                  :size="20"
                  :class="isGoalSettingLocked ? 'text-slate-300' : 'text-slate-400 group-[.is-active]:text-indigo-600'"
                >
                  <Target />
                </el-icon>
                <span class="text-slate-500 group-[.is-active]:text-indigo-600">团队目标设定</span>
                
              </div>
            </template>
          </el-tab-pane>

          <el-tab-pane
            v-if="userRole === 'manager'"
            name="team_rating"
          >
            <template #label>
              <div class="flex items-center gap-2 h-13 relative group">
                <el-icon
                  :size="20"
                  :class="isRatingLocked ? 'text-slate-300' : 'text-slate-400 group-[.is-active]:text-indigo-600'"
                >
                  <Award />
                </el-icon>
                <span :class="isRatingLocked ? 'text-slate-300' : 'text-slate-500 group-[.is-active]:text-indigo-600'">团队绩效评价</span>
                <el-icon
                  v-if="isRatingLocked"
                  class="ml-1 text-slate-300"
                >
                  <Lock />
                </el-icon>
              </div>
            </template>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-hidden relative">
        <MyAssessmentWorkspace v-if="activeTab === 'my_performance'" />
        <TeamGoalWorkspace
          v-else-if="activeTab === 'team_goals'"
          :is-locked="isGoalSettingLocked"
        />
        <RatingWorkspace
          v-else-if="activeTab === 'team_rating'"
          :is-locked="isRatingLocked"
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
            v-if="activeTab !== 'my_performance' && (activeTab === 'team_goals' ? isGoalSettingLocked : isRatingLocked)"
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
