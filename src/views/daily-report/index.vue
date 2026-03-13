<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  AlertCircle, 
  TrendingUp,
  ClipboardList
} from 'lucide-vue-next';

const router = useRouter();

interface ReportRecord {
  id: string;
  date: string;
  displayDate: string;
  weekday: string;
  status: 'submitted' | 'pending' | 'draft';
  content: string;
  indicators: {
    color: string;
  }[];
  score: number;
}

const stats = ref([
  {
    title: '本月已提交',
    value: '3',
    total: '22',
    unit: '天',
    progress: 13.6,
    icon: ClipboardList,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500'
  },
  {
    title: '待补填日期',
    value: '1',
    unit: 'Days',
    hint: '尽快补齐日报，避免影响权重指标计算。',
    icon: AlertCircle,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500'
  },
  {
    title: '本月指标平均达成',
    value: '82.4',
    unit: '%',
    hint: '数据来源于每日系统接口初算均值。',
    icon: TrendingUp,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500'
  }
]);

const records = ref<ReportRecord[]>([
  {
    id: '1',
    date: '03-10',
    displayDate: '2026-03-10',
    weekday: '周二',
    status: 'submitted',
    content: '今日完成了KA大客户的巡店，并对接了新产品的上架事宜，整体进度符合预期。',
    indicators: [
      { color: 'bg-yellow-200' },
      { color: 'bg-emerald-200' },
      { color: 'bg-blue-100' }
    ],
    score: 88.5
  },
  {
    id: '2',
    date: '03-09',
    displayDate: '2026-03-09',
    weekday: '周一',
    status: 'submitted',
    content: '处理了三起客户投诉，其中一起较为复杂，已反馈至品质部处理。',
    indicators: [
      { color: 'bg-yellow-200' },
      { color: 'bg-emerald-200' },
      { color: 'bg-blue-100' }
    ],
    score: 88.5
  },
  {
    id: '3',
    date: '03-08',
    displayDate: '2026-03-08',
    weekday: '周日',
    status: 'pending',
    content: '该日期暂无日报数据，点击立即补填今日绩效表现。',
    indicators: [],
    score: 0
  }
]);

const searchQuery = ref('');

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
</script>

