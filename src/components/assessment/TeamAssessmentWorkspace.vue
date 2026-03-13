<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Calendar, Clock, Edit, TrendCharts, Notebook } from '@element-plus/icons-vue';
import { getDepartmentPerformance, type PerformanceCycleRespVO } from '@/api/deptWorkbench';
import { useUserStore } from '@/store/modules/user';
import { useCache } from '@/hooks/web/useCache';

defineEmits(['switch-tab']);

// ========== State & Data ==========
const teamCycleList = ref<PerformanceCycleRespVO[]>([]);
const loading = ref(false);
const total = ref(0);
const currentDeptName = ref('-');
const userStore = useUserStore();
const queryParams = ref({
  pageNo: 1,
  pageSize: 20,
});

// Fetch data from API
const fetchList = async () => {
  try {
    loading.value = true;

    // 从 Store 获取，或手动解析 localStorage (fallback)
    let finalDeptId: any = userStore.getUser?.deptId;
    let finalDeptName: any = userStore.getUser?.deptName;
    
    if (!finalDeptId || finalDeptId === 0) {
      try {
        const { wsCache } = useCache();
        const userInfo: any = wsCache.get('user');
        if (userInfo) {
          const userData = userInfo.user || userInfo;
          finalDeptId = userData.deptId || userData.dept_id || '';
          finalDeptName = userData.deptName || userData.dept_name || '';
        } else {
          // Additional fallback for old system habits
          const oldUserInfo = localStorage.getItem('USER_INFO');
          if (oldUserInfo) {
            const parsed = JSON.parse(oldUserInfo);
            const data = parsed?.user || parsed;
            finalDeptId = data?.deptId || data?.dept_id || '';
            finalDeptName = data?.deptName || data?.dept_name || '';
          }
        }
      } catch (e) {
        console.error('Fetch user cache failed:', e);
      }
    }

    currentDeptName.value = finalDeptName || '-';

    const res: any = await getDepartmentPerformance({
        ...queryParams.value,
        deptId: String(finalDeptId || '')
    } as any);
    if (res.code === 0) {
      teamCycleList.value = res.data.list || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error('Fetch team performance failed:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchList();
});

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
  <div class="h-full flex flex-col bg-slate-50/30 overflow-hidden">
    <!-- Cycle List View -->
    <div v-loading="loading" class="flex-1 py-5 space-y-6 overflow-y-auto custom-scrollbar">
      <div class="mx-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h2 class="text-2xl font-black tracking-tight text-slate-900">
          团队考核目标与结果
        </h2>
        <p class="text-sm text-slate-500 mt-1">
          <span class="font-bold text-slate-600">管理部门：{{ currentDeptName }}</span> · 查阅您管理的团队参与的所有考核周期的目标与最终评价结果
        </p>
      </div>

      <div class="grid gap-4">
        <el-card
          v-for="cycle in teamCycleList"
          :key="cycle.id"
          shadow="hover"
          class="custom-card-container border-slate-200 !rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 group"
        >
          <div
            class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div class="flex items-center gap-4 min-w-0">
              <div class="h-14 w-14 rounded-2xl flex flex-col items-center justify-center font-bold leading-tight shrink-0 bg-indigo-50 text-indigo-600">
                <el-icon :size="24">
                  <Calendar />
                </el-icon>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-3 flex-wrap">
                  <h3 class="text-lg font-black text-slate-800 truncate">
                    {{ cycle.name }}
                  </h3>
                  <el-tag
                    v-if="cycle.stage"
                    :type="cycle.stage === 'ARCHIVED' ? 'info' : (cycle.stage === 'RATING' ? 'warning' : 'success')"
                    effect="light"
                    size="small"
                    class="custom-tag"
                  >
                    {{ cycle.stage === 'GOAL_SETTING' ? '目标设定' : (cycle.stage === 'PUBLISHED' ? '待签署' : (cycle.stage === 'RATING' ? '打分中' : '已归档')) }}
                  </el-tag>
                </div>
                <div class="flex flex-col gap-1 mt-1">
                  <p class="text-sm text-slate-400 flex items-center gap-1.5">
                    <el-icon class="text-indigo-400"><Notebook /></el-icon>
                    考核方案：<span class="text-slate-600 font-medium">{{ cycle.templateName || '通用考核模板' }} ({{ cycle.templateCount }}个模板)</span>
                  </p>
                  <p class="text-xs text-slate-500 flex items-center gap-1">
                    <el-icon><Clock /></el-icon> {{ formatDate(cycle.startDate) }} ~ {{ formatDate(cycle.endDate) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-6 shrink-0 px-2 lg:px-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 mt-1 lg:mt-0">
              <!-- <div class="hidden md:flex items-center gap-4 mr-2">
                <div class="text-right">
                  <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">已签署</div>
                  <div class="text-lg font-black text-slate-800 leading-none">{{ cycle.signedCount }}/{{ cycle.totalCount }}</div>
                </div>
                <el-progress 
                  type="circle" 
                  :percentage="Math.round((cycle.signedCount || 0) / (cycle.totalCount || 1) * 100)" 
                  :width="36"
                  :stroke-width="4"
                  color="#6366f1"
                  :show-text="false"
                />
              </div> -->
              <div class="flex items-center gap-3">
                <el-button 
                  type="primary" 
                  plain 
                  class="custom-action-btn"
                  @click="$emit('switch-tab', 'team_goals')"
                >
                  <template #icon>
                    <el-icon><Edit /></el-icon>
                  </template>
                  团队目标设定
                </el-button>
                <el-button 
                  type="success" 
                  plain 
                  class="custom-action-btn"
                  @click="$emit('switch-tab', 'team_rating')"
                >
                  <template #icon>
                    <el-icon><TrendCharts /></el-icon>
                  </template>
                  团队绩效评价
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
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

.custom-card-container {
  transition: all 0.3s;
}
.custom-card-container:hover {
  border-color: #e2e8f0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.custom-action-btn {
  border-radius: 12px;
  font-weight: 700;
  height: 40px;
  padding: 0 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
</style>
