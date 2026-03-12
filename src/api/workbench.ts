import request from '@/utils/request';

export interface GetEmployeePerformanceParams {
    overallScore?: string;
    pageNo: string;
    /**
     * 每页条数，最大值为 100
     */
    pageSize: string;
    /**
     * 考核周期开始时间
     */
    startTime?: string;
    /**
     * 状态：0-待确认目标，1-已结案（对应页面卡片状态）
     */
    status?: string;
    /**
     * 用户ID（关联user.id）
     */
    userId?: string;
    [property: string]: any;
}

/**
 * PageResultPerformanceUserResultRespVO，分页结果
 */
export interface PageResultPerformanceUserResultRespVO {
    /**
     * 扩展数据
     */
    extra?: { [key: string]: { [key: string]: any } };
    /**
     * 数据
     */
    list: PerformanceUserResultRespVO[];
    /**
     * 总量
     */
    total: number;
    [property: string]: any;
}

/**
 * PerformanceUserResultRespVO，管理后台 - 员工考核结果 Response VO
 */
export interface PerformanceUserResultRespVO {
    /**
     * 周期ID（关联kpi_period.id）
     */
    cycleId: number;
    /**
     * 考核周期名称
     */
    cycleName?: string;
    /**
     * 考核周期结束时间
     */
    endTime: Date;
    /**
     * 等级（如A、B）
     */
    grade?: string;
    /**
     * 主键ID
     */
    id: number;
    /**
     * 综合评分（如82.3、91.5）
     */
    overallScore?: number;
    /**
     * 考核周期开始时间
     */
    startTime: Date;
    /**
     * 状态：0-待确认目标，1-已结案（对应页面卡片状态）
     */
    status: number;
    /**
     * 用户指标目标列表
     */
    targetRespVOList?: PerformanceUserTargetRespVO[];
    templateId?: number;
    /**
     * 考核模板名称
     */
    templateName?: string;
    /**
     * 用户ID（关联user.id）
     */
    userId: number;
    /**
     * 用户名称
     */
    userName?: string;
    [property: string]: any;
}

/**
 * PerformanceUserTargetRespVO，管理后台 - 绩效派发目标设定 Response VO
 */
export interface PerformanceUserTargetRespVO {
    /**
     * 创建时间
     */
    createTime: Date;
    /**
     * 周期ID
     */
    cycleId: number;
    /**
     * 主键ID
     */
    id: number;
    /**
     * 指标id
     */
    indicatorId: number;
    /**
     * 指标名称
     */
    indicatorName?: string;
    /**
     * 考核月份
     */
    month?: string;
    /**
     * 状态：0-待设定，1-待签署，2-已确认（对应页面右上角统计）
     */
    status?: boolean;
    /**
     * 目标数值（如：需达成的销售额、连带率）
     */
    targetValue?: string;
    /**
     * 模板ID（template.id）
     */
    templateId: number;
    /**
     * 用户ID（user.id）
     */
    userId: number;
    /**
     * 考核用户名称
     */
    userName?: string;
    /**
     * 指标权重
     */
    weight?: number;
    [property: string]: any;
}


// 获取员工考核结果分页接口
export function getEmployeePerformance(params: GetEmployeePerformanceParams) {
    return request({
        url: '/human/performance-user-result/page',
        method: 'get',
        params,
    });
}


