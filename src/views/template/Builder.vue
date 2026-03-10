<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  Calendar,
  Eye,
  TrendingUp,
  Filter,
  ArrowRight,
  Calculator,
  ChevronRight,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import IndicatorSelectorModal from '@/components/template/IndicatorSelectorModal.vue';
import DailyReportPreviewModal from '@/components/template/DailyReportPreviewModal.vue';
import { getSimpleDeptList, getUserByDept } from '@/api/system/dept/dept';
import { createTemplate, updateTemplate, getTemplate, updateTemplateStatus } from '@/api/template';
import type { templateReqVOS, PerformanceIndicatorTemplateReqVO } from '@/api/template';
import { handleTree } from '@/lib/utils';
import { getStrDictOptions } from '@/utils/dict';

interface Indicator {
  id: string;
  name: string;
  dimension: string;
  ruleType: string;
  ruleCode: string;
  weight: number;
  dataSourceType: string;
  dataSourceValue: string;
}

const router = useRouter();
const route = useRoute();

// 页面模式: 'create' | 'edit' | 'view'
const pageMode = computed(() => {
  const mode = route.query.mode as string;
  const id = route.query.id as string;
  
  if (mode === 'view') return 'view';
  if (id) return 'edit';
  return 'create';
});

const pageTitle = computed(() => {
  switch (pageMode.value) {
    case 'view': return '查看考核模板';
    case 'edit': return '编辑考核模板';
    case 'create':
    default:
      return '新建考核模板';
  }
});


const templateInfo = ref({
  name: '',
  description: '',
  applyTo: [] as number[],
  users: [] as number[],
  period: 'month',
});

const saving = ref(false);

const userList = ref<any[]>([]);
const deptTree = ref<any[]>([]);
const rootDeptIds = computed(() => deptTree.value.map(node => node.id));

const fetchUsersByDeptIds = async (deptIds: number[]) => {
  try {
    // 过滤掉 -1 (全公司适用) 等非真实 ID，如果需要的话
    const validIds = deptIds.filter(id => id > 0);
    if (validIds.length === 0) {
      userList.value = [];
      return;
    }
    const res = await getUserByDept({ deptIds: validIds });
    // 兼容后端返回格式
    const list = Array.isArray(res) ? res : (res as any).data;
    userList.value = Array.isArray(list) ? list : [];
    
    // 选取适用范围后，人员选项默认全选
    if (userList.value.length > 0) {
      templateInfo.value.users = userList.value.map(user => user.id);
    } else {
      templateInfo.value.users = [];
    }
  } catch (error) {
    userList.value = [];
  }
};

const isAllUsersSelected = computed(() => {
  return userList.value.length > 0 && templateInfo.value.users.length === userList.value.length;
});

const isUsersIndeterminate = computed(() => {
  return templateInfo.value.users.length > 0 && templateInfo.value.users.length < userList.value.length;
});

const handleSelectAllUsers = (val: any) => {
  if (val) {
    templateInfo.value.users = userList.value.map(user => user.id);
  } else {
    templateInfo.value.users = [];
  }
};

// 监听适用范围变化，更新人员列表
watch(
  () => templateInfo.value.applyTo,
  (newDeptIds: number[]) => {
    fetchUsersByDeptIds(newDeptIds);
  },
  { deep: true },
);

onMounted(async () => {
  try {
    const res = await getSimpleDeptList();
    // 兼容后端返回格式 { code: 0, data: [], msg: '' } 或直接返回数组
    const list = Array.isArray(res) ? res : (res as any).data;
    
    if (list && Array.isArray(list)) {
      const tree = handleTree(list, 'id', 'parentId');
      // 设置第一层级（根节点）为禁用选择状态，仅用于展开查看子部门
      deptTree.value = tree.map((node: any) => ({
        ...node,
        disabled: true
      }));
    } else {
      console.warn('Backend returned non-array data:', res);
      deptTree.value = [];
    }
  } catch (error) {
    console.error('Failed to fetch department list:', error);
  }
  
  // 初始加载一次人员列表
  if (templateInfo.value.applyTo.length > 0) {
    fetchUsersByDeptIds(templateInfo.value.applyTo);
  }

  // 加载模板详情 (编辑/查看模式)
  const id = route.query.id;
  if ((pageMode.value === 'edit' || pageMode.value === 'view') && id) {
    try {
      const res = await getTemplate(Number(id));
      const data = (res as any)?.data || res;
      if (data) {
        // 已生效的模板不允许编辑，强制切换为查看模式；草稿和已归档允许编辑
        if (data.status === 2 && pageMode.value === 'edit') {
          router.replace({ query: { ...route.query, mode: 'view' } });
          ElMessage.info('该模板已处于生效状态，无法直接修改，已切换为预览模式');
        }

        templateInfo.value = {
          name: data.name || '',
          description: data.remark || '',
          applyTo: data.deptId || [],
          users: data.userId || [],
          period: data.evaluationFrequency || 'month',
        };
        
        const items = data.templateItemRespVOS || data.templateReqVOS;
        if (items && Array.isArray(items)) {
          indicators.value = items.map((item: any) => ({
            id: String(item.indicatorId),
            name: item.indicatorName,
            dimension: item.category || '', 
            ruleType: item.indicatorRuleName || '', 
            ruleCode: item.indicatorRuleCode || '',
            weight: item.weight || 0,
            dataSourceType: item.dataAggregation || 'system',
            dataSourceValue: item.dataAggregationValue || '',
          }));
        }
        hasSaved.value = true;
      }
    } catch (error) {
      console.error('Failed to fetch template detail:', error);
      ElMessage.error('获取模板详情失败');
    }
  }
});

