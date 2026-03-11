import request from '@/utils/request';

export interface IndicatorVO {
  id?: number | string;
  name: string;
  category: string;
  description?: string;
  ruleId?: number | string;
  evaluationCycle?: string;
  indicatorRuleName?: string;
  indicatorRuleDescription?: string;
  nature?: number;
  unit?: string;
}

export interface PageParam {
  pageNo?: number;
  pageSize?: number;
  name?: string;
  category?: string;
}

// 获取绩效计分策略/规则库列表
export function getScoreRuleList() {
  return request({
    url: '/human/performance-indicator-rule/list',
    method: 'get',
  });
}

// 获取绩效指标分页
export function getIndicatorPage(params: PageParam) {
  return request({
    url: '/human/performance-indicator/page',
    method: 'get',
    params,
  });
}

// 获取绩效指标不分页
export function getIndicatorList(params: any) {
  return request({
    url: '/human/performance-indicator/list',
    method: 'get',
    params,
  });
}

// 创建绩效指标
export function createIndicator(data: IndicatorVO) {
  return request({
    url: '/human/performance-indicator/create',
    method: 'post',
    data,
  });
}

// 编辑绩效指标
export function editIndicator(data: IndicatorVO) {
  return request({
    url: '/human/performance-indicator/update',
    method: 'put',
    data,
  });
}

// 删除绩效指标
export function deleteIndicator(id: number) {
  return request({
    url: `/human/performance-indicator/delete?id=${id}`,
    method: 'delete',
  });
}

