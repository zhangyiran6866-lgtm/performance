import request from '@/utils/request';

/**
 * PerformanceDailyTemplateSaveReqVO，日报模板创建 Request VO
 */
export interface Request {
    /**
     * ID
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

/**
 * DailyReportSaveReqVO，日报保存请求 VO
 */
export interface DailyReportSaveReqVO {
    id?: number;
    cycleId: number;
    dailyTemplateId: number;
    reportDate: string;
    workSummary?: string;
    tomorrowPlan?: string;
    status?: number; // 0:草稿 1:已提交
    items?: PerformanceDailyReportItemReqVO[];
    [property: string]: any;
}

/**
 * PerformanceDailyReportItemReqVO，日报指标项明细
 */
export interface PerformanceDailyReportItemReqVO {
    id?: number;
    userTargetId: number;
    indicatorId: number;
    indicatorName: string;
    indicatorValue: string;
    unit?: string;
    [property: string]: any;
}

/**
 * DailyReportFieldRecordReqVO，外勤记录请求 VO
 */
export interface DailyReportFieldRecordReqVO {
    startTime: string;
    endTime: string;
    location: string;
    address: string;
    description: string;
    [property: string]: any;
}

/**
 * DailyReportTargetIndicatorVO，派发指标项 Response VO
 */
export interface DailyReportTargetIndicatorVO {
    id: number;
    name: string;
    indicatorRuleName?: string;
    type: string; // 'number_step' | 'number' | 'switch' | 'text_score' | 'select'
    unit?: string;
    source?: string;
    placeholder?: string;
    options?: { label: string; value: any }[];
    autoFetch?: boolean;
    value?: any;
    [property: string]: any;
}

// 保存日报
export const saveDailyReport = (data: DailyReportSaveReqVO) => {
    return request({
        url: '/human/performance/daily-report/save',
        method: 'post',
        data,
    });
};

// 获取日报历史记录（用于日历展示）
export const getDailyReportHistory = (data: { reportDate: string[] ,userId:number}) => {
    return request({
        url: '/human/performance/daily-report/history',
        method: 'post',
        data
    });
};

// 根据 ID 获取日报详情
export const getDailyReport = (id: number) => {
    return request({
        url: '/human/performance/daily-report/get',
        method: 'get',
        params: { id }
    });
};

// 获取派发指标列表
export const getTargetIndicators = (params?: any) => {
    return request({
        url: '/human/performance/daily-report/list-target-indicators',
        method: 'get',
        params
    });
};


/**
 * PerformanceDailyReportItemDetailRespVO
 */
export interface PerformanceDailyReportItemDetailRespVO {
    /**
     * 创建时间
     */
    createTime?: Date;
    /**
     * 周期 ID
     */
    cycleId?: number;
    /**
     * 所属日报模板 ID
     */
    dailyTemplateId?: number;
    /**
     * 明细项 ID
     */
    id?: number;
    /**
     * 指标 ID
     */
    indicatorId?: number;
    /**
     * 指标名称
     */
    indicatorName?: string;
    /**
     * 指标值
     */
    indicatorValue?: number;
    /**
     * 日报归属日期
     */
    reportDate?: Date;
    /**
     * 日报 ID
     */
    reportId?: number;
    /**
     * 状态 (0:草稿 1:已提交)
     */
    status?: number;
    /**
     * 提交时间
     */
    submittedTime?: Date;
    /**
     * 目标值
     */
    targetValue?: number;
    /**
     * 明日工作计划
     */
    tomorrowPlan?: string;
    /**
     * 单位
     */
    unit?: string;
    /**
     * 用户 ID
     */
    userId?: number;
    /**
     * 用户姓名
     */
    username?: string;
    /**
     * 今日工作总结
     */
    workSummary?: string;
    [property: string]: any;
}

// 查询用户日报明细列表
export const getDailyReportList = (params: {userId:number,cycleId:number,indicatorId:number}) => {
    return request({
        url: '/human/performance/daily-report/list-by-indicator',
        method: 'get',
        params
    });
};