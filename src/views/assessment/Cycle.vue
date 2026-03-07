<script setup lang="ts">
import { ref } from 'vue';
import {
  CalendarDays,
  Clock,
  PlayCircle,
  Eye,
  ChevronRight,
  CheckCircle2,
  Info,
  BarChart3,
  CalendarClock,
  AlertTriangle,
  Rocket,
  TrendingUp,
  Archive,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ========== Mock Data ==========

// Cycles data
const initialCycles = [
  {
    id: 'cyc-202604',
    name: '2026年4月份全公司月度绩效考核',
    period: '2026/04/01 - 2026/04/30',
    stage: 'unknown',
    templateNames: ['大客KA中心通用考核模板'],
    totalEmployees: 45,
    targetSetCount: 0,
    targetConfirmedCount: 0,
  },
  {
    id: 'cyc-202603',
    name: '2026年3月份全公司月度绩效考核',
    period: '2026/03/01 - 2026/03/31',
    stage: 'goal_setting',
    templateNames: [
      '大客KA中心通用考核模板',
      '餐饮中心业务专员月度考核表',
      '市场部月度推广定性考评',
      '休食中心日常绩效考核标准',
    ],
    totalEmployees: 45,
    targetSetCount: 12,
    targetConfirmedCount: 0,
  },
  {
    id: 'cyc-202602',
    name: '2026年2月份业务部门月度考核',
    period: '2026/02/01 - 2026/02/28',
    stage: 'evaluating',
    templateNames: ['大客KA中心通用考核模板', '餐饮中心业务专员月度考核表', '市场部月度推广定性考评'],
    totalEmployees: 42,
    targetSetCount: 42,
    targetConfirmedCount: 42,
  },
  {
    id: 'cyc-202601',
    name: '2026年1月份销售条线考核',
    period: '2026/01/01 - 2026/01/31',
    stage: 'finished',
    templateNames: ['大客KA中心通用考核模板', '餐饮中心业务专员月度考核表'],
    totalEmployees: 40,
    targetSetCount: 40,
    targetConfirmedCount: 40,
  },
];

const cycles = ref(initialCycles);

const getStageBadge = (stage: string) => {
  switch (stage) {
  case 'goal_setting':
    return { text: '目标制定中', class: 'bg-amber-50 text-amber-600 border-amber-200' };
  case 'goal_confirming':
    return { text: '员工确认中', class: 'bg-blue-50 text-blue-600 border-blue-200' };
  case 'ongoing':
    return { text: '正在执行', class: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
  case 'evaluating':
    return { text: '结果评估与打分中', class: 'bg-purple-50 text-purple-600 border-purple-200' };
  case 'finished':
    return { text: '已归档结案', class: 'bg-slate-50 text-slate-500 border-slate-200' };
  case 'unknown':
    return { text: '未开启', class: 'bg-slate-50 text-slate-500 border-slate-200' };
  default:
    return { text: '状态异常', class: 'bg-red-50 text-red-500 border-red-200' };
  }
};

const showGoalDialog = ref(false);
const showEvalDialog = ref(false);
const showFinishDialog = ref(false);
const pendingCycleId = ref('');

const openGoalDialog = (id: string) => {
  pendingCycleId.value = id;
  showGoalDialog.value = true;
};

const confirmGoalStage = () => {
  if (pendingCycleId.value) {
    handlePushStage(pendingCycleId.value, 'goal_setting');
    showGoalDialog.value = false;
    pendingCycleId.value = '';
  }
};

const openEvalDialog = (id: string) => {
  pendingCycleId.value = id;
  showEvalDialog.value = true;
};

const confirmEvalStage = () => {
  if (pendingCycleId.value) {
    handlePushStage(pendingCycleId.value, 'evaluating');
    showEvalDialog.value = false;
    pendingCycleId.value = '';
  }
};

const openFinishDialog = (id: string) => {
  pendingCycleId.value = id;
  showFinishDialog.value = true;
};

const confirmFinishStage = () => {
  if (pendingCycleId.value) {
    handlePushStage(pendingCycleId.value, 'finished');
    showFinishDialog.value = false;
    pendingCycleId.value = '';
  }
};

const handlePushStage = (id: string, newStage: string) => {
  cycles.value = cycles.value.map((c) => (c.id === id ? { ...c, stage: newStage } : c));
};
</script>

<template>
  <div class="h-full flex flex-col space-y-6 overflow-hidden">
    <!-- Header: 去掉滚动、毛玻璃和背景 -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
      <div class="flex items-center gap-4">
        <div class="bg-indigo-50 p-3 rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-center">
          <CalendarClock class="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 class="text-3xl font-black tracking-tight text-slate-900">
            绩效考核周期管理
          </h1>
          <p class="text-base text-slate-500">
            HR 工作台：在此处向组织派发新的考核模板并开启一个考评周期
          </p>
        </div>
      </div>
    </div>

    <!-- Scrollable Content Area: 仅滚动下方内容 -->
    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20">
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays class="w-5 h-5 text-emerald-500" />
          考核周期实例
        </h2>

        <div
          class="flex items-center gap-2 text-xs md:text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100"
        >
          <Info class="w-4 h-4 shrink-0" />
          每月25日系统将自动生成下一考核周期的实例，并绑定当前全部生效模板
        </div>
      </div>

      <div class="grid gap-4">
        <Card
          v-for="cycle in cycles"
          :key="cycle.id"
          :class="[
            'shadow-sm overflow-hidden border-l-4 transition-all',
            cycle.stage === 'goal_setting' ? 'border-l-amber-500 bg-amber-50/10' : 'border-l-slate-200',
          ]"
        >
          <CardContent class="p-0">
            <div class="flex flex-col lg:flex-row">
              <!-- Left Main Info -->
              <div class="flex-1 py-4 px-6 border-b lg:border-b-0 lg:border-r border-slate-100">
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3
                      class="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors"
                    >
                      {{ cycle.name }}
                    </h3>
                    <div
                      class="flex flex-col md:flex-row md:items-center gap-y-2 gap-x-6 mt-3 text-sm text-slate-500"
                    >
                      <div class="flex items-center text-slate-600 font-medium">
                        <CalendarDays class="mr-1.5 h-4 w-4 text-slate-400" />
                        {{ cycle.period }}
                      </div>
                      <div class="flex items-start">
                        <Clock class="mr-1.5 h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span class="text-slate-500">
                            包含 {{ cycle.templateNames.length }} 个考核模板:
                          </span>
                          <p
                            class="text-xs text-slate-700 font-medium line-clamp-1 mt-0.5"
                            :title="cycle.templateNames.join(', ')"
                          >
                            {{ cycle.templateNames.join(', ') }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    :class="getStageBadge(cycle.stage).class"
                  >
                    {{ getStageBadge(cycle.stage).text }}
                  </Badge>
                </div>

                <!-- Sub Progress if in goal setting -->
                <div
                  v-if="cycle.stage === 'goal_setting'"
                  class="mt-4 bg-slate-50 rounded-lg p-4 border border-slate-100"
                >
                  <div class="flex justify-between text-sm mb-2">
                    <span class="font-medium text-slate-700">主管下发目标进度</span>
                    <span class="text-slate-500">
                      {{ cycle.targetSetCount }} / {{ cycle.totalEmployees }} 人
                    </span>
                  </div>
                  <div class="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-blue-500 rounded-full transition-all duration-500"
                      :style="{ width: `${(cycle.targetSetCount / cycle.totalEmployees) * 100}%` }"
                    />
                  </div>
                  <div
                    class="mt-3 text-xs text-amber-600 flex items-center bg-amber-50 px-2 py-1 rounded-md max-w-max border border-amber-100"
                  >
                    ⚠️ 请催促未下发的主管尽快完成员工本月的基数与权重设定。
                  </div>
                </div>
              </div>

              <!-- Right Actions Area -->
              <div
                class="w-full lg:w-48 bg-slate-50/50 py-4 px-6 flex flex-row lg:flex-col items-center justify-center gap-3"
              >
                <!-- 非已归档状态才显示“查看周期详情”按钮 -->
                <template v-if="cycle.stage !== 'finished'">
                  <Button
                    variant="outline"
                    class="w-full bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
                    as-child
                  >
                    <RouterLink :to="`/assessment/cycle/${cycle.id}/stats`">
                      <Eye class="mr-2 h-4 w-4 text-slate-400" />
                      查看周期详情
                    </RouterLink>
                  </Button>
                </template>

                <template v-if="cycle.stage === 'unknown'">
                  <Button
                    variant="outline"
                    class="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100 shadow-sm"
                    @click="openGoalDialog(cycle.id)"
                  >
                    <Rocket class="mr-2 h-4 w-4" />
                    开启目标设定
                  </Button>
                </template>

                <template v-else-if="cycle.stage === 'goal_setting'">
                  <Button
                    variant="outline"
                    class="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-100 shadow-sm"
                    @click="openEvalDialog(cycle.id)"
                  >
                    <TrendingUp class="mr-2 h-4 w-4" />
                    开启绩效打分
                  </Button>
                </template>

                <template v-else-if="cycle.stage === 'evaluating'">
                  <Button
                    variant="outline"
                    class="w-full bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-100 shadow-sm"
                    @click="openFinishDialog(cycle.id)"
                  >
                    <Archive class="mr-2 h-4 w-4" />
                    关闭本周期
                  </Button>
                </template>

                <template v-else-if="cycle.stage === 'finished'">
                  <Button
                    variant="outline"
                    class="w-full bg-white hover:bg-slate-50 text-emerald-600 border-emerald-100 shadow-sm"
                    as-child
                  >
                    <RouterLink :to="`/assessment/cycle/${cycle.id}/stats`">
                      <BarChart3 class="mr-2 h-4 w-4 text-emerald-500" />
                      查看绩效结果
                    </RouterLink>
                  </Button>
                </template>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- 确认开启目标设定弹窗 -->
    <el-dialog
      v-model="showGoalDialog"
      title="开启目标设定"
      width="480px"
      append-to-body
      class="custom-dialog"
      :show-close="true"
      align-center
    >
      <div class="flex items-start gap-4 py-2">
        <div class="bg-amber-100 p-2.5 rounded-full shrink-0 mt-1">
          <AlertTriangle class="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <p class="text-[15px] text-slate-600 leading-relaxed font-medium">
            确定要进入目标设定阶段吗？开启后，各级主管将收到通知并开始为下属设定本月指标及权重。
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            class="rounded-full px-8 bg-blue-50/50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:text-blue-700"
            @click="showGoalDialog = false"
          >
            取消
          </Button>
          <Button
            class="rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
            @click="confirmGoalStage"
          >
            立即开启
          </Button>
        </div>
      </template>
    </el-dialog>

    <!-- 确认开启绩效打分弹窗 -->
    <el-dialog
      v-model="showEvalDialog"
      title="开启绩效打分"
      width="480px"
      append-to-body
      class="custom-dialog"
      :show-close="true"
      align-center
    >
      <div class="flex items-start gap-4 py-2">
        <div class="bg-emerald-100 p-2.5 rounded-full shrink-0 mt-1">
          <CheckCircle2 class="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <p class="text-[15px] text-slate-600 leading-relaxed font-medium">
            确定要进入绩效打分阶段吗？开启后，系统将正式根据业务数据初算得分，并开放主管主观评价入口。
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            class="rounded-full px-8 bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-700"
            @click="showEvalDialog = false"
          >
            取消
          </Button>
          <Button
            class="rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
            @click="confirmEvalStage"
          >
            进入考核
          </Button>
        </div>
      </template>
    </el-dialog>

    <!-- 确认关闭本周期弹窗 -->
    <el-dialog
      v-model="showFinishDialog"
      title="关闭本周期"
      width="480px"
      append-to-body
      class="custom-dialog"
      :show-close="true"
      align-center
    >
      <div class="flex items-start gap-4 py-2">
        <div class="bg-slate-100 p-2.5 rounded-full shrink-0 mt-1">
          <Info class="h-6 w-6 text-slate-500" />
        </div>
        <div>
          <p class="text-[15px] text-slate-600 leading-relaxed font-medium">
            确定要关闭并归档本考核周期吗？关闭后，所有评分将正式锁定，不可再进行修改，仅供后续查阅。
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            class="rounded-full px-8 bg-blue-50/50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:text-blue-700"
            @click="showFinishDialog = false"
          >
            取消
          </Button>
          <Button
            class="rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
            @click="confirmFinishStage"
          >
            确认归档
          </Button>
        </div>
      </template>
    </el-dialog>
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
  background: #e2e8f0;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

:deep(.custom-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.custom-dialog .el-dialog__header) {
  margin-right: 0;
  padding-bottom: 0;
}

:deep(.custom-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}
</style>
