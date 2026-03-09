<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Search, CheckCircle2, Loader2 } from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getIndicatorList } from '@/api/library';

const props = defineProps<{
  isOpen: boolean
}>();

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'add', selected: any[]): void
  (e: 'update:isOpen', value: boolean): void
}>();

const search = ref('');
const selectedIds = ref<string[]>([]);
const libraryIndicators = ref<any[]>([]);
const loading = ref(false);

const internalOpen = computed({
  get: () => props.isOpen,
  set: (val) => emit('update:isOpen', val),
});

const fetchLibraryIndicators = async () => {
  loading.value = true;
  try {
    const res: any = await getIndicatorList({});
    if (res.code === 0 && res.data) {
      libraryIndicators.value = res.data.map((item: any) => ({
        ...item,
        dimension: item.category,
        ruleType: item.indicatorRuleName || '通用计分',
        ruleCode: item.indicatorRuleCode || '',
      }));
    }
  } catch (error) {
    console.error('Failed to fetch indicators:', error);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      fetchLibraryIndicators();
      selectedIds.value = []; // Reset selection on open
    }
  },
);

const filteredIndicators = computed(() => {
  return libraryIndicators.value.filter(
    (ind) => ind.name.includes(search.value) || (ind.dimension && ind.dimension.includes(search.value)),
  );
});

const handleToggle = (id: string) => {
  const finalId = String(id);
  if (selectedIds.value.includes(finalId)) {
    selectedIds.value = selectedIds.value.filter((i) => i !== finalId);
  } else {
    selectedIds.value.push(finalId);
  }
};

const handleConfirm = () => {
  const selectedItems = libraryIndicators.value.filter((ind) =>
    selectedIds.value.includes(String(ind.id)),
  );
  emit('add', selectedItems);
  selectedIds.value = []; // reset
  emit('close');
};

const getDimensionColor = (category: string) => {
  switch (category) {
    case '销售业绩':
      return 'bg-red-50 text-red-500 border-red-100';
    case '产品力':
      return 'bg-orange-50 text-orange-500 border-orange-100';
    case '市场指标':
      return 'bg-blue-50 text-blue-500 border-blue-100';
    case '渠道力':
      return 'bg-indigo-50 text-indigo-500 border-indigo-100';
    case '费用管理':
      return 'bg-emerald-50 text-emerald-500 border-emerald-100';
    case '组织力':
      return 'bg-purple-50 text-purple-500 border-purple-100';
    case '行动计划':
      return 'bg-cyan-50 text-cyan-500 border-cyan-100';
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200';
  }
};

const handleCancel = () => {
  selectedIds.value = [];
  emit('close');
};
</script>

<template>
  <Dialog v-model:open="internalOpen">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>从企业指标库选取指标</DialogTitle>
        <DialogDescription>
          搜索并勾选您想加入到当前考核模板中的指标，加入后您可以在模板中配置它们的权重与数据来源。
        </DialogDescription>
      </DialogHeader>

      <div class="flex items-center gap-3 py-1">
        <div class="relative flex-1">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            v-model="search"
            placeholder="搜索指标名称或归属维度..."
            class="pl-9"
          />
        </div>
      </div>

      <div class="border rounded-md">
        <div
          class="bg-slate-50 border-b px-4 py-2 flex justify-between text-xs font-semibold text-slate-500"
        >
          <span>可选指标列表</span>
          <div class="flex items-center">
            <Loader2
              v-if="loading"
              class="h-3 w-3 animate-spin mr-2"
            />
            <span class="text-blue-600">已选 {{ selectedIds.length }} 项</span>
            <span class="mx-2 text-slate-300">|</span>
            <span class="text-slate-400 font-normal">库内共计 {{ libraryIndicators.length }} 项</span>
          </div>
        </div>
        <ScrollArea class="h-[300px]">
          <div class="p-2 space-y-1">
            <div
              v-for="ind in filteredIndicators"
              :key="ind.id"
              :class="[
                'flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all border',
                selectedIds.includes(String(ind.id))
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200',
              ]"
              @click="handleToggle(String(ind.id))"
            >
              <div
                :class="[
                  'flex items-center justify-center h-5 w-5 rounded-full border',
                  selectedIds.includes(String(ind.id))
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-slate-300',
                ]"
              >
                <CheckCircle2
                  v-if="selectedIds.includes(String(ind.id))"
                  class="h-3.5 w-3.5 text-white"
                />
              </div>
              <div class="flex flex-col flex-1 pl-1">
                <span
                  :class="[
                    'font-medium',
                    selectedIds.includes(String(ind.id)) ? 'text-blue-900' : 'text-slate-700',
                  ]"
                >
                  {{ ind.name }}
                </span>
                <div class="flex items-center gap-2.5 mt-1.5">
                  <Badge
                    variant="outline"
                    :class="['text-[10px] h-4.5 px-1.5 font-bold border', getDimensionColor(ind.dimension)]"
                  >
                    {{ ind.dimension }}
                  </Badge>
                  <span class="text-[11px] text-slate-500/80 font-medium">计分规则: <span class="text-slate-700">{{ ind.ruleType }}</span></span>
                </div>
              </div>
            </div>
            <div
              v-if="filteredIndicators.length === 0 && !loading"
              class="text-center py-10 text-slate-500 text-sm"
            >
              未找到对应的指标项
            </div>
          </div>
        </ScrollArea>
      </div>

      <DialogFooter class="mt-4">
        <Button
          variant="outline"
          @click="handleCancel"
        >
          取消
        </Button>
        <Button
          class="bg-blue-600 hover:bg-blue-700 text-white"
          :disabled="selectedIds.length === 0"
          @click="handleConfirm"
        >
          确认添加 ({{ selectedIds.length }})
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