const indicators = ref<Indicator[]>([]);
const isModalOpen = ref(false);
const isPreviewOpen = ref(false);
const hasPreviewed = ref(false);
const hasSaved = ref(false);

// 监听数据变化，若有改动则重置保存状态
watch(
  [() => templateInfo.value, () => indicators.value],
  () => {
    hasSaved.value = false;
  },
  { deep: true },
);

const handleSave = async () => {
  // ====== 必填项校验 ======
  if (!templateInfo.value.name.trim()) {
    ElMessage.warning('请填写模板名称！');
    return;
  }
  if (!templateInfo.value.applyTo || templateInfo.value.applyTo.length === 0) {
    ElMessage.warning('请选择适用范围！');
    return;
  }
  if (!templateInfo.value.users || templateInfo.value.users.length === 0) {
    ElMessage.warning('请选取人员！');
    return;
  }
  if (indicators.value.length === 0) {
    ElMessage.warning('请至少添加一个考核指标！');
    return;
  }
  if (!isWeightValid.value) {
    ElMessage.warning('请确保所有指标权重合计为 100%！');
    return;
  }

  // ====== 组装请求数据 ======
  const templateReqVOSList: PerformanceIndicatorTemplateReqVO[] = indicators.value.map(
    (ind, index) => ({
      indicatorId: Number(ind.id),
      indicatorName: ind.name,
      weight: ind.weight,
      sortOrder: index + 1,
      ruleId: 0,
      dataAggregation: ind.dataSourceType,
      dataAggregationValue: ind.dataSourceValue,
      targetValue: '',
    }),
  );

  const requestData: templateReqVOS = {
    name: templateInfo.value.name.trim(),
    remark: templateInfo.value.description,
    deptId: templateInfo.value.applyTo,
    userId: templateInfo.value.users,
    evaluationFrequency: templateInfo.value.period,
    templateReqVOS: templateReqVOSList,
    status: 1, // 默认设为草稿状态
  };

  saving.value = true;
  try {
    if (pageMode.value === 'create') {
      // 新建模式
      const res = await createTemplate(requestData);
      // 后端返回新建的模板 ID 后，切换 URL 为编辑模式，后续再次保存走 updateTemplate
      const newId = (res as any)?.data ?? (res as any)?.id;
      if (newId) {
        router.replace({
          path: '/template/builder',
          query: { id: String(newId), mode: 'edit' },
        });
      }
      hasSaved.value = true;
      ElMessage.success('模板新建并保存草稿成功！');
      return newId;
    } else if (pageMode.value === 'edit') {
      // 编辑模式：将当前路由中的 id 写入请求体
      const id = Number(route.query.id);
      requestData.id = id;
      await updateTemplate(requestData);
      hasSaved.value = true;
      ElMessage.success('模板草稿更新成功！');
      return id;
    }
  } catch (error: any) {
    console.error('保存草稿失败:', error);
    ElMessage.error(error?.message || '保存草稿失败，请稍后重试！');
    return null;
  } finally {
    saving.value = false;
  }
  return null;
};

const handleAddIndicators = (selected: any[]) => {
  const existingIds = indicators.value.map((ind) => ind.id);
  const systemOptions = getStrDictOptions('system_performance_filling_method');
  const defaultSystemValue = systemOptions && systemOptions.length > 0 ? systemOptions[0].value : '';

  const newIndicators = selected
    .filter((ind) => !existingIds.includes(String(ind.id)))
    .map((ind) => ({
      id: String(ind.id),
      name: ind.name,
      dimension: ind.category || ind.dimension || '',
      ruleType: ind.indicatorRuleName || ind.ruleType || '',
      ruleCode: ind.indicatorRuleCode || ind.ruleCode || '',
      weight: 0,
      dataSourceType: 'system',
      dataSourceValue: defaultSystemValue,
    }));

  indicators.value = [...indicators.value, ...newIndicators];
};

const totalWeight = computed(() =>
  indicators.value.reduce((sum, ind) => sum + (ind.weight || 0), 0),
);
const isWeightValid = computed(() => totalWeight.value === 100);

