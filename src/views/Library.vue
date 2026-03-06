<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus, Search, FileText } from 'lucide-vue-next';
import IndicatorCard, { type IndicatorData } from '@/components/library/IndicatorCard.vue';
import IndicatorWizard from '@/components/library/IndicatorWizard.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getDictOptions } from '@/utils/dict';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const initialIndicators: IndicatorData[] = [];

const search = ref('');
const dimensionFilter = ref('all');
const ruleFilter = ref('all');
const indicators = ref<IndicatorData[]>(initialIndicators);
const isWizardOpen = ref(false);
const editingIndicator = ref<IndicatorData | null>(null);

const filtered = computed(() => {
  return indicators.value.filter((ind) => {
    const matchSearch = ind.name.includes(search.value);
    const matchDimension = dimensionFilter.value === 'all' || ind.category === dimensionFilter.value;
    const matchRule = ruleFilter.value === 'all' || ind.ruleType.includes(ruleFilter.value);
    return matchSearch && matchDimension && matchRule;
  });
});

const handleEdit = (indicator: IndicatorData) => {
  editingIndicator.value = indicator;
  isWizardOpen.value = true;
};

const handleAddNew = () => {
  editingIndicator.value = null;
  isWizardOpen.value = true;
};

const handleSave = (newInd: IndicatorData) => {
  if (editingIndicator.value) {
    indicators.value = indicators.value.map((i) =>
      i.id === newInd.id ? newInd : i,
    );
  } else {
    indicators.value = [
      { ...newInd, id: Date.now().toString() },
      ...indicators.value,
    ];
  }
  isWizardOpen.value = false;
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          企业指标元数据库
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          管理维护全公司所有业务及职能部门的考核考分元数据标准。
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative w-full md:w-56">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            v-model="search"
            placeholder="搜索指标名称..."
            class="pl-9 bg-white"
          />
        </div>

        <Select v-model="dimensionFilter">
          <SelectTrigger class="w-[140px] bg-white">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              全部分类
            </SelectItem>
            <SelectItem
              v-for="dict in getDictOptions('classification_performance_indicators_type')"
              :key="String(dict.value)"
              :value="dict.label"
            >
              {{ dict.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="ruleFilter">
          <SelectTrigger class="w-[140px] bg-white">
            <SelectValue placeholder="全部计分规则" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              全部计分规则
            </SelectItem>
            <SelectItem value="阶梯制">
              阶梯制
            </SelectItem>
            <SelectItem value="控制">
              预算扣分
            </SelectItem>
            <SelectItem value="二元">
              节点二元
            </SelectItem>
            <SelectItem value="定性">
              主观打分
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          class="shrink-0"
          @click="handleAddNew"
        >
          <Plus class="mr-1.5 h-4 w-4" />
          <span>新建指标</span>
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <IndicatorCard
        v-for="ind in filtered"
        :key="ind.id"
        :data="ind"
        @click="handleEdit(ind)"
      />
      
      <div
        v-if="filtered.length === 0"
        class="col-span-full flex flex-col items-center justify-center p-12 text-slate-500 border border-dashed rounded-lg bg-white"
      >
        <FileText class="h-8 w-8 mb-4 text-slate-300" />
        <p>未找到符合条件的指标</p>
      </div>
    </div>

    <IndicatorWizard
      v-model:is-open="isWizardOpen"
      :initial-data="editingIndicator"
      @save="handleSave"
    />
  </div>
</template>
