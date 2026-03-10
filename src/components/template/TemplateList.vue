<!--
 * @author Zyr
 * @date 2026-03-06 15:25:00
 * @description 调优表格列表弹性布局容器。
 * @lines ~10
-->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { Plus, Search, FileEdit, Trash2, PowerOff, Power, MoreHorizontal, Eye } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getTemplatePage, updateTemplateStatus, deleteTemplate } from '@/api/template';
import { getStrDictOptions } from '@/utils/dict';

const search = ref('');
const templates = ref<PerformanceTemplateRespVO[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);

/**
 * PerformanceTemplateRespVO，管理后台 - 绩效考核模板 Response VO
 */
export interface PerformanceTemplateRespVO {
    /**
     * 创建时间
     */
    createTime: Date;
    /**
     * 适用部门ID
     */
    deptId: number[];
    /**
     * 适用部门名称 (冗余)
     */
    deptName?: string;
    /**
     * 考核频次(month:月,quarter:季度,year:年)
     */
    evaluationFrequency?: string;
    /**
     * 主键ID
     */
    id: number;
    /**
     * 指标数量
     */
    indicatorCount: number;
    /**
     * 模板名称 (如: 销售专员标准考核模板)
     */
    name: string;
    /**
     * 模板编号
     */
    no?: string;
    /**
     * 摘要说明
     */
    remark?: string;
    /**
     * 状态 (1:草稿 2:已生效 3:已归档)
     */
    status?: number;
    /**
     * 总权重
     */
    totalWeight: number;
    /**
     * 适用用户ID
     */
    userId: number[];
    /**
     * 适用用户名称 (冗余)
     */
    userName?: string;
    [property: string]: any;
}


const fetchTemplates = async () => {
  loading.value = true;
  try {
    const res = await getTemplatePage({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      name: search.value,
    });
    const data = (res as any)?.data || res;
    templates.value = data.list || [];
    total.value = data.total || 0;
  } catch (error) {
    console.error('获取模板列表失败:', error);
    ElMessage.error('获取模板列表失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchTemplates();
});

watch([currentPage, pageSize], () => {
  fetchTemplates();
});

// 监听搜索词，重置页码并查询
let searchTimer: any = null;
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchTemplates();
  }, 300);
});