const handleWeightChange = (id: string, value: number | null) => {
  const weight = typeof value === 'number' ? value : 0;
  indicators.value = indicators.value.map((ind) =>
    ind.id === id ? { ...ind, weight } : ind,
  );
};

const handleSourceTypeChange = (id: string, type: string) => {
  let defaultValue = '';
  if (type === 'system') {
    const options = getStrDictOptions('system_performance_filling_method');
    if (options && options.length > 0) {
      defaultValue = options[0].value;
    }
  }
  
  indicators.value = indicators.value.map((ind) =>
    ind.id === id ? { ...ind, dataSourceType: type, dataSourceValue: defaultValue } : ind,
  );
};

const handleSourceValueChange = (id: string, value: string) => {
  indicators.value = indicators.value.map((ind) =>
    ind.id === id ? { ...ind, dataSourceValue: value } : ind,
  );
};

const removeIndicator = (id: string) => {
  indicators.value = indicators.value.filter((ind) => ind.id !== id);
};

const goBack = () => router.push({ path: '/configuration', query: { tab: 'template' } });

const colors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-pink-500',
];
const lightColors = [
  'bg-blue-50 text-blue-600',
  'bg-emerald-50 text-emerald-600',
  'bg-amber-50 text-amber-600',
  'bg-purple-50 text-purple-600',
  'bg-pink-50 text-pink-600',
];
const textColors = [
  'text-blue-600',
  'text-emerald-600',
  'text-amber-600',
  'text-purple-600',
  'text-pink-600',
];

const handleConfirmPreview = () => {
  isPreviewOpen.value = false;
  hasPreviewed.value = true;
};

const handlePublish = () => {
  if (!isWeightValid.value) {
    ElMessage.warning('请先确保权重合计为100%!');
    return;
  }
  if (!hasPreviewed.value) {
    ElMessage.warning('请先点击【日报界面预览】确认最终下发到员工的界面无误!');
    return;
  }

  ElMessageBox.confirm(
    '考核模板发布后将立即下发至相关人员，且在生效周期内将无法再次更改各项指标配置及其权重。请问是否确认现在发布该模板？',
    '模板发布确认',
    {
      confirmButtonText: '确认发布',
      cancelButtonText: '暂不发布',
      type: 'warning',
      customClass: 'publish-confirm-box'
    }
  ).then(async () => {
    try {
      saving.value = true;
      
      let id = Number(route.query.id);
      
      // 如果有改动或者还没有保存过（没有 ID），先执行保存逻辑
      if (!hasSaved.value || !id) {
        const savedId = await handleSave();
        if (!savedId) return; // 保存失败则不继续
        id = Number(savedId);
      }

      await updateTemplateStatus({ id, status: 2 });
      ElMessage.success('正式发布成功，模板已下发并启用！');
      // 发布成功后延迟跳转回列表页
      setTimeout(() => {
        goBack();
      }, 1000);
    } catch (error: any) {
      console.error('发布失败:', error);
      ElMessage.error(error?.message || '发布失败，请重试');
    } finally {
      saving.value = false;
    }
  }).catch(() => {
    // 用户取消了发布
  });
};
</script>

