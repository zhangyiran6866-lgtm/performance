<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Save, 
  Send, 
  ChevronLeft,
  Calendar,
  User,
  TrendingUp,
  History,
  ClipboardCheck,
  Database,
  FileText,
  MessageSquare,
  Activity,
  MapPin,
  Clock
} from 'lucide-vue-next';

const router = useRouter();
const activeTab = ref('indicators');

// Mock indicators data
const indicators = ref([
  {
    name: '销售成单额 (元)',
    icon: TrendingUp,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    autoFetch: true,
    source: '财务系统-回款接口',
    value: '45800',
    unit: '元',
    type: 'number'
  },
  {
    name: '新客户拜访数',
    icon: User,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    autoFetch: false,
    source: '手动录入实际拜访数量',
    value: '',
    unit: '个',
    type: 'number'
  },
  {
    name: '客户满意度反馈',
    icon: FileText,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    autoFetch: false,
    source: '根据售后回访记录填报',
    value: '',
    unit: '',
    type: 'text'
  },
  {
    name: '工单处理及时率',
    icon: Activity,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    autoFetch: true,
    source: '运维系统-响应时间接口',
    value: '98.5',
    unit: '%',
    type: 'number'
  }
]);

const fieldRecords = ref([
  {
    startTime: '09:00',
    endTime: '10:30',
    location: '上海华艺进出口有限公司',
    address: '徐汇区虹桥路1号',
    description: '沟通Q2季度采购计划，确认初步意向单。'
  },
  {
    startTime: '11:00',
    endTime: '12:00',
    location: '宜家家居 (徐汇店)',
    address: '徐汇区漕溪路126号',
    description: '日常巡店，检查展位布置及物料库存。'
  },
  {
    startTime: '14:00',
    endTime: '16:30',
    location: '百安居商贸有限公司',
    address: '普陀区真北路1208号',
    description: '新产品推介会，演示了智能家居模块。'
  }
]);

const summary = ref('');

// Mock data - in real app would come from store
const userInfo = {
  name: '李小明',
  id: '00192'
};

