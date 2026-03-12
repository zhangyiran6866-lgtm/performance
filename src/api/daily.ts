import request from '@/utils/request';

/**
 * PerformanceDailyTemplateSaveReqVO，日报模板创建 Request VO
 */
export interface Request {
    /**
     * 绩效模版ID
     */
    id?: number;
    /**
     * 模版指标列表
     */
    items: PerformanceDailyTemplateItemReqVO[];
    remark?: string;
    /**
     * 绩效模版ID
     */
    templateId: number;
    [property: string]: any;
}

/**
 * PerformanceDailyTemplateItemReqVO，模版指标列表
 */
export interface PerformanceDailyTemplateItemReqVO {
    /**
     * 指标别名
     */
    indicatorAlias: string;
    /**
     * 指标ID
     */
    indicatorId: number;
    /**
     * 指标名称
     */
    indicatorName: string;
    /**
     * 模板指标ID
     */
    templateItemId: number;
    [property: string]: any;
}

// 创建日报模板
export const createDailyTemplate = (data: Request) => {
    return request({
        url: '/human/performance/daily-template/save',
        method: 'post',
        data,
    });
};