<template>
  <div class="h-full flex flex-col w-full bg-slate-50/20">
    <!-- Header / Action Bar -->
    <div class="shrink-0 bg-white/70 backdrop-blur-md border-b border-slate-200/80 px-4 xl:px-6 py-3.5 z-50">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full mx-auto">
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            class="h-11 w-11 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            @click="goBack"
          >
            <ArrowLeft class="h-6 w-6" />
          </Button>
          <div>
            <h1 class="text-xl font-bold tracking-tight text-slate-900">
              {{ pageTitle }}
            </h1>
            <div class="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <Badge
                variant="outline"
                :class="[
                  'font-normal text-[10px] h-4',
                  pageMode === 'view' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  (hasSaved ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200')
                ]"
              >
                {{ pageMode === 'view' ? '查看模式' : (hasSaved ? '已保存' : '草稿中') }}
              </Badge>
              <span>{{ pageMode === 'view' ? '当前配置处于只读状态' : (hasSaved ? '所有更改已同步' : '未保存更改') }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <Button
            variant="outline"
            class="relative bg-white hover:bg-slate-50 text-blue-600 border-blue-200"
            @click="isPreviewOpen = true"
          >
            <Eye class="mr-2 h-4 w-4" />
            日报界面预览
            <span
              v-if="!hasPreviewed"
              class="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-red-500 animate-pulse border-2 border-white"
            />
          </Button>
          <Button
            v-if="pageMode !== 'view'"
            variant="outline"
            class="bg-white hover:bg-slate-50 text-slate-700"
            :disabled="saving"
            @click="handleSave"
          >
            <Save class="mr-2 h-4 w-4" :class="{ 'animate-spin': saving }" />
            {{ saving ? '保存中...' : '保存草稿' }}
          </Button>
          <Button
            v-if="pageMode !== 'view'"
            :class="[
               'shadow-sm',
               isWeightValid && hasPreviewed && hasSaved
                 ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                 : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
             ]"
             @click="handlePublish"
           >
             <Send class="mr-2 h-4 w-4" />
             正式发布并启用
           </Button>
        </div>
      </div>
    </div>

    <!-- Scrollable content: 桌面端左右分栏独立滚动 -->
    <div class="flex-1 overflow-y-auto xl:overflow-hidden w-full custom-scrollbar">
      <div class="xl:h-full xl:overflow-hidden w-full">
        <div class="xl:h-full xl:overflow-hidden grid grid-cols-1 xl:grid-cols-4 gap-6">
          <!-- Left Column: Editor -->
          <div class="xl:col-span-3 xl:h-full xl:overflow-y-auto xl:overflow-x-hidden custom-scrollbar">
            <div class="space-y-6 py-6 pb-20 pr-4">
              <Card class="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle class="text-base font-semibold">
                    1. 基础信息配置
                  </CardTitle>
                  <CardDescription>设置该模板的基本定义和适用范围。</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="space-y-2">
                    <Label
                      for="tpl-name"
                      class="text-slate-700 font-semibold"
                    >模板名称 <span class="text-red-500">*</span></Label>
                    <Input
                      id="tpl-name"
                      v-model="templateInfo.name"
                      :disabled="pageMode === 'view'"
                      placeholder="输入如: 2025年业务一部区域经理月度考核版"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label
                      for="tpl-desc"
                      class="text-slate-700 font-semibold"
                    >摘要说明</Label>
                    <Textarea
                      id="tpl-desc"
                      v-model="templateInfo.description"
                      :disabled="pageMode === 'view'"
                      placeholder="简要描述该模板的考核重点与适用人群..."
                      class="resize-none h-20"
                    />
                  </div>
                  <div class="flex flex-wrap gap-4">
                    <div class="flex-1 min-w-[240px] space-y-2">
                      <Label class="text-slate-700 font-semibold">标准考评频次 <span class="text-red-500">*</span></Label>
                      <Select v-model:model-value="templateInfo.period" :disabled="pageMode === 'view'">
                        <SelectTrigger class="bg-white w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            v-for="dict in getStrDictOptions('performance_evaluation_cycle')"
                            :key="dict.value"
                            :value="dict.value"
                          >
                            {{ dict.label }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div class="flex-1 min-w-[240px] space-y-2">
                      <Label class="text-slate-700 font-semibold">适用范围 <span class="text-red-500">*</span></Label>
                      <el-tree-select
                        v-model="templateInfo.applyTo"
                        :data="deptTree"
                        :props="{ label: 'name', value: 'id', children: 'children' }"
                        placeholder="请选择适用范围"
                        :disabled="pageMode === 'view'"
                        check-strictly
                        multiple
                        collapse-tags
                        collapse-tags-tooltip
                        check-on-click-node
                        filterable
                        node-key="id"
                        :default-expanded-keys="rootDeptIds"
                        :expand-on-click-node="false"
                        :fit-input-width="true"
                        class="w-full dept-tree-select"
                        style="width: 100%"
                        popper-class="apply-to-popper"
                        teleport="body"
                        clearable
                      >
                        <template #default="{ data }">
                          <div class="flex items-center justify-between w-full pr-2">
                            <span>{{ data.name }}</span>
                            <div
                              v-if="templateInfo.applyTo.includes(data.id)"
                              class="flex items-center justify-center text-emerald-500"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class="lucide lucide-check"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          </div>
                        </template>
                      </el-tree-select>
                    </div>
                    <div class="flex-1 min-w-[240px] space-y-2">
                      <Label class="text-slate-700 font-semibold">选取人员 <span class="text-red-500">*</span></Label>
                      <el-select
                        v-model="templateInfo.users"
                        multiple
                        filterable
                        :disabled="pageMode === 'view'"
                        collapse-tags
                        collapse-tags-tooltip
                        placeholder="请选择人员"
                        class="w-full user-select-custom"
                        style="width: 100%"
                        clearable
                      >
                        <el-option
                          v-for="user in userList"
                          :key="user.id"
                          :label="user.nickname"
                          :value="user.id"
                        >
                          <div class="flex items-center gap-2">
                            <el-checkbox
                              :model-value="templateInfo.users.includes(user.id)"
                              size="small"
                              style="pointer-events: none;"
                            />
                            <span class="text-slate-700 font-medium">{{ user.nickname }}</span>
                          </div>
                        </el-option>
                        <template #footer>
                          <div class="px-3 py-2 border-t border-slate-100 flex items-center justify-between bg-white sticky bottom-0 z-10">
                            <el-checkbox
                              :model-value="isAllUsersSelected"
                              :indeterminate="isUsersIndeterminate"
                              @change="handleSelectAllUsers"
                            >
                              <span class="text-xs font-bold text-slate-700">全选当前备选人员</span>
                            </el-checkbox>
                            <span class="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                              已选 {{ templateInfo.users.length }}/{{ userList.length }}
                            </span>
                          </div>
                        </template>
                      </el-select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <!-- Indicator Setup Card -->
              <Card class="shadow-sm border-slate-200">
                <CardHeader class="pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle class="text-base font-semibold">
                      2. 考核项权重与数据来源设置
                    </CardTitle>
                    <CardDescription class="mt-1">
                      从指标库中挑选对应的指标并分配权重(总和需等于100%)。
                    </CardDescription>
                  </div>
                  <Button
                    v-if="pageMode !== 'view'"
                    size="sm"
                    variant="outline"
                    class="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 shrink-0"
                    @click="isModalOpen = true"
                  >
                    <Plus class="h-4 w-4 mr-1.5" />
                    选取考核指标
                  </Button>
                </CardHeader>
                <CardContent>
                  <div class="space-y-3">
                    <div
                      v-if="indicators.length === 0"
                      class="flex flex-col items-center justify-center p-8 text-slate-500 border border-dashed border-slate-200 rounded-lg bg-slate-50/50"
                    >
                      <Calendar class="h-8 w-8 mb-3 text-slate-300" />
                      <p class="text-sm">
                        尚未添加任何指标
                      </p>
                      <Button
                        size="sm"
                        variant="link"
                        class="text-blue-600 h-auto p-0 mt-2"
                        @click="isModalOpen = true"
                      >
                        马上从库中选取
                      </Button>
                    </div>
                    <div
                      v-for="(ind, index) in indicators"
                      v-else
                      :key="ind.id"
                      class="relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden group"
                    >
                      <!-- Left colored border -->
                      <div :class="['absolute left-0 top-0 bottom-0 w-1.5', colors[index % colors.length]]" />

                      <div class="p-5 pl-6">
                        <!-- Top Section -->
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                          <div class="flex items-center gap-3">
                            <div
                              :class="[
                                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                                lightColors[index % lightColors.length],
                              ]"
                            >
                              <TrendingUp class="h-5 w-5" />
                            </div>
                            <div>
                              <h3 class="text-lg font-bold text-slate-900">
                                {{ ind.name }}
                              </h3>
                              <div
                                class="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium"
                              >
                                <span>性质: 数值</span>
                                <div class="w-px h-3 bg-slate-300" />
                                <Badge
                                  variant="outline"
                                  class="font-normal border-slate-200 bg-slate-50 h-5 px-1.5 text-[10px]"
                                >
                                  {{ ind.dimension }}
                                </Badge>
                                <div class="w-px h-3 bg-slate-300" />
                                <span :class="textColors[index % textColors.length]">
                                  权重: {{ ind.weight }}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div class="flex items-center gap-2 shrink-0">
                            <div class="flex items-center">
                              <el-input-number
                                :model-value="ind.weight"
                                :min="0"
                                :max="100"
                                :precision="0"
                                :disabled="pageMode === 'view'"
                                placeholder="权重"
                                class="weight-input-number"
                                @change="(val: number | null) => handleWeightChange(ind.id, val)"
                              >
                              <template #suffix>
        <span>%</span>
      </template>
    </el-input-number>
                              
                            </div>
                            <Button
                              v-if="pageMode !== 'view'"
                              variant="outline"
                              size="icon"
                              class="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200"
                              @click="removeIndicator(ind.id)"
                            >
                              <Trash2 class="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <!-- Bottom 3-step visualization -->
                        <div class="flex flex-col lg:flex-row gap-4 relative mt-2">
                          <!-- Step 1: Aggregation -->
                          <div class="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4">
                            <div
                              class="flex items-center gap-2 text-[11px] font-semibold text-slate-500 mb-3 tracking-wide"
                            >
                              <Filter class="h-3.5 w-3.5" />
                              1. 数据汇聚 (AGGREGATION)
                            </div>
                            <!-- Dropdown for data source type -->
                            <div class="mb-3">
                              <Select
                                :model-value="ind.dataSourceType"
                                :disabled="pageMode === 'view'"
                                @update:model-value="(v) => handleSourceTypeChange(ind.id, String(v))"
                              >
                                <SelectTrigger class="bg-white border-slate-200 shadow-sm font-semibold h-9 text-xs w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="system">
                                    通过系统接口预置
                                  </SelectItem>
                                  <SelectItem value="complete">
                                    员工手动逐日填报
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div class="h-[52px] flex flex-col justify-end">
                              <Select
                                v-if="ind.dataSourceType === 'complete'"
                                default-value="sum"
                                :disabled="pageMode === 'view'"
                              >
                                 <SelectTrigger
                                   class="bg-white border-slate-200 shadow-sm font-semibold h-9 text-xs text-slate-900 w-full"
                                 >
                                   <SelectValue />
                                 </SelectTrigger>
                                <SelectContent>
                                  <SelectItem
                                    v-for="dict in getStrDictOptions('complete_system_performance_filling_method')"
                                    :key="dict.value"
                                    :value="dict.value"
                                  >
                                    {{ dict.label }}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <div
                                v-else
                                class="bg-slate-100/70 border border-slate-200/50 rounded-md p-2.5 text-[11px] text-slate-500 text-center font-medium mx-auto w-full"
                              >
                                接口直连最终数据<br>无需配置加和方式
                              </div>
                            </div>
                            <div class="mt-3 pt-3 border-t border-slate-200 space-y-2">
                              <div class="text-xs text-slate-400 leading-relaxed">
                                <div
                                  v-if="ind.dataSourceType === 'complete'"
                                  class="flex items-center gap-1.5 mt-1.5"
                                >
                                  <Input
                                    placeholder="填写呈现给员工的字段指导文字..."
                                    :model-value="ind.dataSourceValue"
                                    :disabled="pageMode === 'view'"
                                    class="h-7 text-xs flex-1 border-slate-200 focus-visible:ring-1"
                                    @update:model-value="(v) => handleSourceValueChange(ind.id, String(v))"
                                  />
                                </div>
                                <div
                                  v-else
                                  class="flex items-center gap-1.5 mt-1.5"
                                >
                                  <Select
                                    :model-value="ind.dataSourceValue"
                                    :disabled="pageMode === 'view'"
                                    @update:model-value="(v) => handleSourceValueChange(ind.id, String(v))"
                                  >
                                    <SelectTrigger 
                                      :class="[
                                        'h-9 text-xs w-full bg-white border-slate-200 focus:ring-0 font-semibold',
                                        !ind.dataSourceValue ? 'text-slate-400' : 'text-slate-900'
                                      ]"
                                    >
                                      <SelectValue placeholder="" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem
                                        v-for="dict in getStrDictOptions('system_performance_filling_method')"
                                        :key="dict.value"
                                        :value="dict.value"
                                      >
                                        {{ dict.label }}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <p class="mt-2 text-[10px] text-slate-400 opacity-80">
                                  每天提取此项并自动叠加
                                </p>
                              </div>
                            </div>
                          </div>

                          <!-- Arrow Connection -->
                          <div class="hidden lg:flex items-center justify-center text-slate-300 px-0.5">
                            <ArrowRight class="h-5 w-5" />
                          </div>

                          <!-- Step 2: Target Comparison -->
                          <div class="flex-1 rounded-xl p-4 flex flex-col min-h-[140px] relative">
                            <!-- Background decoration -->
                            <div
                              class="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 rounded-xl"
                            />
                            <div class="absolute inset-0 border border-indigo-100/50 rounded-xl" />

                            <div class="relative z-10 w-full h-full flex flex-col">
                              <div
                                class="flex items-center gap-2 text-[11px] font-semibold text-indigo-500 mb-3 tracking-wide"
                              >
                                <ArrowRight class="h-3.5 w-3.5" />
                                2. 目标对比 (TARGET)
                              </div>

                               <div class="flex-1 flex items-center justify-center">
                                 <div
                                   class="bg-white/100 backdrop-blur-sm border border-indigo-200/80 px-8 py-5 rounded-2xl shadow-md w-[92%] md:w-auto relative group-hover:border-indigo-400 transition-all duration-300 transform group-hover:scale-[1.02]"
                                 >
                                   <div
                                     class="text-center font-extrabold text-slate-800 text-[14px] pb-2 whitespace-nowrap tracking-wide"
                                   >
                                     实际业务数值统计
                                   </div>
                                   <div class="h-1 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 w-full mb-2.5 rounded-full" />
                                   <div
                                     class="text-center font-extrabold text-indigo-600 text-[14px] whitespace-nowrap tracking-wide"
                                   >
                                     设定考核目标基数
                                   </div>
                                 </div>
                               </div>
                            </div>
                          </div>

                          <!-- Arrow Connection -->
                          <div class="hidden lg:flex items-center justify-center text-slate-300 px-0.5">
                            <ArrowRight class="h-5 w-5" />
                          </div>

                          <!-- Step 3: Scoring -->
                          <div class="flex-1 bg-emerald-50/40 border border-emerald-100 rounded-xl p-4">
                            <div
                              class="flex items-center gap-2 text-[11px] font-semibold text-emerald-600/70 mb-3 tracking-wide"
                            >
                              <Calculator class="h-3.5 w-3.5" />
                              3. 绩效转化 (SCORING)
                            </div>
                            <div
                              class="flex items-center justify-between bg-white border border-emerald-200/60 px-3 py-2.5 rounded-md shadow-sm font-medium text-emerald-800 text-xs"
                            >
                              <span class="truncate pr-2">{{ ind.ruleType }}</span>
                              <ChevronRight class="h-4 w-4 text-emerald-400 shrink-0" />
                            </div>
                            <p class="mt-3 text-[11px] text-slate-600/90 leading-relaxed font-medium">
                              当前配置为：100%达成得满分，线性浮动，未达标逐级递减的分数转化模型。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <!-- Right Column: 考核权重分析（桌面端固定不滚动） -->
          <div class="xl:col-span-1 xl:h-full xl:overflow-y-auto">
            <div class="space-y-4 py-6 pr-0">
              <Card class="shadow-sm border-slate-200">
                <CardHeader class="pb-3 bg-slate-50/50 border-b">
                  <CardTitle class="text-sm font-semibold flex items-center justify-between">
                    考核权重分析
                    <Badge
                      :variant="isWeightValid ? 'default' : 'destructive'"
                      :class="isWeightValid ? 'bg-emerald-500 hover:bg-emerald-600' : ''"
                    >
                      总计: {{ totalWeight }}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent class="pt-4 space-y-4">
                  <div
                    v-if="!isWeightValid"
                    :class="[
                      'text-xs p-3 rounded-md',
                      totalWeight > 100
                        ? 'bg-red-50 text-red-600 border border-red-100'
                        : 'bg-amber-50 text-amber-600 border border-amber-100',
                    ]"
                  >
                    ⚠️ {{ totalWeight > 100 ? `权重超标 ${totalWeight - 100}%` : `权重不足 100% (还差 ${100 - totalWeight}%)` }}
                    <br>请调整左侧表单中的各项权重，确保准确累加至100%后方可发布。
                  </div>

                  <div class="space-y-3">
                    <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      权重合计检测
                    </h4>
                    <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        v-for="(ind, i) in indicators"
                        :key="ind.id"
                        :style="{ width: `${(ind.weight / Math.max(100, totalWeight)) * 100}%` }"
                        :class="[colors[i % colors.length], 'h-full transition-all']"
                        :title="`${ind.name}: ${ind.weight}%`"
                      />
                    </div>
                    <div class="space-y-1.5 mt-3 max-h-48 overflow-y-auto pr-1">
                      <div
                        v-for="(ind, i) in indicators"
                        :key="ind.id"
                        class="flex justify-between items-center text-xs"
                      >
                        <span
                          class="text-slate-600 truncate max-w-[180px]"
                          :title="ind.name"
                        >
                          {{ i + 1 }}. {{ ind.name }}
                        </span>
                        <span class="font-semibold text-slate-700">{{ ind.weight }}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div class="text-xs text-slate-400 text-center px-4 leading-relaxed">
                所有的考核表单将会基于本模板动态生成。<br>每日数据将自动聚合以计算月底总评。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <IndicatorSelectorModal
      v-model:is-open="isModalOpen"
      @close="isModalOpen = false"
      @add="handleAddIndicators"
    />

    <DailyReportPreviewModal
      v-model:is-open="isPreviewOpen"
      :indicators="indicators"
      @close="isPreviewOpen = false"
      @confirm="handleConfirmPreview"
    />
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

