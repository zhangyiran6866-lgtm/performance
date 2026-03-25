<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { FileText, Database, Calculator, Pencil, Check, X, TrendingUp, Package, Target, BarChart3, Wallet, Users, Timer, Settings } from 'lucide-vue-next';
import { getDictLabel } from '@/utils/dict';
import { createDailyTemplate } from '@/api/daily';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  isOpen: boolean
  indicators: any[]
  templateId?: string | number
}>();

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
  (e: 'update:isOpen', value: boolean): void
  (e: 'updateIndicator', ind: any): void
}>();

const getDimensionStyles = (dimension: string) => {
  const d = dimension?.trim();
  if (d === '销售业绩') return { tag: 'bg-rose-50 text-rose-600 border-rose-100', icon: TrendingUp };
  if (d === '产品力') return { tag: 'bg-orange-50 text-orange-600 border-orange-100', icon: Package };
  if (d === '市场指标') return { tag: 'bg-blue-50 text-blue-600 border-blue-100', icon: Target };
  if (d === '渠道力') return { tag: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: BarChart3 };
  if (d === '费用管理') return { tag: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: Wallet };
  if (d === '组织力') return { tag: 'bg-purple-50 text-purple-600 border-purple-100', icon: Users };
  if (d === '行动计划') return { tag: 'bg-cyan-50 text-cyan-600 border-cyan-100', icon: Timer };
  return { tag: 'bg-slate-50 text-slate-600 border-slate-200', icon: Settings };
};

const internalOpen = computed({
  get: () => props.isOpen,
  set: (val) => emit('update:isOpen', val),
});

// Editing state
const editingId = ref<string | null>(null);
const editName = ref('');
const isSaving = ref(false);

const startEdit = (ind: any) => {
  editingId.value = ind.id;
  editName.value = ind.indicatorAlias || ind.name;
};

const cancelEdit = () => {
  editingId.value = null;
  editName.value = '';
};

const saveEdit = async (ind: any) => {
  if (!editName.value.trim()) {
    ElMessage.warning('请输入名称');
    return;
  }

  if (!props.templateId) {
    ElMessage.error('找不到模板ID');
    return;
  }

  isSaving.value = true;
  try {
    // 构造接口请求数据
    const items = props.indicators.map(item => {
      const isCurrent = item.id === ind.id;
      return {
        indicatorId: Number(item.id),
        indicatorName: item.name,
        indicatorAlias: isCurrent ? editName.value : (item.indicatorAlias || item.name),
        templateItemId: item.templateItemId || 0,
      };
    });

    await createDailyTemplate({
      templateId: Number(props.templateId),
      items,
    });

    // 通知父组件更新，而不是直接修改 prop
    emit('updateIndicator', { ...ind, indicatorAlias: editName.value });
    
    ElMessage.success('保存成功');
    editingId.value = null;
  } catch (error: any) {
    console.error('Save failed:', error);
    ElMessage.error(error?.message || '保存失败');
  } finally {
    isSaving.value = false;
  }
};

const handleConfirm = async () => {
  if (!props.templateId) {
    emit('confirm');
    return;
  }

  isSaving.value = true;
  try {
    const items = props.indicators.map(item => ({
      indicatorId: Number(item.id),
      indicatorName: item.name,
      indicatorAlias: item.indicatorAlias || item.name,
      templateItemId: item.templateItemId || 0,
    }));

    await createDailyTemplate({
      templateId: Number(props.templateId),
      items,
    });
    
    emit('confirm');
  } catch (error: any) {
    console.error('Final confirm save failed:', error);
    ElMessage.error(error?.message || '日报确认保存失败');
  } finally {
    isSaving.value = false;
  }
};

const getMockValues = (i: number) => {
  const mockAchieved = i === 0 ? 24500 : i === 2 ? 1 : 450;
  const mockTarget = i === 0 ? 50000 : i === 2 ? 0 : 500;
  const progressPercent = Math.min(
    100,
    Math.max(0, (mockAchieved / (mockTarget || 1)) * 100),
  );
  return { mockAchieved, mockTarget, progressPercent };
};

const currentDate = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
});

// Close resetting
watch(() => props.isOpen, (val) => {
  if (!val) {
    cancelEdit();
  }
});
</script>