<template>
  <div class="daily-report-container space-y-6 animate-in fade-in duration-500">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
      <div class="flex items-center gap-4">
        <div class="bg-indigo-50 p-3 rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-center">
          <ClipboardList class="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight text-slate-900">
            我的工作日报
          </h1>
          <div class="flex items-center gap-2 mt-1">
            <p class="text-base text-slate-500">
              李小明 (00192) · 2026年3月份考核周期进行中
            </p>
          </div>
        </div>
      </div>
      
      <el-button 
        type="primary" 
        size="large" 
        class="!rounded-2xl !h-12 !px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 border-none transition-all hover:scale-105"
        @click="router.push('/daily-report/create')"
      >
        <template #icon>
          <Plus class="w-5 h-5" />
        </template>
        填写今日日报
      </el-button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="(stat, index) in stats" :key="index" 
        class="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div class="flex justify-between">
          <div class="space-y-4 flex-1">
            <span class="text-sm font-medium text-slate-500">{{ stat.title }}</span>
            <div class="flex items-baseline gap-2">
              <span class="text-4xl font-bold text-slate-900">{{ stat.value }}</span>
              <span v-if="stat.total" class="text-lg text-slate-400">/ {{ stat.total }}</span>
              <span class="text-sm font-medium text-slate-400 ml-1">{{ stat.unit }}</span>
            </div>
            
            <!-- Progress for the first card -->
            <div v-if="stat.progress !== undefined" class="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
              <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000" :style="{ width: `${stat.progress}%` }"></div>
            </div>
            
            <!-- Hint for other cards -->
            <p v-if="stat.hint" class="text-xs text-slate-400 leading-relaxed mt-2" 
               :class="stat.title === '待补填日期' ? 'text-orange-500/80' : 'text-emerald-500/80'">
              {{ stat.hint }}
            </p>
          </div>

          <div :class="[stat.iconBg, 'p-4 rounded-2xl h-fit transition-transform group-hover:scale-110']">
            <component :is="stat.icon" :class="['w-6 h-6', stat.iconColor]" />
          </div>
        </div>
        
        <!-- Decorative Circle for the first card -->
        <div v-if="index === 0" class="absolute -right-4 -bottom-4 w-24 h-24 border-[12px] border-slate-50 rounded-full pointer-events-none opacity-50"></div>
      </div>
    </div>

    <!-- History Header -->
    <div class="flex items-center justify-between ">
      <div class="flex items-center gap-2">
        <ClipboardList class="w-5 h-5 text-slate-400" />
        <h2 class="text-lg font-bold text-slate-800">历史填报记录</h2>
      </div>
      
      <div class="relative w-72">
        <el-input
          v-model="searchQuery"
          placeholder="搜索日期或内容..."
          class="!rounded-full custom-search"
        >
          <template #prefix>
            <Search class="w-4 h-4 text-slate-400" />
          </template>
        </el-input>
      </div>
    </div>

    <!-- Records List -->
    <div class="space-y-3 mt-3">
      <div v-for="record in records" :key="record.id" 
        class="bg-white p-5 rounded-[24px] border border-slate-50 shadow-sm hover:shadow-md transition-all group cursor-pointer flex items-center gap-6">
        
        <!-- Date Badge -->
        <div :class="[
          'shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-colors',
          record.status === 'pending' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
        ]">
          <span class="text-xs font-medium opacity-70">{{ record.date.split('-')[0] }}月</span>
          <span class="text-2xl font-bold">{{ record.date.split('-')[1] }}</span>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 space-y-2">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-bold text-slate-800">{{ record.displayDate }} ({{ record.weekday }})</h3>
            <el-tag 
              :type="getStatusType(record.status)" 
              effect="light" 
              class="!rounded-lg !border-none !px-2 !h-6 !text-[12px] font-medium"
              :class="{
                'bg-emerald-50 text-emerald-600': record.status === 'submitted',
                'bg-orange-50 text-orange-500': record.status === 'pending'
              }"
            >
              {{ getStatusLabel(record.status) }}
            </el-tag>
          </div>
          <p class="text-slate-500 truncate pr-4 text-sm">{{ record.content }}</p>
        </div>

        <!-- Indicators and Score -->
        <div class="flex items-center gap-6 shrink-0">
          <div v-if="record.indicators.length > 0" class="flex flex-col items-end gap-1">
            <span class="text-[10px] text-slate-400 font-medium">填报指标项</span>
            <div class="flex items-center -space-x-1">
              <div v-for="(ind, i) in record.indicators" :key="i" 
                :class="[ind.color, 'w-6 h-6 rounded-full border-2 border-white']"></div>
              <div class="w-6 h-6 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center">
                <span class="text-[10px] text-slate-400">+2</span>
              </div>
            </div>
          </div>

          <div v-if="record.score > 0" class="flex flex-col items-center justify-center bg-blue-50/50 px-4 py-2 rounded-2xl border border-blue-100/50">
             <span class="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Score</span>
             <span class="text-xl font-bold text-blue-600">{{ record.score }}</span>
          </div>

          <div class="p-2 rounded-xl bg-slate-50 group-hover:bg-indigo-50 transition-colors">
            <ChevronRight class="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.daily-report-container {
  width: 100%;
}

:deep(.custom-search .el-input__wrapper) {
  border-radius: 99px;
  background-color: #f8fafc;
  box-shadow: none !important;
  border: 1px solid #e2e8f0;
  padding: 0 16px;
  height: 48px;
}

:deep(.custom-search .el-input__wrapper:hover) {
  border-color: #cbd5e1;
}

:deep(.custom-search .el-input__wrapper.is-focus) {
  background-color: white;
  border-color: #6366f1;
}
</style>