/* 穿透 Scoped 限制，处理 Teleport 弹窗样式 */
</style>

<style>
/* =========================================
   el-tree-select 与 SelectTrigger 样式统一
   ========================================= */

/* 根元素撑满容器 */
.dept-tree-select,
.user-select-custom {
  display: block !important;
  width: 100% !important;
}

/* 强制隐藏多选模式下的 checkbox */
.dept-tree-select .el-checkbox {
  display: none !important;
}

/* 调整树节点的选中状态样式：仅保留 hover 态，移除原有的绿色文字和背景，通过插槽内的打钩图标体现选中状态 */
.apply-to-popper .el-tree-node.is-current > .el-tree-node__content {
  background-color: transparent !important;
  color: #0f172a !important; /* 恢复深色文字 */
  font-weight: 500 !important;
}

/* 隐藏 el-select 默认自带的蓝色对号按钮 */
.apply-to-popper .el-select-dropdown__item.is-selected::after,
.apply-to-popper .el-select__selected-icon {
  display: none !important;
}

.apply-to-popper .el-tree-node__content:hover {
  background-color: #f8fafc !important; /* 极浅灰 hover */
}

/* 确保节点内容区域铺满 */
.apply-to-popper .el-tree-node__content {
  height: 36px !important;
}

/* 触发器外壳：高度、边框、圆角、背景 完全对齐标准 h-10 的 SelectTrigger */
.dept-tree-select .el-select__wrapper,
.user-select-custom .el-select__wrapper {
  width: 100% !important;
  min-height: 40px !important; /* 对齐 h-10 */
  height: auto !important; /* 多选模式下高度自适应 */
  padding: 4px 12px !important;
  border-radius: 0.5rem !important; /* 对齐 rounded-md */
  background-color: #ffffff !important;
  box-shadow: 0 0 0 1px #e2e8f0 !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  color: #0f172a !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 强制所有内部文本子元素使用深色（兜底通配符） */
.dept-tree-select .el-select__wrapper span,
.dept-tree-select .el-select__wrapper input,
.user-select-custom .el-select__wrapper span,
.user-select-custom .el-select__wrapper input {
  color: #0f172a !important;
}

.dept-tree-select .el-select__wrapper:hover,
.user-select-custom .el-select__wrapper:hover {
  box-shadow: 0 0 0 1px #94a3b8 !important;
}

.dept-tree-select .el-select__wrapper.is-focused,
.user-select-custom .el-select__wrapper.is-focused {
  box-shadow: 0 0 0 2px hsl(221.2 83.2% 53.3%) !important;
}

/* 选中文本：覆盖所有可能的渲染容器 */
/* 1. 普通模式: selected-item */
.dept-tree-select .el-select__selected-item,
.user-select-custom .el-select__selected-item {
  color: #0f172a !important;
  font-size: 14px !important;
}

/* 2. filterable 模式：选中值渲染在 input 里 */
.dept-tree-select .el-select__input,
.user-select-custom .el-select__input {
  color: #0f172a !important;
  font-size: 14px !important;
}

/* 3. tag 模式（多选时渲染为 Tag） */
.dept-tree-select .el-tag,
.user-select-custom .el-tag {
  background-color: #f1f5f9 !important;
  border-color: #e2e8f0 !important;
  color: #475569 !important;
  height: 24px !important;
}

.dept-tree-select .el-tag .el-tag__close,
.user-select-custom .el-tag .el-tag__close {
  color: #94a3b8 !important;
}

.dept-tree-select .el-tag .el-tag__close:hover,
.user-select-custom .el-tag .el-tag__close:hover {
  color: #ef4444 !important;
  background-color: transparent !important;
}

/* placeholder：单独还原灰色，防止被通配 span 规则覆盖 */
.dept-tree-select .el-select__wrapper span.el-select__placeholder,
.dept-tree-select .el-select__placeholder,
.user-select-custom .el-select__wrapper span.el-select__placeholder,
.user-select-custom .el-select__placeholder {
  color: #94a3b8 !important;
  font-size: 14px !important;
}

.dept-tree-select .el-select__input::placeholder,
.user-select-custom .el-select__input::placeholder {
  color: #94a3b8 !important;
}

/* 下拉箭头颜色 */
.dept-tree-select .el-select__caret,
.user-select-custom .el-select__caret {
  color: #64748b !important;
}

/* el-tree-select 弹层：挂载到 body，不受父层 overflow 裁剪 */
.apply-to-popper {
  min-width: 200px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
  border-radius: 8px !important;
}

/* 滚动容器高度 */
.apply-to-popper .el-select-dropdown__wrap {
  max-height: 320px !important;
  overflow-y: auto !important;
}

.apply-to-popper .el-scrollbar__wrap {
  max-height: 320px !important;
  overflow-y: auto !important;
}

.apply-to-popper .el-scrollbar__view {
  overflow: visible !important;
}

/* 树节点高度自适应 */
.apply-to-popper .el-tree-node__content {
  height: auto !important;
  min-height: 34px;
  align-items: center;
  padding: 4px 0;
}

/* 标签文字：允许换行，展示完整部门名 */
.apply-to-popper .el-tree-node__label {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}

/* 搜索框区域 */
.apply-to-popper .el-select-dropdown__search-field {
  padding: 8px 12px;
}

/* 隐藏多选模式下的默认 checkmark，因为我们要用自定义 checkbox */
.user-select-custom + .el-select__popper .el-select-dropdown__item.is-selected::after,
.user-select-custom-dropdown .el-select-dropdown__item.is-selected::after {
  display: none !important;
}

/* 修正 el-option 内部布局 */
.user-select-custom .el-select-dropdown__item,
.el-select-dropdown__item {
  display: flex !important;
  align-items: center !important;
}

.user-select-custom .el-checkbox,
.el-select-dropdown__item .el-checkbox {
  margin-right: 0 !important;
  height: auto !important;
}

/* 权重输入框样式调整 */
.weight-input-number {
  width: 150px !important;
}

.weight-input-number :deep(.el-input__wrapper) {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  height: 36px;
  background-color: rgb(248 250 252 / 0.5) !important; /* bg-slate-50/50 */
  box-shadow: 0 0 0 1px #e2e8f0 inset !important; /* border-slate-200 */
}

.weight-input-number.is-focused :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #3b82f6 inset !important; /* blue-500 focus */
}

.weight-input-number :deep(.el-input__inner) {
  text-align: center !important;
  font-weight: 600 !important;
  color: #0f172a !important; /* slate-900 */
}
</style>