<template>
  <Dialog v-model:open="internalOpen">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>员工日报填报预览</DialogTitle>
        <DialogDescription>
          以下是根据您当前模板配置，员工在提交每日日志时看到的待办数据呈现。
        </DialogDescription>
      </DialogHeader>

      <ScrollArea class="h-[500px] mt-2 rounded-md border p-6 bg-slate-50/50">
        <div class="space-y-6">
          <!-- Fake Context Header -->
          <div class="flex justify-between items-center pb-2 border-b border-slate-200">
            <span class="text-sm font-semibold text-slate-800">{{ currentDate }} 日报</span>
            <Badge
              variant="outline"
              class="bg-blue-50 text-blue-600"
            >
              待提交
            </Badge>
          </div>

          <div
            v-if="indicators.length === 0"
            class="text-center py-10 text-xs text-slate-400"
          >
            模板当前没有任何指标
          </div>
          <div
            v-else
            class="space-y-4"
          >
            <div
              v-for="(ind, i) in indicators"
              :key="ind.id"
              class="bg-white border md:p-5 p-2 rounded-xl shadow-sm space-y-4"
            >
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2 flex-1 mr-4">
                  <FileText
                    v-if="ind.dataSourceType === 'complete'"
                    class="h-4 w-4 text-emerald-500 shrink-0"
                  />
                  <Database
                    v-else
                    class="h-4 w-4 text-blue-500 shrink-0"
                  />
                  
                  <div v-if="editingId === ind.id" class="flex items-center gap-2 flex-1">
                    <Input 
                      v-model="editName" 
                      class="h-8 text-sm" 
                      placeholder="输入指标别名"
                      @keyup.enter="saveEdit(ind)"
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      class="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                      :disabled="isSaving"
                      @click="saveEdit(ind)"
                    >
                      <Check class="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      class="h-8 w-8 text-red-600 hover:bg-red-50"
                      :disabled="isSaving"
                      @click="cancelEdit"
                    >
                      <X class="h-4 w-4" />
                    </Button>
                  </div>
                  <div v-else class="flex items-center gap-2 group cursor-pointer hover:text-blue-600 transition-colors" @click="startEdit(ind)">
                    <div class="flex flex-col gap-1.5">
                      <Label class="text-sm font-bold text-slate-800 cursor-pointer group-hover:text-blue-600">
                        {{ ind.indicatorAlias || ind.name }}
                      </Label>
                      <div class="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          :class="['font-bold h-4 px-1.5 text-[10px] flex items-center gap-1 border', getDimensionStyles(ind.dimension).tag]"
                        >
                          <component :is="getDimensionStyles(ind.dimension).icon" class="h-2.5 w-2.5" />
                          {{ ind.dimension }}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      class="h-6 w-6 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Pencil class="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  class="bg-blue-50 text-blue-600 border-blue-200 font-normal shadow-sm"
                >
                  {{ ind.dataSourceType === 'system' ? "系统接口预置" : "员工手动填报" }}
                </Badge>
              </div>

              <!-- 绩效得分转化规则描述 -->
              <div class="space-y-1.5 pt-1">
                <div class="flex items-center gap-2 text-slate-700 font-bold text-[13px]">
                  <Calculator class="h-4 w-4 text-emerald-500" />
                  绩效得分转化规则: {{ ind.ruleType || '线性增长模型' }}
                </div>
                <p class="text-[12px] text-slate-500/80 leading-relaxed pl-6 italic">
                  指标描述：{{ ind.indicatorRuleDescription || '暂无规则描述' }}
                </p>
              </div>

              <!-- Achievement Simulation Section -->
              <div class="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/40">
                <div class="flex justify-between items-end">
                  <div>
                    <div class="flex items-center gap-1.5 mb-1.5">
                      <p class="text-[13px] text-slate-400 font-medium uppercase tracking-tight">
                        指标达成进度预览 (本考核周期)
                      </p>
                      <Badge variant="outline" class="h-4.5 px-1.5 text-[12px] bg-white border-slate-200 text-slate-500 font-normal">
                        {{ ind.dataSourceType === 'system' ? getDictLabel('system_performance_filling_method', ind.dataSourceValue) : getDictLabel('complete_system_performance_filling_method', ind.dataSourceValue) }}
                      </Badge>
                    </div>
                    <div class="flex items-baseline gap-2">
                      <span class="text-xl font-bold text-slate-800 font-mono">
                        {{ getMockValues(i).mockAchieved.toLocaleString() }}
                      </span>
                      <span class="text-xs text-slate-400 font-mono">
                        / {{ getMockValues(i).mockTarget.toLocaleString() || '100,000' }} (目标)
                      </span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-lg font-bold text-blue-600 font-mono">
                      {{ getMockValues(i).progressPercent.toFixed(1) }}%
                    </span>
                  </div>
                </div>
                <!-- Progress bar -->
                <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-blue-500 rounded-full transition-all duration-1000"
                    :style="{ width: `${getMockValues(i).progressPercent}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="space-y-1.5">
              <Label class="text-sm font-semibold text-slate-700 items-center gap-2">
                今日工作总结与明日计划
              </Label>
              <textarea
                class="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400  disabled:cursor-not-allowed disabled:opacity-50 resize-none h-20 shadow-sm"
                placeholder="工作总结..."
              />
            </div>
          </div>
          <Button class="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm mt-4">
            提交今日日报
          </Button>
        </div>
      </ScrollArea>
      <DialogFooter class="mt-4">
        <Button
          variant="outline"
          @click="emit('close')"
        >
          取消
        </Button>
        <Button
          class="bg-emerald-600 hover:bg-emerald-700 text-white"
          :disabled="isSaving"
          @click="handleConfirm"
        >
          {{ isSaving ? '保存中...' : '已确认，界面无误' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
