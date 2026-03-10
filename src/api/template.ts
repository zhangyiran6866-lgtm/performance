import request from '@/utils/request';

/**
 * PerformanceTemplateSaveReqVO，管理后台 - 绩效考核模板新增/修改 Request VO
 */
export interface templateReqVOS {
    /**
     * 适用部门ID
     */
    deptId: number[];
    /**
     * 考核频次(month:月,quarter:季度,year:年)
     */
    evaluationFrequency?: string;
    /**
     * 主键ID
     */
    id?: number;
    /**
     * 模板名称 (如: 销售专员标准考核模板)
     */
    name: string;
    /**
     * 摘要说明
     */
    remark?: string;
    /**
     * 模板-指标关联明细请求
     */
    templateReqVOS?: PerformanceIndicatorTemplateReqVO[];
    /**
     * 适用用户ID
     */
    userId: number[];
    [property: string]: any;
}

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
     * 模板-指标关联明细
     */
    templateItemRespVOS?: PerformanceTemplateItemRespVO[];
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


/**
 * PerformanceTemplateItemRespVO，管理后台 - 模板-指标关联明细 Response VO
 */
export interface PerformanceTemplateItemRespVO {
    /**
     * 创建时间
     */
    createTime: Date;
    /**
     * 数据汇聚(system:系统抓取,complete:手动填写)
     */
    dataAggregation?: string;
    /**
     * 数据汇聚值(sum:月度累加,月度平均:avg.....)
     */
    dataAggregationValue?: string;
    /**
     * 主键ID
     */
    id: number;
    /**
     * 关联的指标ID
     */
    indicatorId: number;
    /**
     * 指标名称
     */
    indicatorName?: string;
    /**
     * 该项指标满分 (通常定量100，当前定性主管评价要求为20)
     */
    maxScore: number;
    /**
     * 应用的计分规则ID (覆写指标库中的默认规则)
     */
    ruleId: number;
    /**
     * 排序序号
     */
    sortOrder?: number;
    /**
     * 目标考核基准值
     */
    targetValue?: string;
    /**
     * 所属模板ID
     */
    templateId: number;
    /**
     * 权重(百分比，定性综合评价不填本项则为空)
     */
    weight?: number;
    [property: string]: any;
}

/**
 * PerformanceIndicatorTemplateReqVO，模板-指标关联明细请求
 */
export interface PerformanceIndicatorTemplateReqVO {
    /**
     * 数据聚合方式
     */
    dataAggregation: string;
    /**
     * 数据聚合方式值
     */
    dataAggregationValue: string;
    /**
     * 指标ID
     */
    indicatorId: number;
    /**
     * 指标名称
     */
    indicatorName?: string;
    /**
     * 规则ID
     */
    ruleId: number;
    /**
     * 排序
     */
    sortOrder: number;
    /**
     * 目标考核基数
     */
    targetValue: string;
    /**
     * 主键ID
     */
    templateId?: number;
    /**
     * 权重
     */
    weight: number;
    [property: string]: any;
}

// 新增绩效考核模板
export function createTemplate(data: templateReqVOS) {
  return request({
    url: '/human/performance-template/create',
    method: 'post',
    data
  });
}

// 编辑绩效考核模板
export function updateTemplate(data: templateReqVOS) {
  return request({
    url: '/human/performance-template/update',
    method: 'put',
    data
  });
}

// 获取绩效考核模板详情
export function getTemplate(id: number) {
  return request({
    url: `/human/performance-template/get?id=${id}`,
    method: 'get'
  });
}

// 获取绩效考核模板分页列表
export function getTemplatePage(params: any) {
  return request({
    url: '/human/performance-template/page',
    method: 'get',
    params
  });
}

// 查看绩效考核模板详情
export function getTemplateDetail(id: number) {
  return request({
    url: `/human/performance-template/get?id=${id}`,
    method: 'get'
  });
}

// 绩效考核模板更新状态
export function updateTemplateStatus(data: { id: number, status: number }) {
  return request({
    url: `/human/performance-template/updateTemplateStatus`,
    method: 'post',
    data
  });
}

// 删除绩效考核模板
export function deleteTemplate(id: number) {
  return request({
    url: `/human/performance-template/delete?id=${id}`,
    method: 'delete',
  });
}