const getStatusBadge = (status: any) => {
  const options = getStrDictOptions('performance_template_status');
  const dict = options.find(opt => String(opt.value) === String(status));
  const label = dict ? dict.label : '未知';
  
  // 1:草稿 2:已生效 3:已归档
  const s = Number(status);
  switch (s) {
    case 2:
      return { text: label, class: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 font-normal' };
    case 1:
      return { text: label, class: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 font-normal' };
    case 3:
      return { text: label, class: 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 font-normal' };
    default:
      return { text: label, class: 'bg-slate-100 text-slate-400 border-slate-200 font-normal' };
  }
};

const formatDate = (date: string | number | Date) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

/**
 * 改变模板状态 (启用/停用)
 */
const handleChangeStatus = async (id: number, status: number) => {
  const isPublish = status === 2;
  const actionText = isPublish ? '发布启用' : '暂停/停用';
  
  try {
    await ElMessageBox.confirm(
      isPublish 
        ? '确认发布并启用该考核模板吗？启用后相关考核计划将可引用此模板。' 
        : '确认暂停/停用该考核模板吗？停用后将无法新建基于此模板的考核任务。',
      '状态变更确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: isPublish ? 'success' : 'warning',
      }
    );
    
    loading.value = true;
    await updateTemplateStatus({ id, status });
    ElMessage.success(`${actionText}成功`);
    fetchTemplates();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error(`${actionText}失败:`, error);
      ElMessage.error(error?.message || `${actionText}失败`);
    }
  } finally {
    loading.value = false;
  }
};

/**
 * 删除考核模板 (仅限草稿)
 */
const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      '确认删除该考核模板吗？删除后将无法恢复。',
      '删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error',
      }
    );
    
    loading.value = true;
    await deleteTemplate(id);
    ElMessage.success('删除成功');
    fetchTemplates();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error(error?.message || '删除失败');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex-1 flex flex-col space-y-6 min-h-0 w-full lg:max-w-none">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-slate-900 border-l-4 border-purple-600 pl-3">
          考核模板管理
        </h2>
        <p class="text-xs text-slate-500 mt-1 pl-4">
          基于指标元数据库搭建面向不同组织、不同岗位的绩效自动计算模板。
        </p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative w-full md:w-64">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            v-model="search"
            placeholder="搜索模板名称或编号..."
            class="pl-9 bg-white h-9 text-sm"
          />
        </div>
        <RouterLink to="/template/builder">
          <Button
            size="sm"
            class="shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus class="mr-1.5 h-4 w-4" />
            <span>新建考核模板</span>
          </Button>
        </RouterLink>
      </div>
    </div>

    <Card
      class="border-slate-200 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm w-full mx-auto"
      style="min-width: 1100px; min-height: 400px;"
    >
      <Table class="column-zebra-table">
        <TableHeader class="bg-slate-100/80">
          <TableRow class="hover:bg-transparent">
            <TableHead class="w-[320px] pl-8 font-bold text-slate-700">
              模板信息
            </TableHead>
            <TableHead class="min-w-[180px] font-bold text-slate-700">摘要说明</TableHead>
            <TableHead class="text-center w-[130px] font-bold text-slate-700">
              指标/权重
            </TableHead>
            <TableHead class="text-center w-[120px] font-bold text-slate-700">
              当前状态
            </TableHead>
            <TableHead class="w-[180px] font-bold text-slate-700">
              适用范围
            </TableHead>
            <TableHead class="text-right w-[160px] font-bold text-slate-700">
              最后修改时间
            </TableHead>
            <TableHead class="w-[80px] text-right pr-8 font-bold text-slate-700">
              操作
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody v-loading="loading">
          <TableRow
            v-for="template in templates"
            :key="template.id"
            class="hover:bg-slate-50/50 transition-colors"
          >
            <TableCell class="pl-8">
              <div class="flex flex-col">
                <span
                  class="font-semibold text-slate-800 line-clamp-1 text-sm"
                  :title="template.name"
                >
                  {{ template.name }}
                </span>
                <span class="text-xs text-slate-400 font-medium mt-0.5">ID: {{ template.no }}</span>
              </div>
            </TableCell>
            <TableCell>
              <span
                class="text-sm text-slate-600 line-clamp-2"
                :title="template.remark"
              >
                {{ template.remark || '-' }}
              </span>
            </TableCell>
            <TableCell class="text-center">
              <div class="flex flex-col items-center justify-center py-1">
                <div class="text-[13px] font-bold text-slate-700 mb-0.5">
                  {{ template.indicatorCount || 0 }} 个指标
                </div>
                <div 
                  :class="[
                    'text-[12px] font-bold border-b-2 px-0.5 leading-tight',
                    template.totalWeight === 100 
                      ? 'text-emerald-500 border-emerald-100' 
                      : 'text-amber-500 border-amber-100'
                  ]"
                >
                  权重 {{ template.totalWeight }}%
                </div>
              </div>
            </TableCell>
            <TableCell class="text-center">
              <Badge :class="[getStatusBadge(template.status).class, 'text-xs whitespace-nowrap px-2 py-0.5']">
                {{ getStatusBadge(template.status).text }}
              </Badge>
            </TableCell>
            <TableCell>
              <div 
                class="text-sm text-slate-600 truncate max-w-[160px]" 
                :title="template.deptName"
              >
                {{ template.deptName || '全公司适用' }}
              </div>
            </TableCell>
            <TableCell class="text-right text-xs text-slate-500 font-medium">
              {{ formatDate(template.createTime) }}
            </TableCell>
            <TableCell class="text-right pr-8">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    class="h-8 w-8 p-0"
                  >
                    <span class="sr-only">打开菜单</span>
                    <MoreHorizontal class="h-4 w-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  class="w-[160px]"
                >
                  <RouterLink :to="`/template/builder?id=${template.id}&mode=view`">
                    <DropdownMenuItem class="cursor-pointer">
                      <Eye class="mr-2 h-4 w-4 text-emerald-600" />
                      <span class="text-slate-700">查看模板配置</span>
                    </DropdownMenuItem>
                  </RouterLink>
                  <RouterLink 
                    v-if="template.status === 1"
                    :to="`/template/builder?id=${template.id}&mode=edit`"
                  >
                    <DropdownMenuItem class="cursor-pointer">
                      <FileEdit class="mr-2 h-4 w-4 text-blue-600" />
                      <span class="text-slate-700">编辑模板配置</span>
                    </DropdownMenuItem>
                  </RouterLink>
                  <DropdownMenuItem
                    v-if="template.status === 2"
                    class="cursor-pointer"
                    @click="handleChangeStatus(template.id, 3)"
                  >
                    <PowerOff class="mr-2 h-4 w-4 text-amber-600" />
                    <span class="text-slate-700">暂停/停用</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-else
                    class="cursor-pointer"
                    @click="handleChangeStatus(template.id, 2)"
                  >
                    <Power class="mr-2 h-4 w-4 text-emerald-600" />
                    <span class="text-slate-700">发布启用</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    v-if="template.status === 1"
                    class="cursor-pointer focus:bg-red-50"
                    @click="handleDelete(template.id)"
                  >
                    <Trash2 class="mr-2 h-4 w-4 text-red-600" />
                    <span class="text-red-600">删除草稿</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
          <TableRow v-if="templates.length === 0 && !loading">
            <TableCell
              colspan="7"
              class="h-24 text-center text-slate-500 text-sm"
            >
              未找到匹配的模板
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <div class="flex justify-center my-4 pb-4">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        background
        layout="prev, pager, next, total"
      />
    </div>
  </div>
</template>

<style scoped>
.column-zebra-table :deep(th:nth-child(even)),
.column-zebra-table :deep(td:nth-child(even)) {
  background-color: rgba(241, 245, 249, 0.4); /* slate-100/40 */
}

/* 确保悬停时仍然有良好的交互感 */
.column-zebra-table :deep(tr:hover td) {
  background-color: rgba(241, 245, 249, 0.8) !important;
}
</style>
