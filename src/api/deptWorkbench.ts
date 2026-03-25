import request from '@/utils/request'

export interface GetDepartmentPerformanceParams {
    /**
     * 部门Id
     */
    deptId: string;
    /**
     * 页码，从 1 开始
     */
    pageNo: string;
    /**
     * 每页条数，最大值为 100
     */
    pageSize: string;
    [property: string]: any;
}

/**
 * PerformanceCycleRespVO，管理后台 - 考核周期主表 Response VO
 */
export interface PerformanceCycleRespVO {
    /**
     * 已确认完成人数
     */
    completedCount: number;
    /**
     * 创建时间
     */
    createTime: Date;
    /**
     * 周期维度 (MONTHLY/QUARTERLY/YEARLY)
     */
    cycleType: string;
    /**
     * 考核结束日期
     */
    endDate: Date;
    /**
     * 主键ID
     */
    id: number;
    /**
     * 周期名称 (如: 2026年3月份月度绩效考核)
     */
    name: string;
    /**
     * 部门主管已设定目标人数
     */
    notConfirmCount: number;
    /**
     * 员工确认签署人数
     */
    signedCount: number;
    /**
     * 所处阶段 (to_be_opened: 待开启,GOAL_SETTING:目标设定/系统配置, PUBLISHED:下达签报, RATING:打分阶段, ARCHIVED:已归档)
     */
    stage: string;
    /**
     * 考核开始日期
     */
    startDate: Date;
    /**
     * 团队成员总数
     */
    teamMemberCount: number;
    /**
     * 模版数量
     */
    templateCount: number;
    /**
     * 模版名称
     */
    templateName: string;
    templateRespVOS?: PerformanceCycleTemplateRespVO[];
    /**
     * 待确认完成人数
     */
    toConfirmCount: number;
    /**
     * 待设定人数
     */
    toSetCount: number;
    /**
     * 周期总人数
     */
    totalCount: number;
    [property: string]: any;
}

/**
 * PerformanceCycleTemplateRespVO
 */
export interface PerformanceCycleTemplateRespVO {
    /**
     * 考核周期id
     */
    cycleId: number;
    /**
     * 指标数量
     */
    indicatorCount?: number;
    /**
     * 模版id
     */
    templateId: number;
    /**
     * 模版指标明细
     */
    templateItemRespVOS?: PerformanceTemplateItemRespVO[];
    /**
     * 模版名称
     */
    templateName: string;
    /**
     * 用户数量
     */
    userCount?: number;
    [property: string]: any;
}

/**
 * PerformanceTemplateItemRespVO，管理后台 - 模板-指标关联明细 Response VO
 */
export interface PerformanceTemplateItemRespVO {
    /**
     * 指标分类
     */
    category?: string;
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
     * 关联的计分规则描述
     */
    indicatorRuleDescription?: string;
    /**
     * 关联的计分规则名称
     */
    indicatorRuleName?: string;
    /**
     * 指标分类
     */
    indicatorType?: string;
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


// 获取部门考核结果分页接口
export function getDepartmentPerformance(params: GetDepartmentPerformanceParams) {
    return request({
        url: '/human/performance-cycle/getDeptCycleList',
        method: 'get',
        params,
    });
}

/**
 * PerformanceUserReqVO
 */
export interface GetDepartmentUserTargetParams {
    /**
     * 考核周期ID
     */
    cycleId: number;
    /**
     * 用户ID
     */
    userId: number;
    [property: string]: any;
}


/**
 * PerformanceUserIndicatorRespVO
 */
export interface PerformanceUserIndicatorRespVO {
    /**
     * 模版项
     */
    items?: PerformanceUserTargetDO[];
    /**
     * 岗位名称
     */
    position?: string;
    /**
     * 模版id
     */
    templateId?: number;
    /**
     * 模版名称
     */
    templateName?: string;
    /**
     * 用户目标状态
     */
    temporaryStatus?: number;
    /**
     * 用户id
     */
    userId?: number;
    /**
     * 用户名称
     */
    userName?: string;
    [property: string]: any;
}

/**
 * PerformanceUserTargetDO，模版项
 */
export interface PerformanceUserTargetDO {
    createTime?: Date;
    creator?: string;
    cycleId?: number;
    dataAggregation?: string;
    dataAggregationValue?: string;
    deleted?: boolean;
    deptId?: number;
    deptName?: string;
    id?: number;
    indicatorId?: number;
    indicatorName?: string;
    indicatorType?: string;
    month?: string;
    status?: number;
    targetValue?: string;
    templateId?: number;
    updater?: string;
    updateTime?: Date;
    userId?: number;
    userName?: string;
    weight?: number;
    [property: string]: any;
}

// 获取部门人员考核指标
export function getDepartmentUserTarget(data: GetDepartmentUserTargetParams) {
    return request({
        url: '/human/performance-user-target/selectObjList',
        method: 'post',
        data,
    });
}

/**
 * PerformanceUserTargetSaveReqVO，管理后台 - 绩效派发目标设定新增/修改 Request VO
 */
export interface PerformanceUserTargetSaveReqVO {
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

// 部门人员考核目标设定暂存
export function saveDepartmentUserTarget(data: Array<PerformanceUserTargetSaveReqVO>) {
    return request({
        url: '/human/performance-user-target/updateList',
        method: 'post',
        data,
    });
}


/**
 * PerformanceCycleRespVO，管理后台 - 考核周期主表 Response VO
 */
export interface PerformanceCycleRespVO {
    /**
     * 已确认完成人数
     */
    completedCount: number;
    /**
     * 创建时间
     */
    createTime: Date;
    /**
     * 周期维度 (MONTHLY/QUARTERLY/YEARLY)
     */
    cycleType: string;
    /**
     * 考核结束日期
     */
    endDate: Date;
    /**
     * 主键ID
     */
    id: number;
    /**
     * 周期名称 (如: 2026年3月份月度绩效考核)
     */
    name: string;
    /**
     * 部门主管已设定目标人数
     */
    notConfirmCount: number;
    /**
     * 员工确认签署人数
     */
    signedCount: number;
    /**
     * 所处阶段 (to_be_opened: 待开启,GOAL_SETTING:目标设定/系统配置, PUBLISHED:下达签报, RATING:打分阶段, ARCHIVED:已归档)
     */
    stage: string;
    /**
     * 考核开始日期
     */
    startDate: Date;
    /**
     * 团队成员总数
     */
    teamMemberCount: number;
    /**
     * 模版数量
     */
    templateCount: number;
    /**
     * 模版名称
     */
    templateName: string;
    /**
     * 待确认完成人数
     */
    toConfirmCount: number;
    /**
     * 待设定人数
     */
    toSetCount: number;
    /**
     * 周期总人数
     */
    totalCount: number;
}

// 查询团队目标设定进度
export function getDepartmentUserTargetProgress(params:{cycleId: number,deptId: number}) {
    return request({
        url: '/human/performance-cycle/getPerformanceCycleInfo',
        method: 'get',
        params,
    });
}

// 团队目标下发确认
export function confirmDepartmentUserTarget(params:{cycleId: number,userId: number}) {
    return request({
        url: '/human/performance-user-target/singleDispatch',
        method: 'get',
        params,
    });
}