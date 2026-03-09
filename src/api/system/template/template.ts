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
    id: number;
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
    templateId: number;
    /**
     * 权重
     */
    weight: number;
    [property: string]: any;
}

// 获取绩效计分策略/规则库列表
export function createTemplate(data:templateReqVOS) {
  return request({
    url: '/human/performance-indicator-rule/list',
    method: 'post',
    data
  });
}