const currentDate = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'long'
}).replace(/\//g, '-');

const handleSaveDraft = () => {
  // Logic for saving draft
};

const handleSubmit = () => {
  // Logic for submitting
};
</script>

<template>
  <div class="daily-report-create h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
    <!-- Header Section -->
    <div class="bg-white/70 backdrop-blur-md rounded-[28px] p-6 border border-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
      
      <!-- Left side: Back button + User Info + Time -->
      <div class="flex items-center gap-6">
        <button 
          @click="router.back()" 
          class="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm group"
        >
          <ChevronLeft class="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <div class="h-10 w-px bg-slate-100 hidden md:block"></div>

        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold text-slate-800">填写工作日报</h1>
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[10px] font-bold rounded-md uppercase tracking-wider">Create</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <div class="flex items-center gap-1.5">
              <User class="w-4 h-4 text-slate-400" />
              <span>{{ userInfo.name }} ({{ userInfo.id }})</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Calendar class="w-4 h-4 text-slate-400" />
              <span class="font-medium text-slate-600">{{ currentDate }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: Actions -->
      <div class="flex items-center gap-3 w-full md:w-auto">
        <el-button 
          class="!rounded-2xl !h-12 !px-6 !border-slate-200 !text-slate-600 hover:!bg-slate-50 flex-1 md:flex-none"
          @click="handleSaveDraft"
        >
          <template #icon>
            <Save class="w-4 h-4" />
          </template>
          暂存草稿
        </el-button>
        
        <el-button 
          type="primary" 
          class="!rounded-2xl !h-12 !px-8 !bg-indigo-600 !border-none !shadow-lg !shadow-indigo-100 flex-1 md:flex-none hover:!scale-105 transition-all"
          @click="handleSubmit"
        >
          <template #icon>
            <Send class="w-4 h-4" />
          </template>
          确认提交
        </el-button>
      </div>
    </div>

    <!-- Tabs Section -->
    <div class="custom-tabs-wrapper flex-1 min-h-0 flex flex-col">
      <el-tabs v-model="activeTab" class="report-tabs flex-1 flex flex-col min-h-0">
        <el-tab-pane name="indicators">
          <template #label>
            <div class="flex items-center gap-2 py-1">
              <TrendingUp class="w-4 h-4" />
              <span class="font-bold">绩效指标填报</span>
            </div>
          </template>

          <div class="space-y-6 pt-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <!-- Section Title -->
            <div class="flex items-center justify-between px-2">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <ClipboardCheck class="w-5 h-5" />
                </div>
                <h2 class="text-xl font-bold text-slate-800">关键考核指标</h2>
              </div>
              <span class="px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full uppercase tracking-widest">4 Dimensions</span>
            </div>

            <!-- Indicators List -->
            <div class="grid grid-cols-1 gap-4">
              <div v-for="indicator in indicators" :key="indicator.name" 
                class="indicator-card group">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <!-- Left: Info -->
                  <div class="flex gap-4">
                    <div :class="[indicator.iconBg, 'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110']">
                      <component :is="indicator.icon" :class="['w-6 h-6', indicator.iconColor]" />
                    </div>
                    <div class="space-y-1.5">
                      <div class="flex items-center gap-2">
                        <h3 class="text-lg font-bold text-slate-800">{{ indicator.name }}</h3>
                        <span v-if="indicator.autoFetch" class="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[10px] font-bold rounded-md">接口自动提取</span>
                      </div>
                      <div class="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Database class="w-3.5 h-3.5" />
                        <span>数据来源：{{ indicator.source }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Right: Input/Value -->
                  <div class="md:w-72">
                    <div v-if="indicator.autoFetch" 
                      class="h-16 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 px-6 flex items-center justify-between group-hover:bg-indigo-50 transition-colors">
                      <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Real-time</span>
                      <div class="flex items-baseline gap-1">
                        <span class="text-2xl font-black text-slate-900">{{ indicator.value }}</span>
                        <span class="text-sm font-bold text-slate-400">{{ indicator.unit }}</span>
                      </div>
                    </div>
                    <div v-else class="relative group/input">
                      <el-input 
                        v-model="indicator.value" 
                        :placeholder="'填写 ' + indicator.name"
                        class="custom-indicator-input"
                      >
                        <template #suffix>
                          <component :is="indicator.type === 'number' ? TrendingUp : MessageSquare" class="w-4 h-4 text-slate-300 group-focus-within/input:text-indigo-400 transition-colors" />
                        </template>
                      </el-input>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary & Plans Section -->
            <div class="space-y-4 pb-6 mt-4">
              <div class="flex items-center gap-3 px-2">
                <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <FileText class="w-4 h-4" />
                </div>
                <h3 class="text-lg font-bold text-slate-800">今日工作总结与后续计划</h3>
              </div>
              <el-input
                v-model="summary"
                type="textarea"
                :rows="8"
                placeholder="请详细描述今日工作完成情况、遇到的问题及后续工作重点..."
                class="custom-textarea"
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="tasks">
          <template #label>
            <div class="flex items-center gap-2 py-1">
              <History class="w-4 h-4" />
              <span class="font-bold">计划任务/外勤记录</span>
            </div>
          </template>
          
          <div class="space-y-8 pt-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <!-- Section Header -->
            <div class="flex items-center justify-between px-2">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <Activity class="w-6 h-6" />
                </div>
                <div class="space-y-1">
                  <h2 class="text-2xl font-bold text-slate-800">今日外勤轨迹</h2>
                  <p class="text-xs text-slate-400">自动同步自［计划任务/CRM系统］</p>
                </div>
              </div>
              <div class="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-500 text-[10px] font-bold rounded-lg border border-emerald-100">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                实时同步中
              </div>
            </div>

            <!-- Timeline Section -->
            <div class="relative pl-10 pr-2 pb-10">
              <!-- Vertical Line -->
              <div class="absolute left-[19px] top-4 bottom-0 w-0.5 bg-slate-100"></div>

              <div class="space-y-10">
                <div v-for="(record, index) in fieldRecords" :key="index" class="relative">
                  <!-- Timeline Node -->
                  <div class="absolute -left-[31px] top-6 w-5 h-5 rounded-full border-4 border-white bg-indigo-500 shadow-sm z-10 ring-4 ring-slate-50"></div>
                  
                  <!-- Card -->
                  <div class="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                      <div class="flex items-center gap-4">
                        <div class="px-3 py-1 bg-indigo-50 text-indigo-500 text-xs font-bold rounded-lg flex items-center gap-1.5">
                          <Clock class="w-3.5 h-3.5" />
                          {{ record.startTime }} - {{ record.endTime }}
                        </div>
                        <h3 class="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{{ record.location }}</h3>
                      </div>
                      
                      <div class="flex items-center gap-1.5 text-slate-400 text-sm">
                        <MapPin class="w-4 h-4" />
                        <span>{{ record.address }}</span>
                      </div>
                    </div>

                    <div class="bg-slate-50/50 rounded-2xl p-4 flex items-start gap-3 border border-slate-100/50">
                      <FileText class="w-4 h-4 text-slate-300 mt-0.5" />
                      <p class="text-slate-500 text-sm leading-relaxed">{{ record.description }}</p>
                    </div>
                  </div>
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
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

:deep(.el-button) {
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Tabs Styling */
.custom-tabs-wrapper {
  background: white;
  padding: 16px;
  border-radius: 32px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.02);
}

:deep(.report-tabs .el-tabs__header) {
  margin-bottom: 0;
  border-bottom: none;
}

:deep(.report-tabs .el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.report-tabs .el-tabs__nav) {
  padding: 4px;
}

:deep(.report-tabs .el-tabs__item) {
  height: 48px;
  padding: 0 32px;
  border-radius: 20px;
  font-size: 0.95rem;
  transition: all 0.3s;
  color: #64748b;
}

:deep(.report-tabs .el-tabs__item.is-active) {
  background-color: #f8faff;
  color: #4f46e5;
}

:deep(.report-tabs .el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px;
  background-color: #4f46e5;
  bottom: 4px;
}

/* Indicator Card Styling */
.indicator-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #f1f5f9;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.indicator-card:hover {
  border-color: #e2e8f0;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.04);
  transform: translateY(-2px);
}

/* Input Styling */
:deep(.custom-indicator-input .el-input__wrapper) {
  border-radius: 16px;
  height: 56px;
  background-color: #f8fafc;
  box-shadow: none !important;
  border: 1.5px solid #f1f5f9;
  padding: 0 20px;
  transition: all 0.3s;
}

:deep(.custom-indicator-input .el-input__wrapper:hover) {
  border-color: #e2e8f0;
  background-color: #f1f5f9;
}

:deep(.custom-indicator-input .el-input__wrapper.is-focus) {
  background-color: white;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
}

:deep(.custom-indicator-input .el-input__inner) {
  font-weight: 600;
  color: #1e293b;
}

:deep(.custom-indicator-input .el-input__inner::placeholder) {
  color: #94a3b8;
  font-weight: 500;
}

/* Textarea Styling */
:deep(.custom-textarea .el-textarea__inner) {
  border-radius: 20px;
  padding: 16px 20px;
  background-color: #f8fafc;
  border: 1.5px solid #f1f5f9;
  box-shadow: none !important;
  font-family: inherit;
  font-size: 0.95rem;
  color: #1e293b;
  transition: all 0.3s;
  resize: none;
}

:deep(.custom-textarea .el-textarea__inner:hover) {
  border-color: #e2e8f0;
  background-color: #f1f5f9;
}

:deep(.custom-textarea .el-textarea__inner:focus) {
  background-color: white;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
}
</style>
